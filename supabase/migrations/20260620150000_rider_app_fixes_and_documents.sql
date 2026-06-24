-- Phase 4 (Rider App).
--
-- Bug 1: a rider's UPDATE policy on deliveries only checks `rider_id = auth.uid()`
-- in WITH CHECK — nothing stops a rider from also rewriting `fee`, `currency`,
-- `order_id`, `pickup_address`, or `dropoff_address` on the same call. Add a
-- trigger that, for non-admins, only allows status/rider_id/timestamp fields
-- to change.
CREATE OR REPLACE FUNCTION public.prevent_delivery_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.fee IS DISTINCT FROM OLD.fee
     OR NEW.currency IS DISTINCT FROM OLD.currency
     OR NEW.order_id IS DISTINCT FROM OLD.order_id
     OR NEW.pickup_address IS DISTINCT FROM OLD.pickup_address
     OR NEW.dropoff_address IS DISTINCT FROM OLD.dropoff_address THEN
    RAISE EXCEPTION 'Only admins can modify delivery pricing, routing, or order linkage';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_delivery_tampering() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS deliveries_prevent_tampering ON public.deliveries;
CREATE TRIGGER deliveries_prevent_tampering
BEFORE UPDATE ON public.deliveries
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delivery_tampering();

-- Bug 2: riders had no UPDATE policy on orders at all. rider.dashboard.tsx's
-- advance() tries to push orders.status to 'picked_up'/'delivered' alongside
-- the matching deliveries.status change, but that write was always silently
-- dropped by RLS — so every order delivered by a rider stayed stuck at
-- whatever status the vendor last set, even though the delivery itself
-- completed. This breaks customer order tracking, vendor order lists, and
-- the admin sales/performance status breakdown.
CREATE POLICY "Riders update order status for own delivery"
  ON public.orders FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'rider')
    AND EXISTS (SELECT 1 FROM public.deliveries d WHERE d.order_id = orders.id AND d.rider_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'rider')
    AND EXISTS (SELECT 1 FROM public.deliveries d WHERE d.order_id = orders.id AND d.rider_id = auth.uid())
  );

-- That new policy only re-uses the existing prevent_order_money_tampering
-- trigger for money/ownership fields — it doesn't stop a rider from setting
-- orders.status to something nonsensical (e.g. 'cancelled' on an order
-- they're mid-delivery on). Restrict riders to the two transitions their UI
-- actually performs.
CREATE OR REPLACE FUNCTION public.restrict_rider_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'vendor') THEN
    RETURN NEW;
  END IF;

  IF NOT public.has_role(auth.uid(), 'rider') THEN
    RETURN NEW; -- not a rider-driven update; other guards handle it
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

REVOKE EXECUTE ON FUNCTION public.restrict_rider_order_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_restrict_rider_status ON public.orders;
CREATE TRIGGER orders_restrict_rider_status
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.restrict_rider_order_status();

-- Rider document verification — same pattern as vendor_documents (Phase 1),
-- so the admin review workflow already built can be extended rather than
-- duplicated.
CREATE TYPE public.rider_document_type AS ENUM (
  'drivers_license',
  'vehicle_registration',
  'insurance',
  'id_document',
  'background_check',
  'other'
);

CREATE TABLE public.rider_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type public.rider_document_type NOT NULL,
  file_path TEXT NOT NULL, -- path within the 'rider-documents' storage bucket
  file_name TEXT NOT NULL,
  status public.vendor_document_status NOT NULL DEFAULT 'pending', -- reuse pending/verified/rejected
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rider_documents_rider_id ON public.rider_documents(rider_id);
CREATE INDEX idx_rider_documents_status ON public.rider_documents(status);

ALTER TABLE public.rider_documents ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER rider_documents_updated_at
BEFORE UPDATE ON public.rider_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Riders view own documents"
  ON public.rider_documents FOR SELECT TO authenticated
  USING (rider_id = auth.uid());

CREATE POLICY "Riders upload own documents"
  ON public.rider_documents FOR INSERT TO authenticated
  WITH CHECK (rider_id = auth.uid() AND public.has_role(auth.uid(), 'rider'));

CREATE POLICY "Riders delete own pending documents"
  ON public.rider_documents FOR DELETE TO authenticated
  USING (status = 'pending' AND rider_id = auth.uid());

CREATE POLICY "Admins manage all rider documents"
  ON public.rider_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.prevent_rider_document_self_review()
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
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.rider_id IS DISTINCT FROM OLD.rider_id THEN
    RAISE EXCEPTION 'Only admins can review rider documents';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_rider_document_self_review() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER rider_documents_prevent_self_review
BEFORE UPDATE ON public.rider_documents
FOR EACH ROW
EXECUTE FUNCTION public.prevent_rider_document_self_review();

INSERT INTO storage.buckets (id, name, public)
VALUES ('rider-documents', 'rider-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Riders upload own rider-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'rider-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Riders read own rider-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'rider-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Riders delete own rider-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'rider-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
