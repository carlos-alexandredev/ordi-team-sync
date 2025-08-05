-- Criar função para verificar se é admin master
CREATE OR REPLACE FUNCTION public.is_admin_master()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role = 'admin_master' FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Atualizar políticas de profiles para permitir apenas admin_master gerenciar usuários
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;

-- Nova política: usuários podem ver próprio perfil ou admin_master pode ver todos
CREATE POLICY "Usuários podem ver perfis"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id OR 
  is_admin_master() OR
  get_user_role() = ANY(ARRAY['admin', 'admin_cliente'])
);

-- Nova política: usuários podem atualizar próprio perfil ou admin_master pode atualizar qualquer um
CREATE POLICY "Usuários podem atualizar perfis"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id OR 
  is_admin_master()
);

-- Nova política: apenas admin_master pode criar novos usuários
CREATE POLICY "Admin master pode criar usuários"
ON public.profiles
FOR INSERT
WITH CHECK (is_admin_master());

-- Nova política: apenas admin_master pode deletar usuários
CREATE POLICY "Admin master pode deletar usuários"
ON public.profiles
FOR DELETE
USING (is_admin_master());

-- Atualizar todas as políticas existentes para incluir admin_master
-- Atualizar função get_user_role para incluir admin_master
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Atualizar políticas das companies
DROP POLICY IF EXISTS "Admins podem atualizar empresas" ON public.companies;
DROP POLICY IF EXISTS "Admins podem criar empresas" ON public.companies;
DROP POLICY IF EXISTS "Admins podem ver todas as empresas" ON public.companies;

CREATE POLICY "Admins podem atualizar empresas"
ON public.companies
FOR UPDATE
USING (
  is_admin_master() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins podem criar empresas"
ON public.companies
FOR INSERT
WITH CHECK (
  is_admin_master() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins podem ver todas as empresas"
ON public.companies
FOR SELECT
USING (
  is_admin_master() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Atualizar políticas de calls para incluir admin_master
DROP POLICY IF EXISTS "Admins podem atualizar chamados" ON public.calls;
DROP POLICY IF EXISTS "Clientes podem ver próprios chamados" ON public.calls;

CREATE POLICY "Admins podem atualizar chamados"
ON public.calls
FOR UPDATE
USING (
  is_admin_master() OR
  (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND 
   (company_id = get_user_company() OR get_user_role() = 'admin'))
);

CREATE POLICY "Usuários podem ver chamados"
ON public.calls
FOR SELECT
USING (
  is_admin_master() OR
  (get_user_role() = 'cliente_final' AND 
   client_id = (SELECT id FROM profiles WHERE user_id = auth.uid())) OR
  (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND 
   company_id = get_user_company()) OR
  get_user_role() = 'admin'
);

-- Atualizar políticas de orders para incluir admin_master
DROP POLICY IF EXISTS "Admins podem atualizar ordens" ON public.orders;
DROP POLICY IF EXISTS "Admins podem criar ordens" ON public.orders;
DROP POLICY IF EXISTS "Visualização de ordens por role" ON public.orders;

CREATE POLICY "Admins podem atualizar ordens"
ON public.orders
FOR UPDATE
USING (
  is_admin_master() OR
  (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND 
   (company_id = get_user_company() OR get_user_role() = 'admin'))
);

CREATE POLICY "Admins podem criar ordens"
ON public.orders
FOR INSERT
WITH CHECK (
  is_admin_master() OR
  (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND 
   (company_id = get_user_company() OR get_user_role() = 'admin'))
);

CREATE POLICY "Visualização de ordens por role"
ON public.orders
FOR SELECT
USING (
  is_admin_master() OR
  (get_user_role() = 'cliente_final' AND 
   client_id = (SELECT id FROM profiles WHERE user_id = auth.uid())) OR
  (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND 
   company_id = get_user_company()) OR
  get_user_role() = 'admin'
);

-- Atualizar políticas de tasks para incluir admin_master
DROP POLICY IF EXISTS "Gestores podem atualizar tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Gestores podem criar tarefas" ON public.tasks;
DROP POLICY IF EXISTS "Usuários podem ver tarefas da sua empresa" ON public.tasks;

CREATE POLICY "Gestores podem atualizar tarefas"
ON public.tasks
FOR UPDATE
USING (
  is_admin_master() OR
  (get_user_role() = ANY(ARRAY['admin', 'gestor']) AND 
   (company_id = get_user_company() OR get_user_role() = 'admin'))
);

CREATE POLICY "Gestores podem criar tarefas"
ON public.tasks
FOR INSERT
WITH CHECK (
  is_admin_master() OR
  (get_user_role() = ANY(ARRAY['admin', 'gestor']) AND 
   (company_id = get_user_company() OR get_user_role() = 'admin'))
);

CREATE POLICY "Usuários podem ver tarefas da sua empresa"
ON public.tasks
FOR SELECT
USING (
  is_admin_master() OR
  (get_user_role() = ANY(ARRAY['admin', 'gestor', 'tecnico']) AND 
   (company_id = get_user_company() OR get_user_role() = 'admin'))
);

-- Atualizar políticas de equipments para incluir admin_master
DROP POLICY IF EXISTS "Admins podem atualizar equipamentos" ON public.equipments;
DROP POLICY IF EXISTS "Admins podem criar equipamentos" ON public.equipments;
DROP POLICY IF EXISTS "Usuários podem ver equipamentos da sua empresa" ON public.equipments;

CREATE POLICY "Admins podem atualizar equipamentos"
ON public.equipments
FOR UPDATE
USING (
  is_admin_master() OR
  (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND 
   company_id = get_user_company()) OR
  get_user_role() = 'admin'
);

CREATE POLICY "Admins podem criar equipamentos"
ON public.equipments
FOR INSERT
WITH CHECK (
  is_admin_master() OR
  (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND 
   company_id = get_user_company()) OR
  get_user_role() = 'admin'
);

CREATE POLICY "Usuários podem ver equipamentos da sua empresa"
ON public.equipments
FOR SELECT
USING (
  is_admin_master() OR
  (get_user_role() = 'cliente_final' AND 
   client_id = (SELECT id FROM profiles WHERE user_id = auth.uid())) OR
  (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND 
   company_id = get_user_company()) OR
  get_user_role() = 'admin'
);