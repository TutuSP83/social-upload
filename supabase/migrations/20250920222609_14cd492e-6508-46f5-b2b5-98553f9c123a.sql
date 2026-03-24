-- Aumentar limite de armazenamento de 5GB para 10GB
-- 10GB = 10737418240 bytes

-- Atualizar valor padrão na tabela profiles
ALTER TABLE public.profiles 
ALTER COLUMN storage_limit SET DEFAULT 10737418240;

-- Atualizar valor padrão na tabela user_stats
ALTER TABLE public.user_stats 
ALTER COLUMN storage_limit SET DEFAULT 10737418240;

-- Atualizar usuários existentes para o novo limite
UPDATE public.profiles 
SET storage_limit = 10737418240 
WHERE storage_limit = 5368709120;

-- Atualizar user_stats existentes
UPDATE public.user_stats 
SET storage_limit = 10737418240,
    storage_available = 10737418240 - total_storage_used
WHERE storage_limit = 5368709120;

-- Atualizar a função calculate_storage_stats para usar o novo limite padrão
CREATE OR REPLACE FUNCTION public.calculate_storage_stats(user_uuid uuid)
 RETURNS TABLE(total_used bigint, total_limit bigint, available bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(f.size), 0) as total_used,
    COALESCE(p.storage_limit, 10737418240) as total_limit,
    COALESCE(p.storage_limit, 10737418240) - COALESCE(SUM(f.size), 0) as available
  FROM profiles p
  LEFT JOIN files f ON f.user_id = p.id
  WHERE p.id = user_uuid
  GROUP BY p.id, p.storage_limit;
END;
$function$;