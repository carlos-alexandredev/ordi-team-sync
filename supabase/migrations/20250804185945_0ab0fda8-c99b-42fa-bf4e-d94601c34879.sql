-- Atualizar perfil do usuário para admin master
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'carlos.alexandress@outlook.com';