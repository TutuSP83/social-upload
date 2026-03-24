-- Fix storage bucket policies for video uploads
-- Ensure the uploads bucket allows video files

-- Check if the uploads bucket exists and make sure it allows larger files
-- Video files need special handling due to size

-- Create proper RLS policies for storage.objects for video uploads
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own uploaded files"  
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own uploaded files"
ON storage.objects  
FOR UPDATE
USING (
  bucket_id = 'uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own uploaded files"
ON storage.objects
FOR DELETE  
USING (
  bucket_id = 'uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);