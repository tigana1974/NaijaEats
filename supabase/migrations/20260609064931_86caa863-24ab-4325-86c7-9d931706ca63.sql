
-- Restrictive policy: only vendor-owner of the order or admin may UPDATE orders
CREATE POLICY "Restrict order updates to vendor or admin"
ON public.orders
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = orders.vendor_id AND v.owner_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = orders.vendor_id AND v.owner_id = auth.uid()
  )
);

-- Tighten vendor-assets public read: only files belonging to approved vendor owners
DROP POLICY IF EXISTS "Public read vendor-assets" ON storage.objects;

CREATE POLICY "Public read approved vendor-assets"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'vendor-assets'
  AND EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.status = 'approved'::vendor_status
      AND v.owner_id::text = (storage.foldername(name))[1]
  )
);
