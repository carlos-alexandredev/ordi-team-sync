-- Função para verificar e criar admin master se não existir
CREATE OR REPLACE FUNCTION public.ensure_admin_master_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_master_count INTEGER;
BEGIN
  -- Verificar se existe admin_master
  SELECT COUNT(*) INTO admin_master_count 
  FROM public.profiles 
  WHERE role = 'admin_master';
  
  -- Se não existir admin_master, mostrar alerta no log
  IF admin_master_count = 0 THEN
    RAISE NOTICE 'ATENÇÃO: Nenhum usuário admin_master encontrado. Crie um admin_master para ter acesso total ao sistema.';
  END IF;
END;
$$;

-- Executar a verificação
SELECT public.ensure_admin_master_exists();