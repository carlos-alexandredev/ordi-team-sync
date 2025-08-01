-- Criar usuário administrador inicial
-- Primeiro, vamos inserir o usuário diretamente na tabela auth.users

-- NOTA: Em produção, este usuário deve ser criado através da interface de autenticação
-- Este SQL é apenas para desenvolvimento local

-- Inserir na tabela profiles (o usuário auth será criado via interface)
INSERT INTO public.profiles (
  user_id,
  name,
  email,
  role,
  active
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid, -- placeholder UUID
  'Carlos Alexandre',
  'carlos.alexandress@outlook.com',
  'admin',
  true
) ON CONFLICT (user_id) DO NOTHING;

-- Nota: O usuário real deve ser criado através da interface do Supabase Auth
-- ou através do signup da aplicação, depois o UUID deve ser atualizado aqui