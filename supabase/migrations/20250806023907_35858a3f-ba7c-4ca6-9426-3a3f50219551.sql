-- Atualizar a função is_admin_master para lidar com casos onde auth.uid() pode ser null
CREATE OR REPLACE FUNCTION public.is_admin_master()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN false
    ELSE COALESCE((SELECT role = 'admin_master' FROM public.profiles WHERE user_id = auth.uid()), false)
  END;
$function$;

-- Corrigir a função get_user_role para lidar com casos onde auth.uid() pode ser null
CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN null
    ELSE (SELECT role FROM public.profiles WHERE user_id = auth.uid())
  END;
$function$;

-- Corrigir a função get_user_company para lidar com casos onde auth.uid() pode ser null
CREATE OR REPLACE FUNCTION public.get_user_company()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN null
    ELSE (SELECT company_id FROM public.profiles WHERE user_id = auth.uid())
  END;
$function$;

-- Atualizar as policies para tornar o admin_master mais explícito
DROP POLICY IF EXISTS "Admin master pode criar usuários" ON public.profiles;
CREATE POLICY "Admin master pode criar usuários" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin_master'
  )
);

DROP POLICY IF EXISTS "Admin master pode deletar usuários" ON public.profiles;
CREATE POLICY "Admin master pode deletar usuários" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin_master'
  )
);

DROP POLICY IF EXISTS "Usuários podem atualizar perfis" ON public.profiles;
CREATE POLICY "Usuários podem atualizar perfis" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin_master'
  )
);

DROP POLICY IF EXISTS "Usuários podem ver perfis" ON public.profiles;
CREATE POLICY "Usuários podem ver perfis" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin_master'
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'admin_cliente')
  )
);