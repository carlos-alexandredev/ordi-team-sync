-- Remover a constraint antiga
ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;

-- Adicionar nova constraint incluindo admin_master e gestor
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'admin_master'::text, 'admin_cliente'::text, 'gestor'::text, 'cliente_final'::text, 'tecnico'::text, 'cliente'::text, 'user'::text, 'moderator'::text]));

-- Atualizar o usuário atual para admin_master
UPDATE public.profiles 
SET role = 'admin_master' 
WHERE email = 'carlos.alexandress@outlook.com';