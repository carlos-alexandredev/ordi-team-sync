-- Allow cliente_final users to upload floor plans for their company
DROP POLICY IF EXISTS "Clientes podem ver plantas da empresa" ON public.floorplans;
CREATE POLICY "Clientes podem ver plantas da empresa" 
ON public.floorplans 
FOR SELECT 
TO authenticated
USING (
  (get_user_role() = 'cliente_final' AND company_id = get_user_company()) OR
  (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'admin_master'::text, 'supervisor'::text, 'tecnico'::text]))
);

-- Allow cliente_final users to upload floor plans
CREATE POLICY "Clientes podem criar plantas da empresa" 
ON public.floorplans 
FOR INSERT 
TO authenticated
WITH CHECK (
  (get_user_role() = 'cliente_final' AND company_id = get_user_company()) OR
  (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'admin_master'::text, 'supervisor'::text, 'tecnico'::text]) 
   AND (company_id = get_user_company() OR get_user_role() = 'admin_master'))
);

-- Allow cliente_final users to update their company's floor plans
CREATE POLICY "Clientes podem atualizar plantas da empresa" 
ON public.floorplans 
FOR UPDATE 
TO authenticated
USING (
  (get_user_role() = 'cliente_final' AND company_id = get_user_company()) OR
  (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'admin_master'::text, 'supervisor'::text, 'tecnico'::text]) 
   AND (company_id = get_user_company() OR get_user_role() = 'admin_master'))
)
WITH CHECK (
  (get_user_role() = 'cliente_final' AND company_id = get_user_company()) OR
  (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'admin_master'::text, 'supervisor'::text, 'tecnico'::text]) 
   AND (company_id = get_user_company() OR get_user_role() = 'admin_master'))
);

-- Allow cliente_final users to delete their company's floor plans
CREATE POLICY "Clientes podem deletar plantas da empresa" 
ON public.floorplans 
FOR DELETE 
TO authenticated
USING (
  (get_user_role() = 'cliente_final' AND company_id = get_user_company()) OR
  (get_user_role() = ANY (ARRAY['admin'::text, 'admin_cliente'::text, 'admin_master'::text, 'supervisor'::text, 'tecnico'::text]) 
   AND (company_id = get_user_company() OR get_user_role() = 'admin_master'))
);