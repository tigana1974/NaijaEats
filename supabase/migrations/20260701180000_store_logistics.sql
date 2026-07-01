-- Track F: Store Settings & Logistics tables

CREATE TYPE public.document_type AS ENUM ('id_card', 'business_license', 'hygiene_cert', 'tax_document', 'other');
CREATE TYPE public.document_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.dispute_type AS ENUM ('chargeback', 'undelivered', 'fake_account', 'quality_issue', 'other');
CREATE TYPE public.dispute_status AS ENUM ('open', 'under_review', 'resolved', 'closed');

CREATE TABLE IF NOT EXISTS public.vendor_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    type public.document_type NOT NULL,
    file_url TEXT NOT NULL,
    status public.document_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.fraud_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.dispute_type NOT NULL,
    status public.dispute_status NOT NULL DEFAULT 'open',
    amount_disputed NUMERIC(10,2),
    description TEXT,
    resolution TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_disputes ENABLE ROW LEVEL SECURITY;

-- Admins manage everything
CREATE POLICY "Admins manage documents" ON public.vendor_documents FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins manage disputes" ON public.fraud_disputes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Vendors view their own
CREATE POLICY "Vendors view own documents" ON public.vendor_documents FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())
);

CREATE POLICY "Vendors view own disputes" ON public.fraud_disputes FOR SELECT USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid())
);
