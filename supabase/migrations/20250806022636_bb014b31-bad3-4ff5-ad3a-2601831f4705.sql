-- Remover módulos antigos (users, companies, clients) e adicionar módulo cadastros
DELETE FROM public.system_modules WHERE name IN ('users', 'companies', 'clients');

-- Inserir o novo módulo cadastros
INSERT INTO public.system_modules (name, title, url, icon, description, is_active) 
VALUES ('cadastros', 'Cadastros', '/cadastros', 'Database', 'Módulo de gestão de cadastros gerais do sistema', true);

-- Atualizar referências para usar nomenclatura correta
UPDATE public.system_modules SET title = 'Colaboradores' WHERE name = 'users';
UPDATE public.system_modules SET title = 'Fornecedores' WHERE name = 'suppliers';