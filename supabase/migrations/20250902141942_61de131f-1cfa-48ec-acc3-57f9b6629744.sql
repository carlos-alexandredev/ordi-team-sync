-- Permitir que admin_master acesse todas as plantas baixas sem company_id
DROP POLICY IF EXISTS "Admin master pode gerenciar todas as plantas" ON floorplans;
DROP POLICY IF EXISTS "Usuários podem gerenciar plantas da empresa" ON floorplans;
DROP POLICY IF EXISTS "Clientes podem ver plantas da empresa" ON floorplans;

CREATE POLICY "Admin master pode gerenciar todas as plantas" 
ON floorplans FOR ALL 
USING (is_admin_master()) 
WITH CHECK (is_admin_master());

CREATE POLICY "Usuários podem gerenciar plantas da empresa" 
ON floorplans FOR ALL 
USING (
  (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'supervisor'::text, 'tecnico'::text])) 
  AND (company_id = get_user_company())
) 
WITH CHECK (
  (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'supervisor'::text, 'tecnico'::text])) 
  AND (company_id = get_user_company())
);

CREATE POLICY "Clientes podem ver plantas da empresa" 
ON floorplans FOR SELECT 
USING (
  (get_user_role() = 'cliente_final'::text) 
  AND (company_id = get_user_company())
);

-- Permitir que admin_master crie equipamentos sem company_id restrito
DROP POLICY IF EXISTS "Admins podem criar equipamentos" ON equipments;
DROP POLICY IF EXISTS "Admins podem atualizar equipamentos" ON equipments;

CREATE POLICY "Admins podem criar equipamentos" 
ON equipments FOR INSERT 
WITH CHECK (
  is_admin_master() OR 
  ((get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text])) AND (company_id = get_user_company()))
);

CREATE POLICY "Admins podem atualizar equipamentos" 
ON equipments FOR UPDATE 
USING (
  is_admin_master() OR 
  ((get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text])) AND (company_id = get_user_company()))
);