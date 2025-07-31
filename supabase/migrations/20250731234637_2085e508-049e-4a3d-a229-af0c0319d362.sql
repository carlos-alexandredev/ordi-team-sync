-- Criar sistema Ordi com tabelas essenciais

-- 1. Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela de ordens de serviço
CREATE TABLE public.service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'completed', 'cancelled')),
  requester_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  location TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  cost DECIMAL(10,2),
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Tabela de categorias
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'wrench',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabela de comentários/atualizações
CREATE TABLE public.order_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Tabela de histórico de status
CREATE TABLE public.order_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ativar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Usuários podem ver todos os perfis" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários podem atualizar próprio perfil" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir próprio perfil" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para service_orders
CREATE POLICY "Usuários podem ver ordens que criaram ou foram atribuídas" 
ON public.service_orders 
FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = assigned_to);

CREATE POLICY "Usuários podem criar ordens" 
ON public.service_orders 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Usuários podem atualizar ordens que criaram ou foram atribuídas" 
ON public.service_orders 
FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = assigned_to);

-- Políticas RLS para categories (apenas leitura para usuários)
CREATE POLICY "Todos podem ver categorias ativas" 
ON public.categories 
FOR SELECT 
USING (active = true);

-- Políticas RLS para order_comments
CREATE POLICY "Usuários podem ver comentários de ordens que têm acesso" 
ON public.order_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.service_orders 
    WHERE id = order_id 
    AND (requester_id = auth.uid() OR assigned_to = auth.uid())
  )
);

CREATE POLICY "Usuários podem criar comentários em ordens que têm acesso" 
ON public.order_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.service_orders 
    WHERE id = order_id 
    AND (requester_id = auth.uid() OR assigned_to = auth.uid())
  )
);

-- Políticas RLS para order_history
CREATE POLICY "Usuários podem ver histórico de ordens que têm acesso" 
ON public.order_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.service_orders 
    WHERE id = order_id 
    AND (requester_id = auth.uid() OR assigned_to = auth.uid())
  )
);

-- Função para gerar número de ordem automático
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  order_num TEXT;
BEGIN
  -- Buscar o próximo número baseado no ano atual
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.service_orders
  WHERE order_number LIKE TO_CHAR(NOW(), 'YYYY') || '%';
  
  -- Formatar como YYYY-NNNNNN
  order_num := TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_num::TEXT, 6, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_orders_updated_at
BEFORE UPDATE ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para gerar número de ordem automático
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_service_order_number
BEFORE INSERT ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION set_order_number();

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Inserir categorias padrão
INSERT INTO public.categories (name, description, color, icon) VALUES
('Manutenção', 'Serviços de manutenção preventiva e corretiva', '#F59E0B', 'wrench'),
('TI/Informática', 'Suporte técnico e infraestrutura de TI', '#3B82F6', 'monitor'),
('Limpeza', 'Serviços de limpeza e higienização', '#10B981', 'spray-can'),
('Segurança', 'Questões relacionadas à segurança', '#EF4444', 'shield'),
('Infraestrutura', 'Melhorias e reparos em infraestrutura', '#8B5CF6', 'building'),
('Recursos Humanos', 'Solicitações relacionadas a RH', '#F97316', 'users'),
('Outros', 'Outras solicitações não categorizadas', '#6B7280', 'help-circle');