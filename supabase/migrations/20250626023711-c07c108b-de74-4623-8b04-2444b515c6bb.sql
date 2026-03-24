
-- Habilitar RLS nas tabelas de compartilhamento se não estiverem habilitadas
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_shares ENABLE ROW LEVEL SECURITY;

-- Política para visualizar compartilhamentos de arquivos (quem compartilhou ou recebeu)
DROP POLICY IF EXISTS "Users can view their file shares" ON public.file_shares;
CREATE POLICY "Users can view their file shares" ON public.file_shares
  FOR SELECT 
  USING (auth.uid() = shared_by OR auth.uid() = shared_with);

-- Política para criar compartilhamentos de arquivos (apenas quem é dono do arquivo)
DROP POLICY IF EXISTS "Users can create file shares" ON public.file_shares;
CREATE POLICY "Users can create file shares" ON public.file_shares
  FOR INSERT 
  WITH CHECK (
    auth.uid() = shared_by AND 
    EXISTS (
      SELECT 1 FROM public.files 
      WHERE id = file_id AND user_id = auth.uid()
    )
  );

-- Política para atualizar compartilhamentos de arquivos (apenas quem compartilhou)
DROP POLICY IF EXISTS "Users can update their file shares" ON public.file_shares;
CREATE POLICY "Users can update their file shares" ON public.file_shares
  FOR UPDATE 
  USING (auth.uid() = shared_by);

-- Política para deletar compartilhamentos de arquivos (apenas quem compartilhou)
DROP POLICY IF EXISTS "Users can delete their file shares" ON public.file_shares;
CREATE POLICY "Users can delete their file shares" ON public.file_shares
  FOR DELETE 
  USING (auth.uid() = shared_by);

-- Política para visualizar compartilhamentos de pastas (quem compartilhou ou recebeu)
DROP POLICY IF EXISTS "Users can view their folder shares" ON public.folder_shares;
CREATE POLICY "Users can view their folder shares" ON public.folder_shares
  FOR SELECT 
  USING (auth.uid() = shared_by OR auth.uid() = shared_with);

-- Política para criar compartilhamentos de pastas (apenas quem é dono da pasta)
DROP POLICY IF EXISTS "Users can create folder shares" ON public.folder_shares;
CREATE POLICY "Users can create folder shares" ON public.folder_shares
  FOR INSERT 
  WITH CHECK (
    auth.uid() = shared_by AND 
    EXISTS (
      SELECT 1 FROM public.folders 
      WHERE id = folder_id AND user_id = auth.uid()
    )
  );

-- Política para atualizar compartilhamentos de pastas (apenas quem compartilhou)
DROP POLICY IF EXISTS "Users can update their folder shares" ON public.folder_shares;
CREATE POLICY "Users can update their folder shares" ON public.folder_shares
  FOR UPDATE 
  USING (auth.uid() = shared_by);

-- Política para deletar compartilhamentos de pastas (apenas quem compartilhou)
DROP POLICY IF EXISTS "Users can delete their folder shares" ON public.folder_shares;
CREATE POLICY "Users can delete their folder shares" ON public.folder_shares
  FOR DELETE 
  USING (auth.uid() = shared_by);

-- Habilitar RLS na tabela files se não estiver habilitada
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Política para que usuários vejam seus próprios arquivos
DROP POLICY IF EXISTS "Users can view their own files" ON public.files;
CREATE POLICY "Users can view their own files" ON public.files
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para que usuários vejam arquivos compartilhados com eles
DROP POLICY IF EXISTS "Users can view shared files" ON public.files;
CREATE POLICY "Users can view shared files" ON public.files
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.file_shares 
      WHERE file_id = files.id AND shared_with = auth.uid()
    )
  );

-- Política para inserir arquivos
DROP POLICY IF EXISTS "Users can insert their own files" ON public.files;
CREATE POLICY "Users can insert their own files" ON public.files
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para atualizar arquivos
DROP POLICY IF EXISTS "Users can update their own files" ON public.files;
CREATE POLICY "Users can update their own files" ON public.files
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para deletar arquivos
DROP POLICY IF EXISTS "Users can delete their own files" ON public.files;
CREATE POLICY "Users can delete their own files" ON public.files
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Habilitar RLS na tabela folders se não estiver habilitada
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Política para que usuários vejam suas próprias pastas
DROP POLICY IF EXISTS "Users can view their own folders" ON public.folders;
CREATE POLICY "Users can view their own folders" ON public.folders
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para que usuários vejam pastas compartilhadas com eles
DROP POLICY IF EXISTS "Users can view shared folders" ON public.folders;
CREATE POLICY "Users can view shared folders" ON public.folders
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.folder_shares 
      WHERE folder_id = folders.id AND shared_with = auth.uid()
    )
  );

-- Política para inserir pastas
DROP POLICY IF EXISTS "Users can insert their own folders" ON public.folders;
CREATE POLICY "Users can insert their own folders" ON public.folders
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para atualizar pastas
DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;
CREATE POLICY "Users can update their own folders" ON public.folders
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para deletar pastas
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;
CREATE POLICY "Users can delete their own folders" ON public.folders
  FOR DELETE 
  USING (auth.uid() = user_id);
