-- Atualizar função para incluir o novo módulo 'technician-schedule'
CREATE OR REPLACE FUNCTION public.get_user_allowed_modules(target_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(module_name text, module_title text, module_url text, module_icon text, has_custom_permission boolean, is_allowed boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
          WHEN user_role = 'admin' AND sm.name IN ('dashboard', 'desk', 'companies', 'suppliers', 'reports', 'technician-schedule') THEN true
          WHEN user_role IN ('gestor', 'admin_cliente') AND sm.name IN ('dashboard', 'desk', 'clients', 'calls', 'orders', 'equipments', 'technician', 'reports', 'technician-schedule') THEN true
          WHEN user_role = 'tecnico' AND sm.name IN ('technician', 'orders', 'calls', 'technician-schedule') THEN true
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
$function$