-- Verificar se existem políticas no storage.objects para usuários proprietários
DROP POLICY IF EXISTS "Users can access their own files in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can view shared files in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can download shared files" ON storage.objects;

-- Política para permitir que usuários vejam e baixem seus próprios arquivos
CREATE POLICY "Users can access their own files in storage" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'uploads' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir que usuários vejam arquivos compartilhados com eles
CREATE POLICY "Users can view shared files in storage" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'uploads' AND 
  EXISTS (
    SELECT 1 
    FROM file_shares fs
    JOIN files f ON f.id = fs.file_id
    WHERE f.path = name 
    AND fs.shared_with = auth.uid()
  )
);

-- Política para permitir que usuários baixem arquivos compartilhados com eles  
CREATE POLICY "Users can download shared files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'uploads' AND
  EXISTS (
    SELECT 1
    FROM file_shares fs
    JOIN files f ON f.id = fs.file_id
    WHERE f.path = name
    AND fs.shared_with = auth.uid()
  )
);