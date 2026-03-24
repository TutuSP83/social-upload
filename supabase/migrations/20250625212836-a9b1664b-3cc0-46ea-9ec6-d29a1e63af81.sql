
-- Remove todas as políticas existentes de forma segura
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
DROP POLICY IF EXISTS "Users can create their own files" ON public.files;
DROP POLICY IF EXISTS "Users can update their own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;

DROP POLICY IF EXISTS "Users can view their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can create their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;

DROP POLICY IF EXISTS "Users can view file shares they sent or received" ON public.file_shares;
DROP POLICY IF EXISTS "Users can create file shares" ON public.file_shares;
DROP POLICY IF EXISTS "Users can delete file shares they created" ON public.file_shares;

DROP POLICY IF EXISTS "Users can view folder shares they sent or received" ON public.folder_shares;
DROP POLICY IF EXISTS "Users can create folder shares" ON public.folder_shares;
DROP POLICY IF EXISTS "Users can delete folder shares they created" ON public.folder_shares;

-- Garantir que as tabelas existam e tenham RLS ativado
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_shares ENABLE ROW LEVEL SECURITY;

-- Recriar políticas para arquivos
CREATE POLICY "Users can view their own files" ON public.files
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR 
    id IN (
      SELECT file_id FROM public.file_shares 
      WHERE shared_with = auth.uid()
    )
  );

CREATE POLICY "Users can create their own files" ON public.files
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own files" ON public.files
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own files" ON public.files
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Recriar políticas para pastas
CREATE POLICY "Users can view their own folders" ON public.folders
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR 
    id IN (
      SELECT folder_id FROM public.folder_shares 
      WHERE shared_with = auth.uid()
    )
  );

CREATE POLICY "Users can create their own folders" ON public.folders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own folders" ON public.folders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own folders" ON public.folders
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Recriar políticas para compartilhamentos de arquivos
CREATE POLICY "Users can view file shares they sent or received" ON public.file_shares
  FOR SELECT TO authenticated
  USING (shared_by = auth.uid() OR shared_with = auth.uid());

CREATE POLICY "Users can create file shares" ON public.file_shares
  FOR INSERT TO authenticated
  WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can delete file shares they created" ON public.file_shares
  FOR DELETE TO authenticated
  USING (shared_by = auth.uid());

-- Recriar políticas para compartilhamentos de pastas
CREATE POLICY "Users can view folder shares they sent or received" ON public.folder_shares
  FOR SELECT TO authenticated
  USING (shared_by = auth.uid() OR shared_with = auth.uid());

CREATE POLICY "Users can create folder shares" ON public.folder_shares
  FOR INSERT TO authenticated
  WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can delete folder shares they created" ON public.folder_shares
  FOR DELETE TO authenticated
  USING (shared_by = auth.uid());

-- Criar bucket de storage se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Verificar e criar políticas de storage apenas se não existirem
DO $$
BEGIN
    -- Remove políticas de storage existentes
    DROP POLICY IF EXISTS "Users can view their own uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
    
    -- Recriar políticas de storage
    CREATE POLICY "Users can view their own uploads" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
      
    CREATE POLICY "Users can upload their own files" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
      
    CREATE POLICY "Users can delete their own files" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
END $$;
