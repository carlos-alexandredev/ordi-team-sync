-- Set carlos.alexandress@outlook.com as admin_master
INSERT INTO public.profiles (
  id,
  user_id, 
  name, 
  email, 
  role, 
  active
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(), -- Temporary user_id, will be updated when user signs up
  'Carlos Alexandre',
  'carlos.alexandress@outlook.com',
  'admin_master',
  true
) ON CONFLICT (email) 
DO UPDATE SET 
  role = 'admin_master',
  active = true;