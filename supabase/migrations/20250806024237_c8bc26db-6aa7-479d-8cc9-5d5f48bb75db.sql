-- Resolver completamente a recursão infinita removendo todas as políticas problemáticas
-- e criando políticas mais simples

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Admin master acesso total" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;

-- Criar políticas simples que não causam recursão
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Política separada para admin_master que não causa recursão
-- Usar uma subconsulta simples com LIMIT para evitar recursão
CREATE POLICY "Admin master can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role = 'admin_master' 
    LIMIT 1
  )
);

-- Política para inserção de novos perfis (apenas admin_master)
CREATE POLICY "Admin master can create profiles" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role = 'admin_master' 
    LIMIT 1
  )
);

-- Política para exclusão (apenas admin_master)
CREATE POLICY "Admin master can delete profiles" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM public.profiles 
    WHERE role = 'admin_master' 
    LIMIT 1
  )
);