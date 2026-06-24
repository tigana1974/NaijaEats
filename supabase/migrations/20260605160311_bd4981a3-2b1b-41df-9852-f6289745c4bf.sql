
-- Public read for vendor-assets (images shown on storefronts)
CREATE POLICY "Public read vendor-assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'vendor-assets');

-- Authenticated users can upload into their own folder (prefix = auth.uid())
CREATE POLICY "Vendors upload own vendor-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Vendors update own vendor-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'vendor-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Vendors delete own vendor-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
