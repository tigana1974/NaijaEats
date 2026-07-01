-- Track D: Marketing & Ads tables

CREATE TYPE public.ad_status AS ENUM ('pending', 'active', 'paused', 'completed', 'rejected');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'scheduled', 'active', 'completed', 'paused');
CREATE TYPE public.campaign_type AS ENUM ('email', 'push', 'sms', 'in_app');

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
    audience TEXT NOT NULL, -- e.g., 'all', 'inactive_30d', 'vip'
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

-- Admins can do anything
CREATE POLICY "Admins manage ads" ON public.vendor_ads FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins manage campaigns" ON public.marketing_campaigns FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Vendors can view and create their own ads
CREATE POLICY "Vendors manage own ads" ON public.vendor_ads FOR ALL USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())
) WITH CHECK (
    vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())
);

-- Insert some dummy data for the Admin UI to look good immediately
INSERT INTO public.marketing_campaigns (title, type, audience, status, subject, sent_count, open_count, click_count, scheduled_for)
VALUES 
    ('Summer Eats Discount', 'email', 'all_customers', 'completed', 'Get 20% off your next meal!', 4500, 2100, 850, now() - interval '5 days'),
    ('We miss you!', 'push', 'inactive_30d', 'active', 'Claim your free delivery', 1200, 400, 150, now() - interval '1 day'),
    ('VIP Exclusive Preview', 'email', 'vip_customers', 'scheduled', 'Try our new premium chefs', 0, 0, 0, now() + interval '2 days');
