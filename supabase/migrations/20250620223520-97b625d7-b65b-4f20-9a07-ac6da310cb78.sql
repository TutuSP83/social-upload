
-- Atualizar tabela de profiles para incluir limite de armazenamento
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 5368709120; -- 5GB em bytes

-- Atualizar tabela user_stats para incluir mais campos de armazenamento
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 5368709120;
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS storage_available BIGINT DEFAULT 5368709120;

-- Criar função para calcular armazenamento disponível
CREATE OR REPLACE FUNCTION calculate_storage_stats(user_uuid UUID)
RETURNS TABLE(
  total_used BIGINT,
  total_limit BIGINT,
  available BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(f.size), 0) as total_used,
    COALESCE(p.storage_limit, 5368709120) as total_limit,
    COALESCE(p.storage_limit, 5368709120) - COALESCE(SUM(f.size), 0) as available
  FROM profiles p
  LEFT JOIN files f ON f.user_id = p.id
  WHERE p.id = user_uuid
  GROUP BY p.id, p.storage_limit;
END;
$$ LANGUAGE plpgsql;

-- Garantir que o feedback tenha RLS habilitado
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para feedback (se não existirem)
DROP POLICY IF EXISTS "Users can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON feedback;

CREATE POLICY "Users can view all feedback" ON feedback
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Garantir que mensagens tenham RLS habilitado
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para messages (se não existirem)
DROP POLICY IF EXISTS "Users can view all messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

CREATE POLICY "Users can view all messages" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (auth.uid() = user_id);
