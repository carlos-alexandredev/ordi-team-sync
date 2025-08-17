-- Atualizar política RLS para calls - permitir que clientes finais vejam chamados da empresa
DROP POLICY IF EXISTS "Usuários podem ver chamados" ON calls;

CREATE POLICY "Usuários podem ver chamados" ON calls FOR SELECT USING (
  is_admin_master() OR 
  (get_user_role() = 'cliente_final' AND company_id = get_user_company()) OR
  ((get_user_role() = ANY (ARRAY['admin', 'admin_cliente'])) AND (company_id = get_user_company())) OR 
  (get_user_role() = 'admin')
);

-- Atualizar política RLS para orders - permitir que clientes finais vejam ordens da empresa
DROP POLICY IF EXISTS "Visualização de ordens por role" ON orders;

CREATE POLICY "Visualização de ordens por role" ON orders FOR SELECT USING (
  is_admin_master() OR 
  (get_user_role() = 'cliente_final' AND company_id = get_user_company()) OR
  ((get_user_role() = ANY (ARRAY['admin', 'admin_cliente'])) AND (company_id = get_user_company())) OR 
  (get_user_role() = 'admin')
);

-- Atualizar política RLS para equipments - permitir que clientes finais vejam equipamentos da empresa
DROP POLICY IF EXISTS "Usuários podem ver equipamentos da sua empresa" ON equipments;

CREATE POLICY "Usuários podem ver equipamentos da sua empresa" ON equipments FOR SELECT USING (
  is_admin_master() OR 
  (get_user_role() = 'cliente_final' AND company_id = get_user_company()) OR
  ((get_user_role() = ANY (ARRAY['admin', 'admin_cliente'])) AND (company_id = get_user_company())) OR 
  (get_user_role() = 'admin')
);