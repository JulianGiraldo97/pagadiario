-- Setup Storage for evidence photos
-- Migration: 007_setup_storage.sql

-- Create the evidence-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence-photos',
  'evidence-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload evidence photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'evidence-photos' AND
    auth.role() = 'authenticated'
  );

-- Create policy to allow users to view evidence photos
CREATE POLICY "Anyone can view evidence photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'evidence-photos');

-- Create policy to allow users to delete their own photos
CREATE POLICY "Users can delete their own evidence photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'evidence-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );