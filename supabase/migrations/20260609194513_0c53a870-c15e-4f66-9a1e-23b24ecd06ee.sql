
-- Fix broken public read policy on vendor-assets
DROP POLICY IF EXISTS "Public read approved vendor-assets" ON storage.objects;
CREATE POLICY "Public read approved vendor-assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vendor-assets'
  AND EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.status = 'approved'
      AND v.owner_id::text = (storage.foldername(storage.objects.name))[1]
  )
);

-- Restrict uploads to approved vendors only
DROP POLICY IF EXISTS "Vendors upload own vendor-assets" ON storage.objects;
CREATE POLICY "Vendors upload own vendor-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-assets'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.owner_id = auth.uid()
      AND v.status = 'approved'
  )
);

-- Same restriction for update/delete (vendor-owned + approved)
DROP POLICY IF EXISTS "Vendors update own vendor-assets" ON storage.objects;
CREATE POLICY "Vendors update own vendor-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-assets'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.owner_id = auth.uid() AND v.status = 'approved')
)
WITH CHECK (
  bucket_id = 'vendor-assets'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.owner_id = auth.uid() AND v.status = 'approved')
);

DROP POLICY IF EXISTS "Vendors delete own vendor-assets" ON storage.objects;
CREATE POLICY "Vendors delete own vendor-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-assets'
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.owner_id = auth.uid() AND v.status = 'approved')
);

-- Restrict customer order_items mutations to pending orders only
CREATE POLICY "Customers mutate items only on pending orders"
ON public.order_items
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (o.customer_id <> auth.uid() OR o.status = 'pending')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (o.customer_id <> auth.uid() OR o.status = 'pending')
  )
);
