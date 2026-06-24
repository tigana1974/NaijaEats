-- Phase 5 (Payments).
--
-- Adds: order payment_status tracking, a payments ledger (one row per
-- provider transaction attempt), and a payouts table for vendors/riders to
-- request and admins to settle payouts. Money actually moves through
-- Stripe (GBP) and Paystack (NGN); this schema only tracks status — the
-- webhooks below are the only thing allowed to mark a payment "paid".

-- 0. Critical fix needed for the webhook handlers to function at all:
-- the existing prevent_order_money_tampering / restrict_rider_order_status
-- triggers (Phases 0 & 4) treat "not has_role(auth.uid(),'admin')" as
-- "reject". Webhook handlers run with the service_role key, which has no
-- JWT and therefore auth.uid() IS NULL — those triggers would have blocked
-- the webhook's own legitimate write. Both REVOKE EXECUTE FROM authenticated
-- table-level grants already exclude anon, and only `authenticated` and
-- `service_role` can reach these triggers at all (per existing GRANTs), so
-- auth.uid() IS NULL here can only mean "trusted backend connection".
CREATE OR REPLACE FUNCTION public.prevent_order_money_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF current_setting('app.bypass_order_money_guard', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF NEW.subtotal IS DISTINCT FROM OLD.subtotal
     OR NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
     OR NEW.total IS DISTINCT FROM OLD.total
     OR NEW.currency IS DISTINCT FROM OLD.currency
     OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
     OR NEW.vendor_id IS DISTINCT FROM OLD.vendor_id
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    RAISE EXCEPTION 'Only admins or the payment webhook can modify order pricing, ownership, or payment status';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.restrict_rider_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service_role (webhook, etc.) — not a rider-driven update
  END IF;

  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor') THEN
    RETURN NEW;
  END IF;

  IF NOT public.has_role(auth.uid(), 'rider') THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'ready' AND NEW.status = 'picked_up')
      OR (OLD.status = 'picked_up' AND NEW.status = 'delivered')
    ) THEN
      RAISE EXCEPTION 'Riders may only move an order from ready to picked_up, or picked_up to delivered';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 1. Payment status lives on the order itself for cheap reads (vendor order
-- list, admin reports), with the full transaction history in `payments`.
CREATE TYPE public.order_payment_status AS ENUM ('unpaid', 'paid', 'refunded', 'failed');

ALTER TABLE public.orders
  ADD COLUMN payment_status public.order_payment_status NOT NULL DEFAULT 'unpaid';

-- 2. Payments ledger — one row per provider transaction attempt.
CREATE TYPE public.payment_provider AS ENUM ('paystack', 'stripe');
CREATE TYPE public.payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider public.payment_provider NOT NULL,
  provider_reference TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_reference)
);

CREATE INDEX idx_payments_order_id ON public.payments(order_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Read-only for everyone except admins/service_role. No INSERT/UPDATE/DELETE
-- grant is given to `authenticated` at all (see grants below) — the only
-- way a payments row is created or transitions to 'success' is the
-- server-side payment-initiation function and the provider webhooks, both
-- of which use the service_role key and therefore bypass RLS entirely.
CREATE POLICY "Customers view payments for own orders"
  ON public.payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payments.order_id AND o.customer_id = auth.uid()));

CREATE POLICY "Vendors view payments for their orders"
  ON public.payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.vendors v ON v.id = o.vendor_id
      WHERE o.id = payments.order_id AND v.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all payments"
  ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- 3. Payouts — vendors and riders request a cash-out; an admin settles it.
-- This tracks money moving OUT of the platform; it does not move money
-- itself (no provider integration here — that's a manual/banking step
-- until a payout provider is wired up).
CREATE TYPE public.payout_status AS ENUM ('requested', 'processing', 'paid', 'rejected');

CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL,
  status public.payout_status NOT NULL DEFAULT 'requested',
  payout_method TEXT, -- e.g. "Bank transfer — GTBank ****1234" (free text for now)
  admin_note TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payouts_user_id ON public.payouts(user_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER payouts_updated_at
BEFORE UPDATE ON public.payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users view own payout requests"
  ON public.payouts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Vendors and riders request own payouts"
  ON public.payouts FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (public.has_role(auth.uid(), 'vendor') OR public.has_role(auth.uid(), 'rider'))
  );

CREATE POLICY "Admins manage all payouts"
  ON public.payouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- A requester can never set their own status/processed_by/processed_at —
-- only admins move a payout out of 'requested'.
CREATE OR REPLACE FUNCTION public.prevent_payout_self_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.amount IS DISTINCT FROM OLD.amount
     OR NEW.currency IS DISTINCT FROM OLD.currency
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.processed_at IS DISTINCT FROM OLD.processed_at
     OR NEW.processed_by IS DISTINCT FROM OLD.processed_by
     OR NEW.admin_note IS DISTINCT FROM OLD.admin_note THEN
    RAISE EXCEPTION 'Only admins can change payout status, amount, or processing fields';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_payout_self_approval() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER payouts_prevent_self_approval
BEFORE UPDATE ON public.payouts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_payout_self_approval();
