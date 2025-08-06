-- Update email for carlos and set as admin_master
UPDATE public.profiles 
SET 
  email = 'carlos.alexandress@outlook.com',
  role = 'admin_master',
  active = true
WHERE email = 'carlos.alexandress@utlook.com';

-- If no rows updated, insert new record
INSERT INTO public.profiles (
  id,
  user_id, 
  name, 
  email, 
  role, 
  active
) 
SELECT 
  gen_random_uuid(),
  gen_random_uuid(),
  'Carlos Alexandre',
  'carlos.alexandress@outlook.com',
  'admin_master',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE email = 'carlos.alexandress@outlook.com'
);