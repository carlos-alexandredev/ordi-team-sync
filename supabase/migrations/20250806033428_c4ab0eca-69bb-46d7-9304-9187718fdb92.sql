-- Corrigir políticas RLS para role_permissions
DROP POLICY IF EXISTS "Admin master pode gerenciar permissões de roles" ON public.role_permissions;
DROP POLICY IF EXISTS "Todos podem ver permissões de roles" ON public.role_permissions;

-- Criar políticas RLS mais flexíveis para role_permissions
CREATE POLICY "Admin master pode gerenciar permissões de roles" ON public.role_permissions
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin_master'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin_master'
  )
);

CREATE POLICY "Todos podem ver permissões de roles" ON public.role_permissions
FOR SELECT TO authenticated 
USING (true);

-- Corrigir políticas RLS para roles também
DROP POLICY IF EXISTS "Admin master pode gerenciar roles" ON public.roles;
DROP POLICY IF EXISTS "Todos podem ver roles ativas" ON public.roles;

CREATE POLICY "Admin master pode gerenciar roles" ON public.roles
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin_master'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin_master'
  )
);

CREATE POLICY "Todos podem ver roles ativas" ON public.roles
FOR SELECT TO authenticated 
USING (true);

-- Corrigir políticas RLS para permissions
DROP POLICY IF EXISTS "Admin master pode gerenciar permissões" ON public.permissions;
DROP POLICY IF EXISTS "Todos podem ver permissões" ON public.permissions;

CREATE POLICY "Admin master pode gerenciar permissões" ON public.permissions
FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin_master'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin_master'
  )
);

CREATE POLICY "Todos podem ver permissões" ON public.permissions
FOR SELECT TO authenticated 
USING (true);