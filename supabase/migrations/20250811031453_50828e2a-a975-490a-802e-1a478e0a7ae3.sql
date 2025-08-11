-- Criar tipos ENUM para manutenção
CREATE TYPE public.maintenance_type AS ENUM ('preventiva','preditiva','corretiva','detectiva','tempo');
CREATE TYPE public.plan_status AS ENUM ('ativo','pausado','cancelado');
CREATE TYPE public.work_status AS ENUM ('planejada','aberta','em_execucao','aguardando_peca','concluida','cancelada');

-- Tabela de planos de manutenção
CREATE TABLE public.maintenance_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  equipment_id uuid NOT NULL REFERENCES public.equipments(id),
  type public.maintenance_type NOT NULL,
  title text NOT NULL,
  description text,
  status public.plan_status NOT NULL DEFAULT 'ativo',
  -- parâmetros gerais
  periodicity_days int,            -- PV/TBM
  usage_interval numeric,          -- por horas de uso/ciclos (opcional)
  condition_metric text,           -- PdM/DM (ex: 'vibration.rms', 'temp')
  condition_threshold numeric,     -- gatilho de PdM/DM
  checklist_model_id uuid,         -- questionário a aplicar
  next_due_at timestamptz,         -- próxima data planejada
  last_executed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de ordens de manutenção
CREATE TABLE public.maintenance_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  equipment_id uuid NOT NULL REFERENCES public.equipments(id),
  plan_id uuid REFERENCES public.maintenance_plans(id),
  type public.maintenance_type NOT NULL,
  title text NOT NULL,
  description text,
  status public.work_status NOT NULL DEFAULT 'aberta',
  priority public.order_priority NOT NULL DEFAULT 'média',
  scheduled_date timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  technician_id uuid REFERENCES public.profiles(id),
  failure_code text,               -- para corretivas/detectivas
  root_cause text,
  downtime_minutes int,           -- calculado
  mttr_minutes int,               -- calculado
  created_by uuid REFERENCES public.profiles(user_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de leituras/condição para PdM/DM
CREATE TABLE public.condition_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  equipment_id uuid NOT NULL REFERENCES public.equipments(id),
  metric text NOT NULL,         -- ex: vibration.rms
  value numeric NOT NULL,
  unit text,
  reading_at timestamptz NOT NULL DEFAULT now(),
  source text,                  -- 'manual','sensor','import'
  created_by uuid REFERENCES public.profiles(user_id)
);

-- Índices para performance
CREATE INDEX idx_mplans_equipment ON public.maintenance_plans(equipment_id);
CREATE INDEX idx_morders_equipment ON public.maintenance_orders(equipment_id);
CREATE INDEX idx_morders_status ON public.maintenance_orders(status);
CREATE INDEX idx_cread_equipment_metric ON public.condition_readings(equipment_id, metric, reading_at DESC);

-- RLS Policies para maintenance_plans
ALTER TABLE public.maintenance_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin master pode gerenciar todos os planos"
ON public.maintenance_plans
FOR ALL
USING (is_admin_master())
WITH CHECK (is_admin_master());

CREATE POLICY "Admins podem gerenciar planos da empresa"
ON public.maintenance_plans
FOR ALL
USING ((get_user_role() = ANY (ARRAY['admin', 'admin_cliente'])) AND (company_id = get_user_company()));

CREATE POLICY "Supervisores podem ver planos da empresa"
ON public.maintenance_plans
FOR SELECT
USING ((get_user_role() = 'supervisor') AND (company_id = get_user_company()));

CREATE POLICY "Técnicos podem ver planos da empresa"
ON public.maintenance_plans
FOR SELECT
USING ((get_user_role() = 'tecnico') AND (company_id = get_user_company()));

-- RLS Policies para maintenance_orders
ALTER TABLE public.maintenance_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin master pode gerenciar todas as ordens"
ON public.maintenance_orders
FOR ALL
USING (is_admin_master())
WITH CHECK (is_admin_master());

CREATE POLICY "Admins podem gerenciar ordens da empresa"
ON public.maintenance_orders
FOR ALL
USING ((get_user_role() = ANY (ARRAY['admin', 'admin_cliente'])) AND (company_id = get_user_company()));

CREATE POLICY "Supervisores podem gerenciar ordens da empresa"
ON public.maintenance_orders
FOR ALL
USING ((get_user_role() = 'supervisor') AND (company_id = get_user_company()));

CREATE POLICY "Técnicos podem ver e atualizar suas ordens"
ON public.maintenance_orders
FOR SELECT
USING ((get_user_role() = 'tecnico') AND (company_id = get_user_company()));

CREATE POLICY "Técnicos podem atualizar ordens atribuídas"
ON public.maintenance_orders
FOR UPDATE
USING ((get_user_role() = 'tecnico') AND (technician_id = (SELECT id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Clientes podem ver ordens de seus equipamentos"
ON public.maintenance_orders
FOR SELECT
USING ((get_user_role() = 'cliente_final') AND (EXISTS (
  SELECT 1 FROM equipments 
  WHERE equipments.id = maintenance_orders.equipment_id 
  AND equipments.client_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
)));

-- RLS Policies para condition_readings
ALTER TABLE public.condition_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin master pode gerenciar todas as leituras"
ON public.condition_readings
FOR ALL
USING (is_admin_master())
WITH CHECK (is_admin_master());

CREATE POLICY "Usuários podem gerenciar leituras da empresa"
ON public.condition_readings
FOR ALL
USING ((get_user_role() = ANY (ARRAY['admin', 'admin_cliente', 'supervisor', 'tecnico'])) AND (company_id = get_user_company()));

CREATE POLICY "Clientes podem ver leituras de seus equipamentos"
ON public.condition_readings
FOR SELECT
USING ((get_user_role() = 'cliente_final') AND (EXISTS (
  SELECT 1 FROM equipments 
  WHERE equipments.id = condition_readings.equipment_id 
  AND equipments.client_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
)));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_maintenance_plans_updated_at
  BEFORE UPDATE ON public.maintenance_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_orders_updated_at
  BEFORE UPDATE ON public.maintenance_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular MTTR automaticamente
CREATE OR REPLACE FUNCTION public.calculate_maintenance_mttr()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluida' AND NEW.started_at IS NOT NULL AND NEW.finished_at IS NOT NULL THEN
    NEW.mttr_minutes := EXTRACT(EPOCH FROM (NEW.finished_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_mttr_trigger
  BEFORE UPDATE ON public.maintenance_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_maintenance_mttr();