-- Atualizar o usuário atual para admin_master para poder testar o sistema
UPDATE public.profiles 
SET role = 'admin_master' 
WHERE email = 'carlos.alexandress@outlook.com';