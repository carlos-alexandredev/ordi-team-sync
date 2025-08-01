-- Fix the relationship for equipments query by ensuring proper foreign key references
-- The error suggests there's an issue with the equipments-profiles relationship

-- First, let's check if we need to add a foreign key reference from equipments to profiles
-- Since equipments has client_id which should reference profiles.id

ALTER TABLE public.equipments 
ADD CONSTRAINT fk_equipments_client_id 
FOREIGN KEY (client_id) REFERENCES public.profiles(id);

-- Also add constraint for company_id to companies table if not exists
ALTER TABLE public.equipments 
ADD CONSTRAINT fk_equipments_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id);