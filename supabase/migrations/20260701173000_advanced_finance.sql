-- Track E: Advanced Finance tables
-- NOTE: this migration originally (a) referenced profiles.role, which does not
-- exist, and (b) re-declared platform_settings with a conflicting key/value
-- shape (platform_settings is a single-row fixed-column table created in
-- 20260701150000_admin_settings.sql). Rewritten: key/value config now lives in
-- its own platform_config table, and policies use has_role().

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft', 'unpaid', 'paid', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.financing_status AS ENUM ('pending', 'approved', 'active', 'repaid', 'defaulted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.vendor_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    status public.invoice_status NOT NULL DEFAULT 'draft',
    total_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
    commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    payout_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'NGN',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    due_date DATE,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (vendor_id, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS public.vendor_financing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    status public.financing_status NOT NULL DEFAULT 'pending',
    principal_amount NUMERIC(10,2) NOT NULL,
    interest_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00, -- percentage
    repaid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    daily_deduction_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00, -- % of daily sales deducted
    currency TEXT NOT NULL DEFAULT 'NGN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id)
);

-- Key/value platform configuration (invoice settings, prep-time settings, …).
-- Deliberately separate from the single-row platform_settings table.
CREATE TABLE IF NOT EXISTS public.platform_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_financing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage invoices" ON public.vendor_invoices;
CREATE POLICY "Admins manage invoices" ON public.vendor_invoices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage financing" ON public.vendor_financing;
CREATE POLICY "Admins manage financing" ON public.vendor_financing
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage config" ON public.platform_config;
CREATE POLICY "Admins manage config" ON public.platform_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Vendors view own invoices" ON public.vendor_invoices;
CREATE POLICY "Vendors view own invoices" ON public.vendor_invoices
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Vendors view own financing" ON public.vendor_financing;
CREATE POLICY "Vendors view own financing" ON public.vendor_financing
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()));

-- Public read for platform config (apps read tax rates, prep defaults, etc.)
DROP POLICY IF EXISTS "Public read config" ON public.platform_config;
CREATE POLICY "Public read config" ON public.platform_config
  FOR SELECT USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_financing TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_config TO authenticated;
GRANT ALL ON public.vendor_invoices TO service_role;
GRANT ALL ON public.vendor_financing TO service_role;
GRANT ALL ON public.platform_config TO service_role;

INSERT INTO public.platform_config (key, value) VALUES
('invoice_settings', '{"tax_rate_percent": 7.5, "default_commission_percent": 15, "invoice_generation_day": 1, "payment_terms_days": 14, "company_name": "Naija Eats Ltd", "company_address": "123 Lagos Way, VI", "tax_number": "TIN-0000000"}'),
('prep_settings', '{"default_prep_time": 15, "busy_multiplier": 1.5, "auto_extend_backlog": true, "max_prep_time": 90}')
ON CONFLICT (key) DO NOTHING;
