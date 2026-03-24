-- Allow users to delete their own files from the 'uploads' storage bucket
-- This policy assumes files are stored under a top-level folder with the user's UUID (e.g., `${user.id}/...`)

-- Enable RLS on storage.objects if not already enabled (it's enabled by default in Supabase projects)
-- Create DELETE policy for uploads bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own uploads'
  ) THEN
    CREATE POLICY "Users can delete own uploads"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'uploads'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Optionally ensure INSERT is allowed for own folder (users are already uploading successfully, but add for completeness)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can insert into own uploads'
  ) THEN
    CREATE POLICY "Users can insert into own uploads"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'uploads'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;

-- Ensure SELECT remains open for public bucket 'uploads' (public read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read uploads'
  ) THEN
    CREATE POLICY "Public can read uploads"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'uploads');
  END IF;
END $$;