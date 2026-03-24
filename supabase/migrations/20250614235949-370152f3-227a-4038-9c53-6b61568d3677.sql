
-- Primeiro, limpar todos os objetos dos buckets
DELETE FROM storage.objects WHERE bucket_id = 'uploads';
DELETE FROM storage.objects WHERE bucket_id = 'avatars';

-- Limpar TODAS as políticas existentes no storage.objects
DROP POLICY IF EXISTS "uploads 1va6avm_0" ON storage.objects;
DROP POLICY IF EXISTS "uploads 1va6avm_1" ON storage.objects;
DROP POLICY IF EXISTS "uploads 1va6avm_2" ON storage.objects;
DROP POLICY IF EXISTS "uploads 1va6avm_3" ON storage.objects;

DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;

-- Remover as políticas que podem já existir com os novos nomes
DROP POLICY IF EXISTS "users_can_view_own_files" ON storage.objects;
DROP POLICY IF EXISTS "users_can_upload_files" ON storage.objects;
DROP POLICY IF EXISTS "users_can_update_own_files" ON storage.objects;
DROP POLICY IF EXISTS "users_can_delete_own_files" ON storage.objects;
DROP POLICY IF EXISTS "users_can_view_own_avatars" ON storage.objects;
DROP POLICY IF EXISTS "users_can_upload_avatars" ON storage.objects;
DROP POLICY IF EXISTS "users_can_update_own_avatars" ON storage.objects;
DROP POLICY IF EXISTS "users_can_delete_own_avatars" ON storage.objects;

-- Remover as novas políticas que você criou
DROP POLICY IF EXISTS "Usuários podem fazer upload de avatares" ON storage.objects;
DROP POLICY IF EXISTS "Avatares são públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar seus avatares" ON storage.objects;

-- Agora deletar buckets existentes (após limpar os objetos)
DELETE FROM storage.buckets WHERE id = 'uploads';
DELETE FROM storage.buckets WHERE id = 'avatars';

-- Criar o bucket 'uploads' público
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true);

-- Criar o bucket 'avatars' público (para fotos de perfil)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Criar políticas claras e funcionais para o bucket uploads

-- 1. Política SELECT: Usuários autenticados podem ver seus próprios arquivos
CREATE POLICY "users_can_view_own_files" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Política INSERT: Usuários autenticados podem fazer upload de arquivos
CREATE POLICY "users_can_upload_files" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Política UPDATE: Usuários autenticados podem atualizar seus próprios arquivos
CREATE POLICY "users_can_update_own_files" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Política DELETE: Usuários autenticados podem deletar seus próprios arquivos
CREATE POLICY "users_can_delete_own_files" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas para o bucket avatars

-- Política para permitir upload de avatares
CREATE POLICY "Usuários podem fazer upload de avatares" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para visualizar avatares (públicos)
CREATE POLICY "Avatares são públicos" 
ON storage.objects
FOR SELECT 
USING (bucket_id = 'avatars');

-- Política para atualizar avatares
CREATE POLICY "Usuários podem atualizar seus avatares" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para deletar avatares
CREATE POLICY "Usuários podem deletar seus avatares" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Limpar políticas RLS existentes das tabelas (se existirem)
DROP POLICY IF EXISTS "users_can_view_own_files_table" ON public.files;
DROP POLICY IF EXISTS "users_can_insert_own_files_table" ON public.files;
DROP POLICY IF EXISTS "users_can_update_own_files_table" ON public.files;
DROP POLICY IF EXISTS "users_can_delete_own_files_table" ON public.files;

DROP POLICY IF EXISTS "users_can_view_own_folders" ON public.folders;
DROP POLICY IF EXISTS "users_can_insert_own_folders" ON public.folders;
DROP POLICY IF EXISTS "users_can_update_own_folders" ON public.folders;
DROP POLICY IF EXISTS "users_can_delete_own_folders" ON public.folders;

-- Habilitar RLS nas tabelas files e folders
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela files
CREATE POLICY "users_can_view_own_files_table" 
ON public.files 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_files_table" 
ON public.files 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_own_files_table" 
ON public.files 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "users_can_delete_own_files_table" 
ON public.files 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- Políticas para a tabela folders
CREATE POLICY "users_can_view_own_folders" 
ON public.folders 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "users_can_insert_own_folders" 
ON public.folders 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_can_update_own_folders" 
ON public.folders 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "users_can_delete_own_folders" 
ON public.folders 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());
