-- Criar bucket para anexos de ordens e chamados
INSERT INTO storage.buckets (id, name, public) VALUES ('order-attachments', 'order-attachments', true);

-- Criar tabela para anexos de ordens
CREATE TABLE public.order_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para anexos de chamados
CREATE TABLE public.call_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para logs de check-in/check-out
CREATE TABLE public.order_time_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  technician_id UUID NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  check_in_location TEXT,
  check_out_location TEXT,
  total_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para equipamentos por cliente
CREATE TABLE public.equipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  model TEXT,
  serial_number TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  installation_date DATE,
  last_maintenance_date DATE,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para vincular equipamentos às ordens
CREATE TABLE public.order_equipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  equipment_id UUID NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'manutenção',
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_order_attachments_order_id ON public.order_attachments(order_id);
CREATE INDEX idx_call_attachments_call_id ON public.call_attachments(call_id);
CREATE INDEX idx_order_time_logs_order_id ON public.order_time_logs(order_id);
CREATE INDEX idx_order_time_logs_technician_id ON public.order_time_logs(technician_id);
CREATE INDEX idx_equipments_client_id ON public.equipments(client_id);
CREATE INDEX idx_equipments_company_id ON public.equipments(company_id);
CREATE INDEX idx_order_equipments_order_id ON public.order_equipments(order_id);
CREATE INDEX idx_order_equipments_equipment_id ON public.order_equipments(equipment_id);

-- Habilitar RLS
ALTER TABLE public.order_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_equipments ENABLE ROW LEVEL SECURITY;

-- Policies para order_attachments
CREATE POLICY "Usuários podem ver anexos de ordens que têm acesso" 
ON public.order_attachments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_attachments.order_id 
    AND (
      (get_user_role() = 'cliente_final' AND orders.client_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
      OR (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND orders.company_id = get_user_company())
      OR get_user_role() = 'admin'
    )
  )
);

CREATE POLICY "Usuários podem criar anexos em ordens que têm acesso" 
ON public.order_attachments FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_attachments.order_id 
    AND (
      (get_user_role() = 'cliente_final' AND orders.client_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
      OR (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND orders.company_id = get_user_company())
      OR get_user_role() = 'admin'
    )
  )
);

-- Policies para call_attachments
CREATE POLICY "Usuários podem ver anexos de chamados que têm acesso" 
ON public.call_attachments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.calls 
    WHERE calls.id = call_attachments.call_id 
    AND (
      (get_user_role() = 'cliente_final' AND calls.client_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
      OR (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND calls.company_id = get_user_company())
      OR get_user_role() = 'admin'
    )
  )
);

CREATE POLICY "Usuários podem criar anexos em chamados que têm acesso" 
ON public.call_attachments FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.calls 
    WHERE calls.id = call_attachments.call_id 
    AND (
      (get_user_role() = 'cliente_final' AND calls.client_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
      OR (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND calls.company_id = get_user_company())
      OR get_user_role() = 'admin'
    )
  )
);

-- Policies para order_time_logs
CREATE POLICY "Usuários podem ver logs de tempo de ordens que têm acesso" 
ON public.order_time_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_time_logs.order_id 
    AND (
      orders.technician_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND orders.company_id = get_user_company())
      OR get_user_role() = 'admin'
    )
  )
);

CREATE POLICY "Técnicos podem registrar tempo em suas ordens" 
ON public.order_time_logs FOR INSERT 
WITH CHECK (
  technician_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_time_logs.order_id 
    AND orders.technician_id = technician_id
  )
);

CREATE POLICY "Técnicos podem atualizar logs de tempo de suas ordens" 
ON public.order_time_logs FOR UPDATE 
USING (
  technician_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) AND
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_time_logs.order_id 
    AND orders.technician_id = technician_id
  )
);

-- Policies para equipments
CREATE POLICY "Usuários podem ver equipamentos da sua empresa" 
ON public.equipments FOR SELECT 
USING (
  (get_user_role() = 'cliente_final' AND client_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
  OR (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND company_id = get_user_company())
  OR get_user_role() = 'admin'
);

CREATE POLICY "Admins podem criar equipamentos" 
ON public.equipments FOR INSERT 
WITH CHECK (
  (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND company_id = get_user_company())
  OR get_user_role() = 'admin'
);

CREATE POLICY "Admins podem atualizar equipamentos" 
ON public.equipments FOR UPDATE 
USING (
  (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND company_id = get_user_company())
  OR get_user_role() = 'admin'
);

-- Policies para order_equipments
CREATE POLICY "Usuários podem ver equipamentos de ordens que têm acesso" 
ON public.order_equipments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_equipments.order_id 
    AND (
      (get_user_role() = 'cliente_final' AND orders.client_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
      OR (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND orders.company_id = get_user_company())
      OR get_user_role() = 'admin'
    )
  )
);

CREATE POLICY "Admins podem vincular equipamentos às ordens" 
ON public.order_equipments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_equipments.order_id 
    AND (
      (get_user_role() = ANY(ARRAY['admin', 'admin_cliente']) AND orders.company_id = get_user_company())
      OR get_user_role() = 'admin'
    )
  )
);

-- Storage policies para anexos
CREATE POLICY "Anexos são públicos para visualização" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'order-attachments');

CREATE POLICY "Usuários autenticados podem fazer upload de anexos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'order-attachments' AND auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_order_time_logs_updated_at
  BEFORE UPDATE ON public.order_time_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipments_updated_at
  BEFORE UPDATE ON public.equipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular tempo total
CREATE OR REPLACE FUNCTION public.calculate_time_log_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
    NEW.total_minutes := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_order_time_duration
  BEFORE INSERT OR UPDATE ON public.order_time_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_time_log_duration();