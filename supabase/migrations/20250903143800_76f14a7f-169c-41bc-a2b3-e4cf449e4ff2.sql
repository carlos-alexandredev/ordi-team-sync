-- Add RLS policies for 'gestor' role on floorplans table
CREATE POLICY "Gestores podem gerenciar plantas da empresa" 
ON public.floorplans 
FOR ALL 
TO authenticated
USING (
  (get_user_role() = 'gestor' AND company_id = get_user_company())
)
WITH CHECK (
  (get_user_role() = 'gestor' AND company_id = get_user_company())
);

-- Add RLS policies for 'gestor' role on equipment_floorplan_positions table
CREATE POLICY "Gestores podem gerenciar posições de equipamentos da empresa" 
ON public.equipment_floorplan_positions 
FOR ALL 
TO authenticated
USING (
  (get_user_role() = 'gestor' AND EXISTS (
    SELECT 1 FROM equipments e 
    WHERE e.id = equipment_floorplan_positions.equipment_id 
    AND e.company_id = get_user_company()
  ))
)
WITH CHECK (
  (get_user_role() = 'gestor' AND EXISTS (
    SELECT 1 FROM equipments e 
    WHERE e.id = equipment_floorplan_positions.equipment_id 
    AND e.company_id = get_user_company()
  ))
);