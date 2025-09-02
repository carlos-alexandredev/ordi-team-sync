-- Add location enhancement fields to equipments table
ALTER TABLE public.equipments 
ADD COLUMN location_detail TEXT,
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Create floor plans table
CREATE TABLE public.floorplans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  image_width INTEGER NOT NULL,
  image_height INTEGER NOT NULL,
  scale_meters_per_pixel DECIMAL(10, 6),
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment floor plan positions table
CREATE TABLE public.equipment_floorplan_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL,
  floorplan_id UUID NOT NULL,
  x_position INTEGER NOT NULL,
  y_position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(equipment_id, floorplan_id)
);

-- Enable RLS on new tables
ALTER TABLE public.floorplans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_floorplan_positions ENABLE ROW LEVEL SECURITY;

-- RLS policies for floorplans
CREATE POLICY "Admin master pode gerenciar todas as plantas"
ON public.floorplans FOR ALL
USING (is_admin_master())
WITH CHECK (is_admin_master());

CREATE POLICY "Usuários podem gerenciar plantas da empresa"
ON public.floorplans FOR ALL
USING (
  (get_user_role() = ANY(ARRAY['admin'::text, 'admin_cliente'::text, 'supervisor'::text, 'tecnico'::text])) 
  AND (company_id = get_user_company())
)
WITH CHECK (
  (get_user_role() = ANY(ARRAY['admin'::text, 'admin_cliente'::text, 'supervisor'::text, 'tecnico'::text])) 
  AND (company_id = get_user_company())
);

CREATE POLICY "Clientes podem ver plantas da empresa"
ON public.floorplans FOR SELECT
USING (
  (get_user_role() = 'cliente_final'::text) 
  AND (company_id = get_user_company())
);

-- RLS policies for equipment_floorplan_positions
CREATE POLICY "Admin master pode gerenciar todas as posições"
ON public.equipment_floorplan_positions FOR ALL
USING (is_admin_master())
WITH CHECK (is_admin_master());

CREATE POLICY "Usuários podem gerenciar posições de equipamentos da empresa"
ON public.equipment_floorplan_positions FOR ALL
USING (
  (get_user_role() = ANY(ARRAY['admin'::text, 'admin_cliente'::text, 'supervisor'::text, 'tecnico'::text])) 
  AND EXISTS (
    SELECT 1 FROM public.equipments e 
    WHERE e.id = equipment_floorplan_positions.equipment_id 
    AND e.company_id = get_user_company()
  )
)
WITH CHECK (
  (get_user_role() = ANY(ARRAY['admin'::text, 'admin_cliente'::text, 'supervisor'::text, 'tecnico'::text])) 
  AND EXISTS (
    SELECT 1 FROM public.equipments e 
    WHERE e.id = equipment_floorplan_positions.equipment_id 
    AND e.company_id = get_user_company()
  )
);

CREATE POLICY "Clientes podem ver posições de seus equipamentos"
ON public.equipment_floorplan_positions FOR SELECT
USING (
  (get_user_role() = 'cliente_final'::text) 
  AND EXISTS (
    SELECT 1 FROM public.equipments e 
    WHERE e.id = equipment_floorplan_positions.equipment_id 
    AND e.company_id = get_user_company()
    AND e.client_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Create storage bucket for floor plans
INSERT INTO storage.buckets (id, name, public) 
VALUES ('floorplans', 'floorplans', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for floor plans
CREATE POLICY "Floor plans are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'floorplans');

CREATE POLICY "Authorized users can upload floor plans"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'floorplans' 
  AND (
    is_admin_master() 
    OR get_user_role() = ANY(ARRAY['admin'::text, 'admin_cliente'::text, 'supervisor'::text])
  )
);

CREATE POLICY "Authorized users can update floor plans"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'floorplans' 
  AND (
    is_admin_master() 
    OR get_user_role() = ANY(ARRAY['admin'::text, 'admin_cliente'::text, 'supervisor'::text])
  )
);

CREATE POLICY "Authorized users can delete floor plans"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'floorplans' 
  AND (
    is_admin_master() 
    OR get_user_role() = ANY(ARRAY['admin'::text, 'admin_cliente'::text, 'supervisor'::text])
  )
);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_floorplans_updated_at
BEFORE UPDATE ON public.floorplans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_floorplan_positions_updated_at
BEFORE UPDATE ON public.equipment_floorplan_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();