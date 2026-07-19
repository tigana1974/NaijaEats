-- Track D: Marketing & Ads tables
-- NOTE: this migration originally referenced profiles.role (a column that does
-- not exist) so it never applied. Rewritten to be idempotent and to use
-- has_role(), matching the rest of the schema.

DO $$ BEGIN
  CREATE TYPE public.ad_status AS ENUM ('pending', 'active', 'paused', 'completed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'active', 'completed', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.campaign_type AS ENUM ('email', 'push', 'sms', 'in_app');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.vendor_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'banner', 'search_boost', 'featured'
    status public.ad_status NOT NULL DEFAULT 'pending',
    budget NUMERIC(10,2) NOT NULL DEFAULT 0,
    spent NUMERIC(10,2) NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type public.campaign_type NOT NULL DEFAULT 'email',
    audience TEXT NOT NULL, -- 'all', 'high_spenders', 'churned', 'new'
    status public.campaign_status NOT NULL DEFAULT 'draft',
    subject TEXT,
    body TEXT,
    sent_count INTEGER NOT NULL DEFAULT 0,
    open_count INTEGER NOT NULL DEFAULT 0,
    click_count INTEGER NOT NULL DEFAULT 0,
    scheduled_for TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.vendor_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage ads" ON public.vendor_ads;
CREATE POLICY "Admins manage ads" ON public.vendor_ads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage campaigns" ON public.marketing_campaigns;
CREATE POLICY "Admins manage campaigns" ON public.marketing_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Vendors manage own ads" ON public.vendor_ads;
CREATE POLICY "Vendors manage own ads" ON public.vendor_ads
  FOR ALL TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()))
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_ads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.vendor_ads TO service_role;
GRANT ALL ON public.marketing_campaigns TO service_role;
