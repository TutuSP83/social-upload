-- Adicionar políticas para permitir que receptores deletem compartilhamentos recebidos

-- Política para file_shares - permitir que quem recebeu possa deletar
CREATE POLICY "Recipients can delete received file shares" 
ON public.file_shares 
FOR DELETE 
USING (shared_with = auth.uid());

-- Política para folder_shares - permitir que quem recebeu possa deletar  
CREATE POLICY "Recipients can delete received folder shares"
ON public.folder_shares
FOR DELETE  
USING (shared_with = auth.uid());