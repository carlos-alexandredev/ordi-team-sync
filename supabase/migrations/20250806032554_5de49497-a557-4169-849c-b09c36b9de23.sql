-- Criar tabela de roles
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de permissões
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de permissões por role
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Inserir permissões padrão
INSERT INTO public.permissions (name, display_name, description, resource, action) VALUES
  ('users.view', 'Visualizar Usuários', 'Visualizar lista de usuários', 'users', 'view'),
  ('users.manage', 'Gerenciar Usuários', 'Criar, editar e excluir usuários', 'users', 'manage'),
  ('orders.view', 'Visualizar Ordens', 'Visualizar ordens de serviço', 'orders', 'view'),
  ('orders.manage', 'Gerenciar Ordens', 'Criar, editar e excluir ordens', 'orders', 'manage'),
  ('equipments.view', 'Visualizar Equipamentos', 'Visualizar equipamentos', 'equipments', 'view'),
  ('equipments.manage', 'Gerenciar Equipamentos', 'Criar, editar e excluir equipamentos', 'equipments', 'manage'),
  ('companies.view', 'Visualizar Empresas', 'Visualizar empresas', 'companies', 'view'),
  ('companies.manage', 'Gerenciar Empresas', 'Criar, editar e excluir empresas', 'companies', 'manage'),
  ('reports.view', 'Visualizar Relatórios', 'Visualizar relatórios do sistema', 'reports', 'view'),
  ('reports.export', 'Exportar Relatórios', 'Exportar relatórios em diferentes formatos', 'reports', 'export'),
  ('settings.view', 'Visualizar Configurações', 'Visualizar configurações do sistema', 'settings', 'view'),
  ('settings.manage', 'Gerenciar Configurações', 'Alterar configurações do sistema', 'settings', 'manage'),
  ('roles.view', 'Visualizar Roles', 'Visualizar roles do sistema', 'roles', 'view'),
  ('roles.manage', 'Gerenciar Roles', 'Criar, editar e excluir roles', 'roles', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Inserir role Administrador
INSERT INTO public.roles (name, display_name, description, color, is_system_role) VALUES
  ('admin_master', 'Administrador', 'Acesso completo ao sistema', '#9333EA', true)
ON CONFLICT (name) DO NOTHING;

-- Atribuir todas as permissões ao admin_master
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'admin_master'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Inserir outras roles básicas
INSERT INTO public.roles (name, display_name, description, color, is_system_role) VALUES
  ('admin', 'Admin', 'Administrador de empresa', '#EF4444', true),
  ('gestor', 'Gestor', 'Gestor de operações', '#3B82F6', true),
  ('tecnico', 'Técnico', 'Técnico de campo', '#10B981', true),
  ('cliente', 'Cliente', 'Cliente final', '#F59E0B', true)
ON CONFLICT (name) DO NOTHING;

-- Atualizar tabela profiles para usar role_id em vez de role text
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

-- Migrar roles existentes
UPDATE public.profiles SET role_id = (
  SELECT id FROM public.roles WHERE name = profiles.role
) WHERE role_id IS NULL;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para roles
CREATE POLICY "Admin master pode gerenciar roles" ON public.roles
FOR ALL TO authenticated 
USING (is_admin_master())
WITH CHECK (is_admin_master());

CREATE POLICY "Todos podem ver roles ativas" ON public.roles
FOR SELECT TO authenticated 
USING (true);

-- Políticas RLS para permissions
CREATE POLICY "Admin master pode gerenciar permissões" ON public.permissions
FOR ALL TO authenticated 
USING (is_admin_master())
WITH CHECK (is_admin_master());

CREATE POLICY "Todos podem ver permissões" ON public.permissions
FOR SELECT TO authenticated 
USING (true);

-- Políticas RLS para role_permissions
CREATE POLICY "Admin master pode gerenciar permissões de roles" ON public.role_permissions
FOR ALL TO authenticated 
USING (is_admin_master())
WITH CHECK (is_admin_master());

CREATE POLICY "Todos podem ver permissões de roles" ON public.role_permissions
FOR SELECT TO authenticated 
USING (true);

-- Função para contar usuários por role
CREATE OR REPLACE FUNCTION public.count_users_by_role(role_name TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles p
  JOIN public.roles r ON p.role_id = r.id
  WHERE r.name = role_name;
$$;

-- Função para obter permissões de uma role
CREATE OR REPLACE FUNCTION public.get_role_permissions(role_name TEXT)
RETURNS TABLE(permission_name TEXT, display_name TEXT, description TEXT, resource TEXT, action TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.name, p.display_name, p.description, p.resource, p.action
  FROM public.permissions p
  JOIN public.role_permissions rp ON p.id = rp.permission_id
  JOIN public.roles r ON rp.role_id = r.id
  WHERE r.name = role_name;
$$;