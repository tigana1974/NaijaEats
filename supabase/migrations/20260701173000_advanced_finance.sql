-- Track E: Advanced Finance tables

CREATE TYPE public.invoice_status AS ENUM ('draft', 'unpaid', 'paid', 'overdue');
CREATE TYPE public.financing_status AS ENUM ('pending', 'approved', 'active', 'repaid', 'defaulted', 'rejected');

CREATE TABLE IF NOT EXISTS public.vendor_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    status public.invoice_status NOT NULL DEFAULT 'draft',
    total_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
    commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    payout_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    due_date DATE,
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_financing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    status public.financing_status NOT NULL DEFAULT 'pending',
    principal_amount NUMERIC(10,2) NOT NULL,
    interest_rate NUMERIC(5,2) NOT NULL DEFAULT 5.00, -- percentage
    repaid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    daily_deduction_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00, -- percentage of daily sales to deduct
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_financing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Admins can do anything
CREATE POLICY "Admins manage invoices" ON public.vendor_invoices FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins manage financing" ON public.vendor_financing FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins manage settings" ON public.platform_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Vendors can view their own stuff
CREATE POLICY "Vendors view own invoices" ON public.vendor_invoices FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())
);

CREATE POLICY "Vendors view own financing" ON public.vendor_financing FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())
);

-- Public read for platform settings (so apps can read tax rates, etc)
CREATE POLICY "Public read settings" ON public.platform_settings FOR SELECT USING (true);

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value) VALUES
('invoice_settings', '{"tax_rate_percent": 7.5, "default_commission_percent": 15, "invoice_generation_day": 1, "payment_terms_days": 14}')
ON CONFLICT (key) DO NOTHING;
