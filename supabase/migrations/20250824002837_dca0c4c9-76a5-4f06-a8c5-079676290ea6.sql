
-- 1) Permissões RLS para permitir que técnico e cliente final INSIRAM/ATUALIZEM equipamentos
-- Mantemos DELETE bloqueado (sem política de DELETE)

-- Técnicos podem ver equipamentos da própria empresa
CREATE POLICY "tecnico_select_equipments_company"
  ON public.equipments
  FOR SELECT
  USING (
    (get_user_role() = 'tecnico')
    AND (company_id = get_user_company())
  );

-- Técnicos podem criar equipamentos para a própria empresa
CREATE POLICY "tecnico_insert_equipments_company"
  ON public.equipments
  FOR INSERT
  WITH CHECK (
    (get_user_role() = 'tecnico')
    AND (company_id = get_user_company())
  );

-- Técnicos podem atualizar equipamentos da própria empresa
CREATE POLICY "tecnico_update_equipments_company"
  ON public.equipments
  FOR UPDATE
  USING (
    (get_user_role() = 'tecnico')
    AND (company_id = get_user_company())
  )
  WITH CHECK (
    (get_user_role() = 'tecnico')
    AND (company_id = get_user_company())
  );

-- Clientes finais já conseguem SELECT pelos policies existentes,
-- mas precisam poder inserir/atualizar apenas o que for deles (empresa + seu próprio perfil como client_id)

-- Cliente final pode inserir equipamentos para sua empresa e seu próprio perfil
CREATE POLICY "cliente_final_insert_own_equipment"
  ON public.equipments
  FOR INSERT
  WITH CHECK (
    (get_user_role() = 'cliente_final')
    AND (company_id = get_user_company())
    AND (
      client_id = (
        SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
      )
    )
  );

-- Cliente final pode atualizar equipamentos da sua empresa e do seu próprio perfil
CREATE POLICY "cliente_final_update_own_equipment"
  ON public.equipments
  FOR UPDATE
  USING (
    (get_user_role() = 'cliente_final')
    AND (company_id = get_user_company())
    AND (
      client_id = (
        SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    (get_user_role() = 'cliente_final')
    AND (company_id = get_user_company())
    AND (
      client_id = (
        SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
      )
    )
  );



-- 2) Atualizar a função get_user_allowed_modules para liberar o módulo "equipments"
-- para técnico e cliente_final também

CREATE OR REPLACE FUNCTION public.get_user_allowed_modules(target_user_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(module_name text, module_title text, module_url text, module_icon text, has_custom_permission boolean, is_allowed boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
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
            'technician','orders','calls','desk','equipments'
          ) THEN true

          WHEN user_role = 'cliente_final' AND sm.name IN (
            'desk','calls','orders','equipments'
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



-- 3) Habilitar auditoria (logs) automática via triggers para INSERT/UPDATE/DELETE

-- Equipments
DROP TRIGGER IF EXISTS trg_equipments_audit_ins ON public.equipments;
DROP TRIGGER IF EXISTS trg_equipments_audit_upd ON public.equipments;
DROP TRIGGER IF EXISTS trg_equipments_audit_del ON public.equipments;

CREATE TRIGGER trg_equipments_audit_ins
AFTER INSERT ON public.equipments
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER trg_equipments_audit_upd
AFTER UPDATE ON public.equipments
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER trg_equipments_audit_del
AFTER DELETE ON public.equipments
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();


-- Também ativar auditoria para outras entidades principais (opcional mas recomendado)

-- Orders
DROP TRIGGER IF EXISTS trg_orders_audit_ins ON public.orders;
DROP TRIGGER IF EXISTS trg_orders_audit_upd ON public.orders;
DROP TRIGGER IF EXISTS trg_orders_audit_del ON public.orders;

CREATE TRIGGER trg_orders_audit_ins
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER trg_orders_audit_upd
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER trg_orders_audit_del
AFTER DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();


-- Calls
DROP TRIGGER IF EXISTS trg_calls_audit_ins ON public.calls;
DROP TRIGGER IF EXISTS trg_calls_audit_upd ON public.calls;
DROP TRIGGER IF EXISTS trg_calls_audit_del ON public.calls;

CREATE TRIGGER trg_calls_audit_ins
AFTER INSERT ON public.calls
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER trg_calls_audit_upd
AFTER UPDATE ON public.calls
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER trg_calls_audit_del
AFTER DELETE ON public.calls
FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();
