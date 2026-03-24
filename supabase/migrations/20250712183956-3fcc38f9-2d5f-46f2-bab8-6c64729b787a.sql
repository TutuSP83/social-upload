-- Corrigir as políticas de storage para arquivos compartilhados
DROP POLICY IF EXISTS "Users can view shared files in storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can download shared files" ON storage.objects;

-- Política corrigida para permitir que usuários vejam arquivos compartilhados com eles
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

-- Política corrigida para permitir que usuários baixem arquivos compartilhados com eles  
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