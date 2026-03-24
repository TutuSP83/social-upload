
-- Habilitar RLS na tabela messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "authenticated_users_can_view_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_users_can_insert_messages" ON public.messages;
DROP POLICY IF EXISTS "users_can_delete_own_messages_or_admin" ON public.messages;

-- Criar políticas RLS para messages
-- 1. Todos os usuários autenticados podem ver todas as mensagens (chat público)
CREATE POLICY "authenticated_users_can_view_messages" 
ON public.messages 
FOR SELECT 
TO authenticated 
USING (true);

-- 2. Usuários autenticados podem inserir mensagens
CREATE POLICY "authenticated_users_can_insert_messages" 
ON public.messages 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- 3. Usuários podem deletar suas próprias mensagens ou admins podem deletar qualquer mensagem
CREATE POLICY "users_can_delete_own_messages_or_admin" 
ON public.messages 
FOR DELETE 
TO authenticated 
USING (
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Habilitar RLS na tabela profiles se ainda não estiver
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "authenticated_users_can_view_profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;

-- 1. Todos os usuários autenticados podem ver perfis (necessário para mostrar nomes no chat)
CREATE POLICY "authenticated_users_can_view_profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- 2. Usuários podem atualizar seu próprio perfil
CREATE POLICY "users_can_update_own_profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (id = auth.uid());
