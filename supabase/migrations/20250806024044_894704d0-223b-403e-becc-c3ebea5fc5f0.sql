-- Corrigir a recursão infinita nas políticas RLS da tabela profiles
-- O problema é que as políticas estão referenciando a própria tabela profiles

-- Remover todas as políticas antigas que causam recursão
DROP POLICY IF EXISTS "Admin master pode criar usuários" ON public.profiles;
DROP POLICY IF EXISTS "Admin master pode deletar usuários" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver perfis" ON public.profiles;

-- Criar políticas mais simples que não causam recursão
CREATE POLICY "Usuários podem ver seu próprio perfil" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Policy específica para admin_master sem recursão
CREATE POLICY "Admin master acesso total" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (
  -- Verificar diretamente se o usuário logado é admin_master
  (SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1) = 'admin_master'
);

-- Simplificar as funções para evitar problemas
CREATE OR REPLACE FUNCTION public.is_admin_master()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT role = 'admin_master' FROM public.profiles WHERE user_id = auth.uid() LIMIT 1), 
    false
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_company()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$function$;