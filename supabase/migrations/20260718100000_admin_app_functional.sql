-- Admin app: make every module functional.
-- 1. profiles.email (admin lists need it; backfilled from auth.users)
-- 2. FKs so PostgREST can embed profiles on payouts / bank_accounts
-- 3. store_holidays (holiday hours module)
-- 4. user_devices (device/session tracking module)
-- 5. dispatch_campaign() RPC (in-app campaign delivery via notifications)

-- ---------------------------------------------------------------------------
-- 1. profiles.email
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND p.email IS NULL;

-- Keep it populated for future signups regardless of trigger ordering.
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL THEN
    SELECT u.email INTO NEW.email FROM auth.users u WHERE u.id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_email ON public.profiles;
CREATE TRIGGER profiles_sync_email
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_email();

-- ---------------------------------------------------------------------------
-- 2. FKs to profiles for PostgREST embedded joins (data already satisfies
--    these because profiles.id references auth.users(id)).
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE public.payouts
    ADD CONSTRAINT payouts_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.bank_accounts
    ADD CONSTRAINT bank_accounts_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
          WHEN undefined_table THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 3. store_holidays — closures and special hours (vendor_id NULL = platform-wide)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT true,
  open_time TIME,
  close_time TIME,
  reason TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_holidays_date ON public.store_holidays(date);

ALTER TABLE public.store_holidays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read holidays" ON public.store_holidays;
CREATE POLICY "Anyone can read holidays" ON public.store_holidays
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Vendors manage own holidays" ON public.store_holidays;
CREATE POLICY "Vendors manage own holidays" ON public.store_holidays
  FOR ALL TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage holidays" ON public.store_holidays;
CREATE POLICY "Admins manage holidays" ON public.store_holidays
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_holidays TO authenticated;
GRANT ALL ON public.store_holidays TO service_role;

-- ---------------------------------------------------------------------------
-- 4. user_devices — one row per (user, browser/device), refreshed on app load
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,           -- client-generated, stored in localStorage
  device_label TEXT NOT NULL DEFAULT 'Unknown device',
  device_type TEXT NOT NULL DEFAULT 'desktop' CHECK (device_type IN ('desktop','mobile','tablet')),
  user_agent TEXT,
  app_version TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_last_seen ON public.user_devices(last_seen_at DESC);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own devices" ON public.user_devices;
CREATE POLICY "Users manage own devices" ON public.user_devices
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND revoked = false);

DROP POLICY IF EXISTS "Admins manage all devices" ON public.user_devices;
CREATE POLICY "Admins manage all devices" ON public.user_devices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_devices TO authenticated;
GRANT ALL ON public.user_devices TO service_role;

-- ---------------------------------------------------------------------------
-- 5. dispatch_campaign — deliver an in-app campaign as notifications.
--    Runs as definer so it may insert notifications for other users;
--    explicitly restricted to admins.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dispatch_campaign(p_campaign_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_campaign RECORD;
  v_count INTEGER := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can dispatch campaigns';
  END IF;

  SELECT * INTO v_campaign FROM public.marketing_campaigns WHERE id = p_campaign_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign not found';
  END IF;
  IF v_campaign.status = 'completed' THEN
    RAISE EXCEPTION 'Campaign has already been sent';
  END IF;

  WITH spend AS (
    SELECT o.customer_id, SUM(o.total) AS total_spend, MAX(o.created_at) AS last_order
    FROM public.orders o
    WHERE o.status NOT IN ('cancelled')
    GROUP BY o.customer_id
  ),
  ranked AS (
    SELECT customer_id, NTILE(5) OVER (ORDER BY total_spend DESC) AS bucket, last_order
    FROM spend
  ),
  audience AS (
    SELECT p.id FROM public.profiles p
    WHERE CASE v_campaign.audience
      WHEN 'all' THEN true
      WHEN 'high_spenders' THEN p.id IN (SELECT customer_id FROM ranked WHERE bucket = 1)
      WHEN 'churned' THEN p.id IN (SELECT customer_id FROM ranked WHERE last_order < now() - INTERVAL '30 days')
      WHEN 'new' THEN p.created_at >= now() - INTERVAL '7 days'
      ELSE true
    END
  ),
  inserted AS (
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT a.id,
           COALESCE(v_campaign.subject, v_campaign.title),
           COALESCE(v_campaign.body, ''),
           'marketing',
           '/discover'
    FROM audience a
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM inserted;

  UPDATE public.marketing_campaigns
  SET status = 'completed', sent_count = v_count, scheduled_for = COALESCE(scheduled_for, now())
  WHERE id = p_campaign_id;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.dispatch_campaign(UUID) TO authenticated;
