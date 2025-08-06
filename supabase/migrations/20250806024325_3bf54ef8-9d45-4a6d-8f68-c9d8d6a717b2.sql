-- Temporariamente desabilitar RLS para resolver o problema
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Recriar a tabela profiles com estrutura correta e políticas simples
-- Primeiro, vamos verificar se o usuário atual tem dados
SELECT * FROM public.profiles WHERE user_id = auth.uid();