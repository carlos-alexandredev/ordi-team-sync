-- Tabela para definir os módulos disponíveis no sistema
CREATE TABLE public.system_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  title text NOT NULL,
  url text NOT NULL UNIQUE,
  icon text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela para armazenar permissões customizadas por usuário
CREATE TABLE public.user_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.system_modules(id) ON DELETE CASCADE,
  can_access boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES public.profiles(id),
  UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para system_modules
CREATE POLICY "Todos podem ver módulos ativos" 
ON public.system_modules 
FOR SELECT 
USING (is_active = true OR is_admin_master());

CREATE POLICY "Admin master pode gerenciar módulos" 
ON public.system_modules 
FOR ALL 
USING (is_admin_master())
WITH CHECK (is_admin_master());

-- Políticas para user_permissions
CREATE POLICY "Admin master pode ver todas as permissões" 
ON public.user_permissions 
FOR SELECT 
USING (is_admin_master());

CREATE POLICY "Admin master pode gerenciar permissões" 
ON public.user_permissions 
FOR ALL 
USING (is_admin_master())
WITH CHECK (is_admin_master());

CREATE POLICY "Usuários podem ver suas próprias permissões" 
ON public.user_permissions 
FOR SELECT 
USING (user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir módulos padrão do sistema
INSERT INTO public.system_modules (name, title, url, icon, description) VALUES
('dashboard', 'Dashboard', '/dashboard', 'Home', 'Painel principal do sistema'),
('desk', 'Desk', '/desk', 'Settings', 'Central de configurações e supervisão'),
('users', 'Usuários', '/users', 'Users', 'Gerenciamento de usuários do sistema'),
('companies', 'Empresas', '/companies', 'Building', 'Gerenciamento de empresas'),
('clients', 'Clientes', '/clients', 'UserCheck', 'Gerenciamento de clientes'),
('calls', 'Chamados', '/calls', 'FileText', 'Gerenciamento de chamados'),
('orders', 'Ordens', '/orders', 'ClipboardList', 'Gerenciamento de ordens de serviço'),
('equipments', 'Equipamentos', '/equipments', 'Wrench', 'Gerenciamento de equipamentos'),
('technician', 'Técnicos', '/technician', 'Settings', 'Painel e gerenciamento de técnicos'),
('suppliers', 'Fornecedores', '/suppliers', 'Building', 'Gerenciamento de fornecedores'),
('reports', 'Relatórios', '/reports', 'BarChart', 'Relatórios e analytics do sistema');

-- Função para obter módulos permitidos para um usuário
CREATE OR REPLACE FUNCTION public.get_user_allowed_modules(target_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  module_name text,
  module_title text,
  module_url text,
  module_icon text,
  has_custom_permission boolean,
  is_allowed boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
  profile_id uuid;
BEGIN
  -- Se não especificado, usar o usuário atual
  IF target_user_id IS NULL THEN
    SELECT id, role INTO profile_id, user_role 
    FROM public.profiles 
    WHERE user_id = auth.uid();
  ELSE
    SELECT id, role INTO profile_id, user_role 
    FROM public.profiles 
    WHERE id = target_user_id;
  END IF;

  RETURN QUERY
  SELECT 
    sm.name,
    sm.title,
    sm.url,
    sm.icon,
    (up.id IS NOT NULL) as has_custom_permission,
    CASE 
      -- Se tem permissão customizada, usar ela
      WHEN up.id IS NOT NULL THEN up.can_access
      -- Se não tem permissão customizada, usar regras de role
      ELSE (
        CASE 
          WHEN user_role = 'admin_master' THEN true
          WHEN user_role = 'admin' AND sm.name IN ('dashboard', 'desk', 'companies', 'suppliers', 'reports') THEN true
          WHEN user_role IN ('gestor', 'admin_cliente') AND sm.name IN ('dashboard', 'desk', 'clients', 'calls', 'orders', 'equipments', 'technician', 'reports') THEN true
          WHEN user_role = 'tecnico' AND sm.name IN ('technician', 'orders', 'calls') THEN true
          WHEN user_role = 'cliente' AND sm.name IN ('calls', 'orders') THEN true
          ELSE false
        END
      )
    END as is_allowed
  FROM public.system_modules sm
  LEFT JOIN public.user_permissions up ON sm.id = up.module_id AND up.user_id = profile_id
  WHERE sm.is_active = true
  ORDER BY sm.name;
END;
$$;