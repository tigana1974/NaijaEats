-- Create storage buckets for the application
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-assets', 'vendor-assets', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-documents', 'vendor-documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('rider-documents', 'rider-documents', false) ON CONFLICT DO NOTHING;

-- Avatars Policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Vendor Assets Policies
DROP POLICY IF EXISTS "Anyone can view vendor assets" ON storage.objects;
CREATE POLICY "Anyone can view vendor assets" ON storage.objects FOR SELECT USING ( bucket_id = 'vendor-assets' );

DROP POLICY IF EXISTS "Users can upload vendor assets" ON storage.objects;
CREATE POLICY "Users can upload vendor assets" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'vendor-assets' AND auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can update vendor assets" ON storage.objects;
CREATE POLICY "Users can update vendor assets" ON storage.objects FOR UPDATE USING ( bucket_id = 'vendor-assets' AND auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can delete vendor assets" ON storage.objects;
CREATE POLICY "Users can delete vendor assets" ON storage.objects FOR DELETE USING ( bucket_id = 'vendor-assets' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Vendor Documents Policies
DROP POLICY IF EXISTS "Owner can view vendor documents" ON storage.objects;
CREATE POLICY "Owner can view vendor documents" ON storage.objects FOR SELECT USING ( bucket_id = 'vendor-documents' AND auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can upload vendor documents" ON storage.objects;
CREATE POLICY "Users can upload vendor documents" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'vendor-documents' AND auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can update vendor documents" ON storage.objects;
CREATE POLICY "Users can update vendor documents" ON storage.objects FOR UPDATE USING ( bucket_id = 'vendor-documents' AND auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can delete vendor documents" ON storage.objects;
CREATE POLICY "Users can delete vendor documents" ON storage.objects FOR DELETE USING ( bucket_id = 'vendor-documents' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Rider Documents Policies
DROP POLICY IF EXISTS "Owner can view rider documents" ON storage.objects;
CREATE POLICY "Owner can view rider documents" ON storage.objects FOR SELECT USING ( bucket_id = 'rider-documents' AND auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can upload rider documents" ON storage.objects;
CREATE POLICY "Users can upload rider documents" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'rider-documents' AND auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can update rider documents" ON storage.objects;
CREATE POLICY "Users can update rider documents" ON storage.objects FOR UPDATE USING ( bucket_id = 'rider-documents' AND auth.uid()::text = (storage.foldername(name))[1] );

DROP POLICY IF EXISTS "Users can delete rider documents" ON storage.objects;
CREATE POLICY "Users can delete rider documents" ON storage.objects FOR DELETE USING ( bucket_id = 'rider-documents' AND auth.uid()::text = (storage.foldername(name))[1] );
