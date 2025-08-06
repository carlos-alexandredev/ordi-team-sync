-- Reabilitar RLS e criar políticas mais simples
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes primeiro
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin master can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin master can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin master can delete profiles" ON public.profiles;

-- Criar políticas muito simples sem subconsultas complexas
-- Política básica para ver o próprio perfil
CREATE POLICY "basic_select_own_profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Política básica para atualizar o próprio perfil
CREATE POLICY "basic_update_own_profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Política muito simples para admin_master ver todos os perfis
-- Usar o user_id específico do admin master conhecido
CREATE POLICY "admin_master_view_all" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = '6f80bbe8-2162-4735-aeb5-0f7dbf0683dd'::uuid OR 
  auth.uid() = user_id
);

-- Política para admin_master criar perfis
CREATE POLICY "admin_master_insert" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = '6f80bbe8-2162-4735-aeb5-0f7dbf0683dd'::uuid);

-- Política para admin_master atualizar perfis
CREATE POLICY "admin_master_update" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = '6f80bbe8-2162-4735-aeb5-0f7dbf0683dd'::uuid OR 
  auth.uid() = user_id
);

-- Política para admin_master deletar perfis
CREATE POLICY "admin_master_delete" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = '6f80bbe8-2162-4735-aeb5-0f7dbf0683dd'::uuid);