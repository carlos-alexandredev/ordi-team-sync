-- Create modules table
CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category text,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive','archived')),
  visibility text NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal','public')),
  is_core boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Create module_versions table
CREATE TABLE public.module_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  semver text NOT NULL,
  changelog text,
  is_stable boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(module_id, semver)
);

-- Create module_dependencies table
CREATE TABLE public.module_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  depends_on_module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(module_id, depends_on_module_id),
  CHECK (module_id <> depends_on_module_id)
);

-- Create module_settings table
CREATE TABLE public.module_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  key text NOT NULL,
  type text NOT NULL CHECK (type IN ('string','number','boolean','json')),
  value_text text,
  value_number numeric,
  value_boolean boolean,
  value_json jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(module_id, key)
);

-- Create module_permissions table
CREATE TABLE public.module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin','cliente','tecnico')),
  action text NOT NULL CHECK (action IN ('view','create','update','delete','configure','activate')),
  allowed boolean NOT NULL DEFAULT false,
  UNIQUE(module_id, role, action)
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id),
  event text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for modules
CREATE POLICY "Admin master pode gerenciar todos os módulos"
ON public.modules FOR ALL
TO authenticated
USING (is_admin_master())
WITH CHECK (is_admin_master());

CREATE POLICY "Usuários podem ver módulos públicos e ativos"
ON public.modules FOR SELECT
TO authenticated
USING (
  visibility = 'public' AND status = 'active' AND deleted_at IS NULL
);

-- RLS Policies for module_versions
CREATE POLICY "Admin master pode gerenciar versões de módulos"
ON public.module_versions FOR ALL
TO authenticated
USING (is_admin_master())
WITH CHECK (is_admin_master());

-- RLS Policies for module_dependencies
CREATE POLICY "Admin master pode gerenciar dependências"
ON public.module_dependencies FOR ALL
TO authenticated
USING (is_admin_master())
WITH CHECK (is_admin_master());

-- RLS Policies for module_settings
CREATE POLICY "Admin master pode gerenciar configurações"
ON public.module_settings FOR ALL
TO authenticated
USING (is_admin_master())
WITH CHECK (is_admin_master());

-- RLS Policies for module_permissions
CREATE POLICY "Admin master pode gerenciar permissões"
ON public.module_permissions FOR ALL
TO authenticated
USING (is_admin_master())
WITH CHECK (is_admin_master());

-- RLS Policies for audit_logs
CREATE POLICY "Admin master pode ver logs de auditoria"
ON public.audit_logs FOR SELECT
TO authenticated
USING (is_admin_master());

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_slug(input_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Convert to lowercase and replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(input_name, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Check if slug exists and increment until unique
  WHILE EXISTS (SELECT 1 FROM public.modules WHERE slug = final_slug AND deleted_at IS NULL) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Function to audit module changes
CREATE OR REPLACE FUNCTION public.audit_module_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_name text;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    event_name := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    event_name := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    event_name := 'delete';
  END IF;

  -- Log the event
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      actor_user_id, event, entity, entity_id, before, after
    ) VALUES (
      auth.uid(), event_name, TG_TABLE_NAME, OLD.id, to_jsonb(OLD), NULL
    );
    RETURN OLD;
  ELSE
    INSERT INTO public.audit_logs (
      actor_user_id, event, entity, entity_id, before, after
    ) VALUES (
      auth.uid(), event_name, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for auditing
CREATE TRIGGER audit_modules_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.audit_module_changes();

CREATE TRIGGER audit_module_versions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.module_versions
  FOR EACH ROW EXECUTE FUNCTION public.audit_module_changes();

-- Function to update updated_at timestamp
CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data
INSERT INTO public.modules (name, slug, description, category, status, visibility, is_core, created_by) VALUES
('Ordens de Serviço', 'ordens-servico', 'Gestão completa de ordens de serviço', 'Atendimento', 'active', 'internal', true, '6f80bbe8-2162-4735-aeb5-0f7dbf0683dd'),
('Clientes', 'clientes', 'Cadastro e gestão de clientes', 'Cadastros', 'active', 'internal', true, '6f80bbe8-2162-4735-aeb5-0f7dbf0683dd'),
('Agenda', 'agenda', 'Agendamento de técnicos e serviços', 'Planejamento', 'active', 'internal', false, '6f80bbe8-2162-4735-aeb5-0f7dbf0683dd'),
('Relatórios', 'relatorios', 'Geração de relatórios e dashboards', 'Análise', 'active', 'internal', false, '6f80bbe8-2162-4735-aeb5-0f7dbf0683dd'),
('Equipamentos', 'equipamentos', 'Gestão de equipamentos e patrimônio', 'Cadastros', 'active', 'internal', false, '6f80bbe8-2162-4735-aeb5-0f7dbf0683dd');

-- Insert module versions
WITH module_ids AS (
  SELECT id, slug FROM public.modules
)
INSERT INTO public.module_versions (module_id, semver, changelog, is_stable)
SELECT 
  id, 
  '1.0.0', 
  'Versão inicial do módulo ' || slug,
  true
FROM module_ids;

-- Insert dependencies (Ordens de Serviço depende de Clientes)
INSERT INTO public.module_dependencies (module_id, depends_on_module_id)
SELECT 
  os.id,
  cl.id
FROM public.modules os, public.modules cl
WHERE os.slug = 'ordens-servico' AND cl.slug = 'clientes';

-- Insert default permissions
WITH modules_and_roles AS (
  SELECT m.id as module_id, r.role, a.action
  FROM public.modules m
  CROSS JOIN (VALUES ('admin'), ('cliente'), ('tecnico')) r(role)
  CROSS JOIN (VALUES ('view'), ('create'), ('update'), ('delete'), ('configure'), ('activate')) a(action)
)
INSERT INTO public.module_permissions (module_id, role, action, allowed)
SELECT 
  module_id,
  role,
  action,
  CASE 
    WHEN role = 'admin' THEN true
    WHEN role IN ('cliente', 'tecnico') AND action = 'view' THEN true
    ELSE false
  END as allowed
FROM modules_and_roles;

-- Insert sample settings
INSERT INTO public.module_settings (module_id, key, type, value_number)
SELECT id, 'max_items_per_page', 'number', 50
FROM public.modules;

INSERT INTO public.module_settings (module_id, key, type, value_boolean)
SELECT id, 'enable_notifications', 'boolean', true
FROM public.modules;