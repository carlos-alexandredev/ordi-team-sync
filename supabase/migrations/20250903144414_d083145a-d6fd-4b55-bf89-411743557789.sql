-- Remove a política do gestor que não existe
DROP POLICY IF EXISTS "Gestores podem gerenciar plantas da empresa" ON public.floorplans;
DROP POLICY IF EXISTS "Gestores podem gerenciar posições de equipamentos da empresa" ON public.equipment_floorplan_positions;

-- Atualizar política existente para incluir mais papéis administrativos
DROP POLICY IF EXISTS "Usuários podem gerenciar plantas da empresa" ON public.floorplans;
CREATE POLICY "Usuários podem gerenciar plantas da empresa" 
ON public.floorplans 
FOR ALL 
TO authenticated
USING (
  (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'admin_master'::text, 'supervisor'::text, 'tecnico'::text])) 
  AND (company_id = get_user_company() OR get_user_role() = 'admin_master'::text)
)
WITH CHECK (
  (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'admin_master'::text, 'supervisor'::text, 'tecnico'::text])) 
  AND (company_id = get_user_company() OR get_user_role() = 'admin_master'::text)
);

-- Atualizar política de posições de equipamentos
DROP POLICY IF EXISTS "Usuários podem gerenciar posições de equipamentos da empresa" ON public.equipment_floorplan_positions;
CREATE POLICY "Usuários podem gerenciar posições de equipamentos da empresa" 
ON public.equipment_floorplan_positions 
FOR ALL 
TO authenticated
USING (
  (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'admin_master'::text, 'supervisor'::text, 'tecnico'::text])) 
  AND (EXISTS (
    SELECT 1 FROM equipments e 
    WHERE e.id = equipment_floorplan_positions.equipment_id 
    AND (e.company_id = get_user_company() OR get_user_role() = 'admin_master'::text)
  ))
)
WITH CHECK (
  (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'admin_master'::text, 'supervisor'::text, 'tecnico'::text])) 
  AND (EXISTS (
    SELECT 1 FROM equipments e 
    WHERE e.id = equipment_floorplan_positions.equipment_id 
    AND (e.company_id = get_user_company() OR get_user_role() = 'admin_master'::text)
  ))
);