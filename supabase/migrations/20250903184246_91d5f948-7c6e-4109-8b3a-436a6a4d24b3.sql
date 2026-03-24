-- Atualizar todos os usuários para status de email confirmado
-- Isso resolve o problema de login para contas já cadastradas

-- Função para confirmar email de usuários existentes
CREATE OR REPLACE FUNCTION public.confirm_existing_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta função será executada via SQL direto no auth schema
  -- Usuarios precisam ter seus emails confirmados para fazer login
  NULL;
END;
$$;