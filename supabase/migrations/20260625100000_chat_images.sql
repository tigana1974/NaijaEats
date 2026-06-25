-- Add image_url to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create chat-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true) ON CONFLICT DO NOTHING;

-- Anyone can view chat images
DROP POLICY IF EXISTS "Anyone can view chat images" ON storage.objects;
CREATE POLICY "Anyone can view chat images" ON storage.objects FOR SELECT USING ( bucket_id = 'chat-images' );

-- Users can upload chat images
DROP POLICY IF EXISTS "Users can upload chat images" ON storage.objects;
CREATE POLICY "Users can upload chat images" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'chat-images' AND auth.role() = 'authenticated' );

-- Users can update chat images
DROP POLICY IF EXISTS "Users can update chat images" ON storage.objects;
CREATE POLICY "Users can update chat images" ON storage.objects FOR UPDATE USING ( bucket_id = 'chat-images' AND auth.role() = 'authenticated' );

-- Users can delete chat images
DROP POLICY IF EXISTS "Users can delete chat images" ON storage.objects;
CREATE POLICY "Users can delete chat images" ON storage.objects FOR DELETE USING ( bucket_id = 'chat-images' AND auth.role() = 'authenticated' );
