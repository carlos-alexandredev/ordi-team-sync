-- Criar tabela de empresas
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  fantasy_name TEXT,
  cnpj TEXT,
  responsible_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de empresas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Política para empresas - apenas admins podem ver todas
CREATE POLICY "Admins podem ver todas as empresas" 
ON public.companies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política para empresas - apenas admins podem inserir
CREATE POLICY "Admins podem criar empresas" 
ON public.companies 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política para empresas - apenas admins podem atualizar
CREATE POLICY "Admins podem atualizar empresas" 
ON public.companies 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Adicionar empresa_id à tabela profiles
ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Atualizar os tipos de role para ser mais específico
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'cliente_final';

-- Criar trigger para atualizar updated_at nas empresas
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir algumas empresas padrão
INSERT INTO public.companies (name, fantasy_name, cnpj, responsible_name, active) VALUES
('Empresa Matriz', 'Matriz Segurança', '12.345.678/0001-90', 'João Silva', true),
('TechSec Ltda', 'TechSec', '98.765.432/0001-10', 'Maria Santos', true),
('SecureMax', 'SecureMax Facilities', '11.222.333/0001-44', 'Pedro Costa', true);

-- Criar política adicional para usuários verem empresas (para selects em formulários)
CREATE POLICY "Usuários autenticados podem ver empresas ativas" 
ON public.companies 
FOR SELECT 
USING (active = true AND auth.uid() IS NOT NULL);