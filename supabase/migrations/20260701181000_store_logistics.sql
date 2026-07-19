-- Track F: Fraud & dispute tracking
-- NOTE: original version referenced profiles.role (nonexistent) and re-declared
-- vendor_documents, which already exists (20260620130000) with a different
-- shape. Rewritten: only fraud_disputes is created here, policies use has_role().

DO $$ BEGIN
  CREATE TYPE public.dispute_type AS ENUM ('chargeback', 'undelivered', 'fake_account', 'quality_issue', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.dispute_status AS ENUM ('open', 'under_review', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

ALTER TABLE public.fraud_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage disputes" ON public.fraud_disputes;
CREATE POLICY "Admins manage disputes" ON public.fraud_disputes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Vendors view own disputes" ON public.fraud_disputes;
CREATE POLICY "Vendors view own disputes" ON public.fraud_disputes
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendors WHERE owner_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fraud_disputes TO authenticated;
GRANT ALL ON public.fraud_disputes TO service_role;
