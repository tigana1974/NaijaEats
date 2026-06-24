-- Phase 1 (Admin Dashboard): vendor document verification.
--
-- Adds a real backend for "document verification" rather than another
-- screen with nothing behind it. Vendors upload documents into a private
-- storage bucket; rows in vendor_documents track review status; admins
-- approve/reject. No document automatically changes vendor.status — that
-- stays a deliberate admin action on the existing vendor approval screen.

CREATE TYPE public.vendor_document_type AS ENUM (
  'business_registration',
  'id_document',
  'health_permit',
  'food_safety_certificate',
  'other'
);

CREATE TYPE public.vendor_document_status AS ENUM ('pending', 'verified', 'rejected');

CREATE TABLE public.vendor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  doc_type public.vendor_document_type NOT NULL,
  file_path TEXT NOT NULL, -- path within the 'vendor-documents' storage bucket
  file_name TEXT NOT NULL,
  status public.vendor_document_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_documents_vendor_id ON public.vendor_documents(vendor_id);
CREATE INDEX idx_vendor_documents_status ON public.vendor_documents(status);

ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER vendor_documents_updated_at
BEFORE UPDATE ON public.vendor_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Vendors see and upload only their own documents.
CREATE POLICY "Vendors view own documents"
  ON public.vendor_documents FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_documents.vendor_id AND v.owner_id = auth.uid())
  );

CREATE POLICY "Vendors upload own documents"
  ON public.vendor_documents FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_documents.vendor_id AND v.owner_id = auth.uid())
  );

-- Vendors may delete their own *pending* upload (e.g. to replace a mis-scanned
-- file) but can't touch one that's already been reviewed.
CREATE POLICY "Vendors delete own pending documents"
  ON public.vendor_documents FOR DELETE TO authenticated
  USING (
    status = 'pending'
    AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_documents.vendor_id AND v.owner_id = auth.uid())
  );

-- Admins see and review everything.
CREATE POLICY "Admins manage all documents"
  ON public.vendor_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- A non-admin can never set status/rejection_reason/reviewed_by/reviewed_at
-- themselves, even through the "own pending documents" surface above.
CREATE OR REPLACE FUNCTION public.prevent_vendor_document_self_review()
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
     OR NEW.vendor_id IS DISTINCT FROM OLD.vendor_id THEN
    RAISE EXCEPTION 'Only admins can review vendor documents';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_vendor_document_self_review() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER vendor_documents_prevent_self_review
BEFORE UPDATE ON public.vendor_documents
FOR EACH ROW
EXECUTE FUNCTION public.prevent_vendor_document_self_review();

-- Private storage bucket — never publicly readable, unlike vendor-assets.
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-documents', 'vendor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Vendors upload/read/delete only inside their own uid-prefixed folder.
CREATE POLICY "Vendors upload own vendor-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Vendors read own vendor-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Vendors delete own vendor-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
