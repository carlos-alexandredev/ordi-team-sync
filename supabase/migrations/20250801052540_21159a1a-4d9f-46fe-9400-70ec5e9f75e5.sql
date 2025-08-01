-- Atualizar o usuário carlos.alexandress@outlook.com para administrador do sistema
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = '6f80bbe8-2162-4735-aeb5-0f7dbf0683dd';