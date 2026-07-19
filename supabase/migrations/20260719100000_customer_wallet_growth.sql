-- Customer app: real server-side wallet, referrals, premium, favorites.
--
-- Replaces the localStorage wallet ledger. Balances live in wallet_accounts
-- and can ONLY move through SECURITY DEFINER RPCs (or the service role, for
-- provider webhooks). Also closes a hole where any customer could mark their
-- own order paid without money moving (mark_order_paid is revoked).

-- ---------------------------------------------------------------------------
-- 1. Core wallet tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_accounts (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('topup','bonus','send','receive','order','referral','request','premium')),
  title TEXT NOT NULL,
  note TEXT,
  amount NUMERIC NOT NULL, -- positive = credit, negative = debit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user ON public.wallet_ledger(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.wallet_topups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('paystack','stripe')),
  provider_reference TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  credited_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.wallet_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL DEFAULT '',
  from_label TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid','cancelled','settled')),
  payer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.user_favorites (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, vendor_id)
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined','ordered')),
  reward_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rewarded_at TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- 2. Profile columns: premium plan + referral code
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS customer_plan TEXT NOT NULL DEFAULT 'basic';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS customer_plan_expires_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_customer_plan_check
    CHECK (customer_plan IN ('basic','naija_one'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

UPDATE public.profiles
SET referral_code = 'EAT' || UPPER(SUBSTR(MD5(id::text || COALESCE(created_at::text, '')), 1, 5))
WHERE referral_code IS NULL;

CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'EAT' || UPPER(SUBSTR(MD5(NEW.id::text || clock_timestamp()::text), 1, 5));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_referral_code ON public.profiles;
CREATE TRIGGER profiles_set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_referral_code();

-- ---------------------------------------------------------------------------
-- 3. RLS — balances and ledgers are read-only for their owner; every write
--    goes through the definer RPCs below (or service_role).
-- ---------------------------------------------------------------------------
ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_topups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own wallet" ON public.wallet_accounts;
CREATE POLICY "Users view own wallet" ON public.wallet_accounts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users view own ledger" ON public.wallet_ledger;
CREATE POLICY "Users view own ledger" ON public.wallet_ledger
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users view own topups" ON public.wallet_topups;
CREATE POLICY "Users view own topups" ON public.wallet_topups
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Requesters manage own requests" ON public.wallet_requests;
CREATE POLICY "Requesters manage own requests" ON public.wallet_requests
  FOR SELECT TO authenticated USING (requester_id = auth.uid() OR payer_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own favorites" ON public.user_favorites;
CREATE POLICY "Users manage own favorites" ON public.user_favorites
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users view own referrals" ON public.referrals;
CREATE POLICY "Users view own referrals" ON public.referrals
  FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referred_id = auth.uid());

DROP POLICY IF EXISTS "Admins view wallets" ON public.wallet_accounts;
CREATE POLICY "Admins view wallets" ON public.wallet_accounts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins view ledgers" ON public.wallet_ledger;
CREATE POLICY "Admins view ledgers" ON public.wallet_ledger
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.wallet_accounts, public.wallet_ledger, public.wallet_topups, public.wallet_requests, public.referrals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_favorites TO authenticated;
GRANT ALL ON public.wallet_accounts, public.wallet_ledger, public.wallet_topups, public.wallet_requests, public.user_favorites, public.referrals TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Internal helpers (not exposed to clients)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.wallet_ensure(p_user UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallet_accounts (user_id, currency)
  SELECT p_user, COALESCE((SELECT currency FROM public.profiles WHERE id = p_user), 'NGN')
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Move money for one user. Positive credits, negative debits (raises if the
-- balance would go negative). Appends the matching ledger row.
CREATE OR REPLACE FUNCTION public.wallet_move(
  p_user UUID, p_amount NUMERIC, p_type TEXT, p_title TEXT, p_note TEXT DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  PERFORM public.wallet_ensure(p_user);
  SELECT balance INTO v_balance FROM public.wallet_accounts WHERE user_id = p_user FOR UPDATE;
  IF v_balance + p_amount < 0 THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;
  UPDATE public.wallet_accounts
  SET balance = v_balance + p_amount, updated_at = now()
  WHERE user_id = p_user;
  INSERT INTO public.wallet_ledger (user_id, type, title, note, amount)
  VALUES (p_user, p_type, p_title, p_note, p_amount);
  RETURN v_balance + p_amount;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.wallet_ensure(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wallet_move(UUID, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wallet_ensure(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.wallet_move(UUID, NUMERIC, TEXT, TEXT, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Client-facing RPCs
-- ---------------------------------------------------------------------------

-- Balance (creates the account row on first call).
CREATE OR REPLACE FUNCTION public.wallet_get()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.wallet_accounts;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  PERFORM public.wallet_ensure(v_user);
  SELECT * INTO v_row FROM public.wallet_accounts WHERE user_id = v_user;
  RETURN jsonb_build_object('balance', v_row.balance, 'currency', v_row.currency);
END;
$$;

-- Send money to another user (atomic: debit + credit + notification).
CREATE OR REPLACE FUNCTION public.wallet_send(p_recipient UUID, p_amount NUMERIC, p_note TEXT DEFAULT NULL)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_sender_name TEXT;
  v_recipient_name TEXT;
  v_balance NUMERIC;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  IF p_recipient = v_user THEN RAISE EXCEPTION 'You cannot send money to yourself'; END IF;
  SELECT COALESCE(NULLIF(full_name, ''), 'A friend') INTO v_sender_name FROM public.profiles WHERE id = v_user;
  SELECT COALESCE(NULLIF(full_name, ''), 'recipient') INTO v_recipient_name FROM public.profiles WHERE id = p_recipient;
  IF v_recipient_name IS NULL THEN RAISE EXCEPTION 'Recipient not found'; END IF;

  v_balance := public.wallet_move(v_user, -p_amount, 'send', 'Sent to ' || v_recipient_name, p_note);
  PERFORM public.wallet_move(p_recipient, p_amount, 'receive', 'Received from ' || v_sender_name, p_note);

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_recipient, 'You received money', v_sender_name || ' sent you a wallet transfer.', 'wallet', '/wallet');

  RETURN v_balance;
END;
$$;

-- Pay one of your own unpaid orders from the wallet (atomic debit + mark paid).
CREATE OR REPLACE FUNCTION public.wallet_pay_order(p_order_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_order RECORD;
  v_balance NUMERIC;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT o.*, v.name AS vendor_name INTO v_order
  FROM public.orders o LEFT JOIN public.vendors v ON v.id = o.vendor_id
  WHERE o.id = p_order_id;
  IF v_order IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.customer_id <> v_user THEN RAISE EXCEPTION 'This is not your order'; END IF;
  IF v_order.payment_status = 'paid' THEN RAISE EXCEPTION 'Order is already paid'; END IF;

  v_balance := public.wallet_move(
    v_user, -v_order.total, 'order',
    'Order — ' || COALESCE(v_order.vendor_name, 'vendor'),
    '#' || SUBSTR(p_order_id::text, 1, 8)
  );

  PERFORM set_config('app.bypass_order_money_guard', 'true', true);
  UPDATE public.orders SET payment_status = 'paid' WHERE id = p_order_id;

  RETURN v_balance;
END;
$$;

-- Generic platform charge (meal plans, chef bookings, …). Debits the caller.
CREATE OR REPLACE FUNCTION public.wallet_charge(p_amount NUMERIC, p_title TEXT, p_note TEXT DEFAULT NULL)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  RETURN public.wallet_move(v_user, -p_amount, 'order', COALESCE(p_title, 'Purchase'), p_note);
END;
$$;

-- Money requests -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.wallet_request_create(p_amount NUMERIC, p_reason TEXT DEFAULT '', p_from TEXT DEFAULT NULL)
RETURNS public.wallet_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.wallet_requests;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;
  INSERT INTO public.wallet_requests (code, requester_id, amount, reason, from_label)
  VALUES (UPPER(SUBSTR(MD5(gen_random_uuid()::text), 1, 6)), v_user, p_amount, COALESCE(p_reason, ''), NULLIF(TRIM(COALESCE(p_from, '')), ''))
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- Look up an open request by its share code (the code is the capability).
CREATE OR REPLACE FUNCTION public.wallet_request_lookup(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row RECORD;
BEGIN
  SELECT r.id, r.code, r.amount, r.reason, r.status, r.created_at,
         COALESCE(NULLIF(p.full_name, ''), 'A Naija Eats user') AS requester_name
  INTO v_row
  FROM public.wallet_requests r JOIN public.profiles p ON p.id = r.requester_id
  WHERE r.code = UPPER(TRIM(p_code));
  IF v_row IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  RETURN to_jsonb(v_row);
END;
$$;

-- Pay someone's request by code: debits the payer, credits the requester.
CREATE OR REPLACE FUNCTION public.wallet_request_pay(p_code TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_req public.wallet_requests;
  v_payer_name TEXT;
  v_balance NUMERIC;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO v_req FROM public.wallet_requests WHERE code = UPPER(TRIM(p_code)) FOR UPDATE;
  IF v_req IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF v_req.status <> 'open' THEN RAISE EXCEPTION 'This request is no longer open'; END IF;
  IF v_req.requester_id = v_user THEN RAISE EXCEPTION 'You cannot pay your own request'; END IF;

  SELECT COALESCE(NULLIF(full_name, ''), 'Someone') INTO v_payer_name FROM public.profiles WHERE id = v_user;

  v_balance := public.wallet_move(v_user, -v_req.amount, 'send', 'Paid request', v_req.reason);
  PERFORM public.wallet_move(v_req.requester_id, v_req.amount, 'request', 'Request paid by ' || v_payer_name, v_req.reason);

  UPDATE public.wallet_requests
  SET status = 'paid', payer_id = v_user, paid_at = now()
  WHERE id = v_req.id;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (v_req.requester_id, 'Request paid', v_payer_name || ' paid your money request.', 'wallet', '/wallet');

  RETURN v_balance;
END;
$$;

-- Requester bookkeeping: cancel an open request, or mark it settled outside
-- the app (no wallet movement — honesty by design).
CREATE OR REPLACE FUNCTION public.wallet_request_mark(p_id UUID, p_status TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF p_status NOT IN ('cancelled','settled') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.wallet_requests
  SET status = p_status, paid_at = CASE WHEN p_status = 'settled' THEN now() ELSE paid_at END
  WHERE id = p_id AND requester_id = v_user AND status = 'open';
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found or not open'; END IF;
END;
$$;

-- Premium subscription (paid from the wallet; price fixed server-side).
CREATE OR REPLACE FUNCTION public.purchase_premium(p_cadence TEXT, p_region TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_price NUMERIC;
  v_days INTEGER;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF p_cadence NOT IN ('monthly','yearly') THEN RAISE EXCEPTION 'Invalid cadence'; END IF;
  IF p_region NOT IN ('NG','UK') THEN RAISE EXCEPTION 'Invalid region'; END IF;

  v_price := CASE
    WHEN p_region = 'NG' AND p_cadence = 'monthly' THEN 5000
    WHEN p_region = 'NG' AND p_cadence = 'yearly' THEN 48000
    WHEN p_region = 'UK' AND p_cadence = 'monthly' THEN 9.99
    ELSE 95.88
  END;
  v_days := CASE WHEN p_cadence = 'monthly' THEN 30 ELSE 365 END;

  PERFORM public.wallet_move(v_user, -v_price, 'premium', 'Naija One — ' || p_cadence, NULL);

  UPDATE public.profiles
  SET customer_plan = 'naija_one',
      customer_plan_expires_at = GREATEST(COALESCE(customer_plan_expires_at, now()), now()) + (v_days || ' days')::interval
  WHERE id = v_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_premium()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  UPDATE public.profiles SET customer_plan = 'basic', customer_plan_expires_at = NULL WHERE id = auth.uid();
END;
$$;

-- Referrals ------------------------------------------------------------------
-- Called once by a new user with a friend's code: links the referral and
-- gives the new user a ₦2,000 welcome credit.
CREATE OR REPLACE FUNCTION public.apply_referral_code(p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_referrer UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT id INTO v_referrer FROM public.profiles WHERE referral_code = UPPER(TRIM(p_code));
  IF v_referrer IS NULL THEN RAISE EXCEPTION 'That referral code does not exist'; END IF;
  IF v_referrer = v_user THEN RAISE EXCEPTION 'You cannot use your own code'; END IF;
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = v_user) THEN
    RAISE EXCEPTION 'A referral code has already been applied to this account';
  END IF;
  IF EXISTS (SELECT 1 FROM public.orders WHERE customer_id = v_user) THEN
    RAISE EXCEPTION 'Referral codes are for new accounts that have not ordered yet';
  END IF;

  INSERT INTO public.referrals (referrer_id, referred_id, code, status)
  VALUES (v_referrer, v_user, UPPER(TRIM(p_code)), 'joined');

  PERFORM public.wallet_move(v_user, 2000, 'bonus', 'Welcome bonus', 'Referral code ' || UPPER(TRIM(p_code)));

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (v_referrer, 'Your invite was used', 'A friend joined Naija Eats with your code. You earn when they order!', 'referral', '/referrals');
END;
$$;

-- Reward the referrer when the referred friend's first order is delivered.
CREATE OR REPLACE FUNCTION public.reward_referral_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ref public.referrals;
  v_reward NUMERIC;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    SELECT * INTO v_ref FROM public.referrals
    WHERE referred_id = NEW.customer_id AND status = 'joined'
    FOR UPDATE;
    IF FOUND THEN
      v_reward := LEAST(COALESCE(NEW.total, 0), 8000);
      IF v_reward > 0 THEN
        PERFORM public.wallet_move(v_ref.referrer_id, v_reward, 'referral', 'Referral reward', 'Your friend completed their first order');
      END IF;
      UPDATE public.referrals
      SET status = 'ordered', reward_amount = v_reward, rewarded_at = now()
      WHERE id = v_ref.id;
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (v_ref.referrer_id, 'Referral reward earned', 'Your friend ordered — the reward is in your wallet.', 'referral', '/wallet');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_delivered_reward_referral ON public.orders;
CREATE TRIGGER on_order_delivered_reward_referral
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.reward_referral_on_delivery();

-- ---------------------------------------------------------------------------
-- 6. Grants + close the mark_order_paid hole
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.wallet_get() TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_send(UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_pay_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_charge(NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_request_create(NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_request_lookup(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_request_pay(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_request_mark(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_premium(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_premium() TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_referral_code(TEXT) TO authenticated;

-- Orders can no longer be marked paid without money actually moving.
REVOKE EXECUTE ON FUNCTION public.mark_order_paid(UUID) FROM authenticated;

NOTIFY pgrst, 'reload schema';
