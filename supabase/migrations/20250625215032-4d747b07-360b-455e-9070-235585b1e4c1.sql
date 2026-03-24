
-- ========================================
-- 🚨 CORREÇÃO COMPLETA DO SISTEMA DE ARQUIVOS
-- ========================================

-- 1. EXTENSÃO PARA UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. GARANTIR QUE TODAS AS TABELAS EXISTAM
CREATE TABLE IF NOT EXISTS public.files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  path text NOT NULL,
  type text,
  size integer,
  user_id uuid NOT NULL,
  folder_id uuid,
  uploaded_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.folders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  user_id uuid,
  parent_folder_id uuid,
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.file_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id uuid NOT NULL,
  shared_by uuid NOT NULL,
  shared_with uuid NOT NULL,
  permission text DEFAULT 'view'::text,
  sender_folder_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.folder_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id uuid NOT NULL,
  shared_by uuid NOT NULL,
  shared_with uuid NOT NULL,
  permission text DEFAULT 'view'::text,
  sender_folder_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. ADICIONAR FOREIGN KEYS SE NÃO EXISTIREM
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'files_folder_id_fkey'
    ) THEN
        ALTER TABLE public.files 
        ADD CONSTRAINT files_folder_id_fkey 
        FOREIGN KEY (folder_id) REFERENCES public.folders(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'folders_parent_folder_id_fkey'
    ) THEN
        ALTER TABLE public.folders 
        ADD CONSTRAINT folders_parent_folder_id_fkey 
        FOREIGN KEY (parent_folder_id) REFERENCES public.folders(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'file_shares_file_id_fkey'
    ) THEN
        ALTER TABLE public.file_shares 
        ADD CONSTRAINT file_shares_file_id_fkey 
        FOREIGN KEY (file_id) REFERENCES public.files(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'folder_shares_folder_id_fkey'
    ) THEN
        ALTER TABLE public.folder_shares 
        ADD CONSTRAINT folder_shares_folder_id_fkey 
        FOREIGN KEY (folder_id) REFERENCES public.folders(id);
    END IF;
END $$;

-- 4. REMOVER TODAS AS POLÍTICAS ANTIGAS
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

-- 5. ATIVAR RLS EM TODAS AS TABELAS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_shares ENABLE ROW LEVEL SECURITY;

-- 6. CRIAR POLÍTICAS CORRETAS PARA ARQUIVOS
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

-- 7. CRIAR POLÍTICAS CORRETAS PARA PASTAS
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

-- 8. CRIAR POLÍTICAS PARA COMPARTILHAMENTOS DE ARQUIVOS
CREATE POLICY "Users can view file shares they sent or received" ON public.file_shares
  FOR SELECT TO authenticated
  USING (shared_by = auth.uid() OR shared_with = auth.uid());

CREATE POLICY "Users can create file shares" ON public.file_shares
  FOR INSERT TO authenticated
  WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can delete file shares they created" ON public.file_shares
  FOR DELETE TO authenticated
  USING (shared_by = auth.uid());

-- 9. CRIAR POLÍTICAS PARA COMPARTILHAMENTOS DE PASTAS
CREATE POLICY "Users can view folder shares they sent or received" ON public.folder_shares
  FOR SELECT TO authenticated
  USING (shared_by = auth.uid() OR shared_with = auth.uid());

CREATE POLICY "Users can create folder shares" ON public.folder_shares
  FOR INSERT TO authenticated
  WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can delete folder shares they created" ON public.folder_shares
  FOR DELETE TO authenticated
  USING (shared_by = auth.uid());

-- 10. CRIAR BUCKET DE STORAGE SE NÃO EXISTIR
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 11. REMOVER POLÍTICAS DE STORAGE ANTIGAS
DROP POLICY IF EXISTS "Users can view their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- 12. CRIAR POLÍTICAS DE STORAGE CORRETAS
CREATE POLICY "Users can view their own uploads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 13. FUNÇÕES PARA ORGANIZAÇÃO DE COMPARTILHAMENTOS
CREATE OR REPLACE FUNCTION public.get_or_create_sender_folder(
  p_shared_with uuid,
  p_shared_by uuid
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  sender_name text;
  folder_id uuid;
BEGIN
  SELECT social_name INTO sender_name 
  FROM profiles 
  WHERE id = p_shared_by;

  IF sender_name IS NULL THEN
    sender_name := 'Usuário Desconhecido';
  END IF;

  SELECT id INTO folder_id
  FROM folders
  WHERE user_id = p_shared_with 
    AND name = sender_name 
    AND parent_folder_id IS NULL;

  IF folder_id IS NULL THEN
    INSERT INTO folders (name, user_id, parent_folder_id)
    VALUES (sender_name, p_shared_with, NULL)
    RETURNING id INTO folder_id;
  END IF;

  RETURN folder_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.organize_existing_shared_files()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  share_record record;
  new_sender_folder_id uuid;
BEGIN
  -- file_shares
  FOR share_record IN 
    SELECT id, shared_with, shared_by, file_id
    FROM file_shares 
    WHERE sender_folder_id IS NULL
  LOOP
    new_sender_folder_id := get_or_create_sender_folder(
      share_record.shared_with, 
      share_record.shared_by
    );

    UPDATE file_shares 
    SET sender_folder_id = new_sender_folder_id
    WHERE id = share_record.id;
  END LOOP;

  -- folder_shares
  FOR share_record IN 
    SELECT id, shared_with, shared_by, folder_id
    FROM folder_shares 
    WHERE sender_folder_id IS NULL
  LOOP
    new_sender_folder_id := get_or_create_sender_folder(
      share_record.shared_with, 
      share_record.shared_by
    );

    UPDATE folder_shares 
    SET sender_folder_id = new_sender_folder_id
    WHERE id = share_record.id;
  END LOOP;
END;
$$;

-- 14. EXECUTAR ORGANIZAÇÃO
SELECT organize_existing_shared_files();

-- 15. VERIFICAÇÕES FINAIS
-- Contar arquivos por usuário
SELECT 
  'Arquivos por usuário' as tipo,
  user_id,
  COUNT(*) as total,
  pg_size_pretty(SUM(size)) as tamanho_total
FROM public.files 
GROUP BY user_id
ORDER BY user_id;

-- Contar pastas por usuário
SELECT 
  'Pastas por usuário' as tipo,
  user_id,
  COUNT(*) as total,
  NULL as tamanho_total
FROM public.folders 
GROUP BY user_id
ORDER BY user_id;

-- Verificar objetos no storage
SELECT 
  'Objetos no storage' as tipo,
  owner as user_id,
  COUNT(*) as total,
  pg_size_pretty(SUM(
    CASE 
      WHEN metadata->>'size' IS NOT NULL 
      THEN (metadata->>'size')::bigint 
      ELSE 0 
    END
  )) as tamanho_total
FROM storage.objects 
WHERE bucket_id = 'uploads'
GROUP BY owner
ORDER BY owner;
