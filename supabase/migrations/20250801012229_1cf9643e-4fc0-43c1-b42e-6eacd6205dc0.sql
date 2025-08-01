-- Criar tipos ENUM para chamados e ordens
CREATE TYPE public.call_priority AS ENUM ('baixa', 'média', 'alta');
CREATE TYPE public.call_status AS ENUM ('aberto', 'em análise', 'fechado');
CREATE TYPE public.order_priority AS ENUM ('baixa', 'média', 'alta');
CREATE TYPE public.order_status AS ENUM ('pendente', 'em execução', 'concluída', 'cancelada');

-- Criar tabela de chamados
CREATE TABLE public.calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority public.call_priority NOT NULL DEFAULT 'média',
  status public.call_status NOT NULL DEFAULT 'aberto',
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de ordens de serviço
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pendente',
  priority public.order_priority NOT NULL DEFAULT 'média',
  call_id UUID REFERENCES public.calls(id),
  client_id UUID NOT NULL REFERENCES public.profiles(id),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  technician_id UUID REFERENCES public.profiles(id),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  execution_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Criar função auxiliar para verificar role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Criar função auxiliar para verificar empresa do usuário
CREATE OR REPLACE FUNCTION public.get_user_company()
RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies para CALLS
-- Clientes podem ver apenas seus próprios chamados
CREATE POLICY "Clientes podem ver próprios chamados" 
ON public.calls 
FOR SELECT 
USING (
  (get_user_role() = 'cliente_final' AND client_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  OR
  (get_user_role() IN ('admin', 'admin_cliente') AND company_id = get_user_company())
  OR
  (get_user_role() = 'admin')
);

-- Clientes podem criar chamados
CREATE POLICY "Clientes podem criar chamados" 
ON public.calls 
FOR INSERT 
WITH CHECK (
  get_user_role() = 'cliente_final' 
  AND client_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND company_id = get_user_company()
);

-- Admins podem atualizar chamados
CREATE POLICY "Admins podem atualizar chamados" 
ON public.calls 
FOR UPDATE 
USING (
  get_user_role() IN ('admin', 'admin_cliente')
  AND (company_id = get_user_company() OR get_user_role() = 'admin')
);

-- RLS Policies para ORDERS
-- Visualização de ordens
CREATE POLICY "Visualização de ordens por role" 
ON public.orders 
FOR SELECT 
USING (
  (get_user_role() = 'cliente_final' AND client_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  OR
  (get_user_role() IN ('admin', 'admin_cliente') AND company_id = get_user_company())
  OR
  (get_user_role() = 'admin')
);

-- Criação de ordens (apenas admins)
CREATE POLICY "Admins podem criar ordens" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  get_user_role() IN ('admin', 'admin_cliente')
  AND (company_id = get_user_company() OR get_user_role() = 'admin')
);

-- Atualização de ordens (apenas admins)
CREATE POLICY "Admins podem atualizar ordens" 
ON public.orders 
FOR UPDATE 
USING (
  get_user_role() IN ('admin', 'admin_cliente')
  AND (company_id = get_user_company() OR get_user_role() = 'admin')
);

-- Criar triggers para updated_at
CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON public.calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para performance
CREATE INDEX idx_calls_client_id ON public.calls(client_id);
CREATE INDEX idx_calls_company_id ON public.calls(company_id);
CREATE INDEX idx_calls_status ON public.calls(status);
CREATE INDEX idx_orders_client_id ON public.orders(client_id);
CREATE INDEX idx_orders_company_id ON public.orders(company_id);
CREATE INDEX idx_orders_call_id ON public.orders(call_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_technician_id ON public.orders(technician_id);