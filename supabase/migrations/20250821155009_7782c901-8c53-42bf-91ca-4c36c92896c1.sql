
-- 1) PERFIS (profiles) - refatorar RLS

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas baseadas em UID fixo
DROP POLICY IF EXISTS "admin_master_delete" ON public.profiles;
DROP POLICY IF EXISTS "admin_master_insert" ON public.profiles;
DROP POLICY IF EXISTS "admin_master_update" ON public.profiles;
DROP POLICY IF EXISTS "admin_master_view_all" ON public.profiles;
DROP POLICY IF EXISTS "basic_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "basic_update_own_profile" ON public.profiles;

-- admin_master: CRUD completo
CREATE POLICY "profiles_admin_master_select_all"
  ON public.profiles FOR SELECT
  USING (is_admin_master());

CREATE POLICY "profiles_admin_master_insert_all"
  ON public.profiles FOR INSERT
  WITH CHECK (is_admin_master());

CREATE POLICY "profiles_admin_master_update_all"
  ON public.profiles FOR UPDATE
  USING (is_admin_master())
  WITH CHECK (is_admin_master());

CREATE POLICY "profiles_admin_master_delete_all"
  ON public.profiles FOR DELETE
  USING (is_admin_master());

-- admin_cliente: gerenciar apenas subordinados da própria empresa (cliente_final/tecnico/gestor)
CREATE POLICY "profiles_admin_cliente_select_company_users"
  ON public.profiles FOR SELECT
  USING (
    get_user_role() = 'admin_cliente'
    AND company_id = get_user_company()
  );

CREATE POLICY "profiles_admin_cliente_insert_company_users"
  ON public.profiles FOR INSERT
  WITH CHECK (
    get_user_role() = 'admin_cliente'
    AND company_id = get_user_company()
    AND role = ANY (ARRAY['cliente_final','tecnico','gestor'])
  );

CREATE POLICY "profiles_admin_cliente_update_company_users"
  ON public.profiles FOR UPDATE
  USING (
    get_user_role() = 'admin_cliente'
    AND company_id = get_user_company()
    AND role = ANY (ARRAY['cliente_final','tecnico','gestor'])
  )
  WITH CHECK (
    company_id = get_user_company()
    AND role = ANY (ARRAY['cliente_final','tecnico','gestor'])
  );

CREATE POLICY "profiles_admin_cliente_delete_company_users"
  ON public.profiles FOR DELETE
  USING (
    get_user_role() = 'admin_cliente'
    AND company_id = get_user_company()
    AND role = ANY (ARRAY['cliente_final','tecnico','gestor'])
  );

-- Usuário: ler e atualizar o próprio perfil
CREATE POLICY "profiles_user_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_user_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 2) EMPRESAS (companies) - restringir criação e acesso

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins podem atualizar empresas" ON public.companies;
DROP POLICY IF EXISTS "Admins podem criar empresas" ON public.companies;
DROP POLICY IF EXISTS "Admins podem ver todas as empresas" ON public.companies;
DROP POLICY IF EXISTS "Usuários autenticados podem ver empresas ativas" ON public.companies;

-- admin_master: ver/insert/update todas
CREATE POLICY "companies_admin_master_select_all"
  ON public.companies FOR SELECT
  USING (is_admin_master());

CREATE POLICY "companies_admin_master_insert"
  ON public.companies FOR INSERT
  WITH CHECK (is_admin_master());

CREATE POLICY "companies_admin_master_update"
  ON public.companies FOR UPDATE
  USING (is_admin_master())
  WITH CHECK (is_admin_master());

-- admin_cliente e demais: ver apenas a própria empresa
CREATE POLICY "companies_user_select_own_company"
  ON public.companies FOR SELECT
  USING (id = get_user_company());

-- admin_cliente pode atualizar a própria empresa
CREATE POLICY "companies_admin_cliente_update_own"
  ON public.companies FOR UPDATE
  USING (
    get_user_role() = 'admin_cliente'
    AND id = get_user_company()
  )
  WITH CHECK (id = get_user_company());


-- 3) MÓDULOS PERMITIDOS - atualizar função de módulos por role
CREATE OR REPLACE FUNCTION public.get_user_allowed_modules(target_user_id uuid DEFAULT NULL::uuid)
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
AS $function$
DECLARE
  user_role text;
  profile_id uuid;
BEGIN
  -- Descobrir usuário-alvo
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
      WHEN up.id IS NOT NULL THEN up.can_access
      ELSE (
        CASE 
          WHEN user_role = 'admin_master' THEN true

          WHEN user_role = 'admin_cliente' AND sm.name IN (
            'dashboard','desk','calls','orders','equipments','operacao','cadastros'
          ) THEN true

          WHEN user_role = 'gestor' AND sm.name IN (
            'operacao','orders','calls','desk'
          ) THEN true

          WHEN user_role = 'tecnico' AND sm.name IN (
            'technician','orders','calls','desk'
          ) THEN true

          WHEN user_role = 'cliente_final' AND sm.name IN (
            'desk','calls','orders'
          ) THEN true

          ELSE false
        END
      )
    END AS is_allowed
  FROM public.system_modules sm
  LEFT JOIN public.user_permissions up 
    ON sm.id = up.module_id 
   AND up.user_id = profile_id
  WHERE sm.is_active = true
  ORDER BY sm.name;
END;
$function$;
