-- Criar tabela de tarefas/ordens de serviço
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assigned_to UUID NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  task_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  questionnaire_id UUID,
  priority TEXT NOT NULL DEFAULT 'média' CHECK (priority IN ('baixa', 'média', 'alta')),
  description TEXT NOT NULL,
  check_in_type TEXT NOT NULL DEFAULT 'manual' CHECK (check_in_type IN ('manual', 'automático', 'qr_code')),
  keyword TEXT,
  external_code TEXT,
  use_satisfaction_survey BOOLEAN DEFAULT false,
  survey_recipient_email TEXT,
  
  -- Localização
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  client_id UUID,
  google_maps_url TEXT,
  
  -- Repetição
  is_recurring BOOLEAN DEFAULT false,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  week_days INTEGER[],
  end_type TEXT CHECK (end_type IN ('date', 'count')),
  end_date TIMESTAMP WITH TIME ZONE,
  repeat_count INTEGER,
  
  -- Valores
  products_total NUMERIC DEFAULT 0,
  services_total NUMERIC DEFAULT 0,
  additional_costs_total NUMERIC DEFAULT 0,
  global_discount NUMERIC DEFAULT 0,
  final_total NUMERIC DEFAULT 0,
  
  -- Status e controle
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluída', 'cancelada')),
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de produtos da tarefa
CREATE TABLE public.task_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de serviços da tarefa
CREATE TABLE public.task_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de custos adicionais da tarefa
CREATE TABLE public.task_additional_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  description TEXT NOT NULL,
  value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de anexos da tarefa
CREATE TABLE public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de equipamentos da tarefa
CREATE TABLE public.task_equipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  equipment_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_additional_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_equipments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tasks
CREATE POLICY "Usuários podem ver tarefas da sua empresa" 
ON public.tasks 
FOR SELECT 
USING (
  (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text, 'tecnico'::text])) 
  AND (company_id = get_user_company() OR get_user_role() = 'admin'::text)
);

CREATE POLICY "Gestores podem criar tarefas" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
  (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text])) 
  AND (company_id = get_user_company() OR get_user_role() = 'admin'::text)
);

CREATE POLICY "Gestores podem atualizar tarefas" 
ON public.tasks 
FOR UPDATE 
USING (
  (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text])) 
  AND (company_id = get_user_company() OR get_user_role() = 'admin'::text)
);

-- Políticas para task_products
CREATE POLICY "Usuários podem ver produtos de tarefas que têm acesso" 
ON public.task_products 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_products.task_id 
    AND (
      (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text, 'tecnico'::text])) 
      AND (tasks.company_id = get_user_company() OR get_user_role() = 'admin'::text)
    )
  )
);

CREATE POLICY "Gestores podem gerenciar produtos de tarefas" 
ON public.task_products 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_products.task_id 
    AND (
      (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text])) 
      AND (tasks.company_id = get_user_company() OR get_user_role() = 'admin'::text)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_products.task_id 
    AND (
      (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text])) 
      AND (tasks.company_id = get_user_company() OR get_user_role() = 'admin'::text)
    )
  )
);

-- Políticas similares para task_services
CREATE POLICY "Usuários podem ver serviços de tarefas que têm acesso" 
ON public.task_services 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_services.task_id 
    AND (
      (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text, 'tecnico'::text])) 
      AND (tasks.company_id = get_user_company() OR get_user_role() = 'admin'::text)
    )
  )
);

CREATE POLICY "Gestores podem gerenciar serviços de tarefas" 
ON public.task_services 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_services.task_id 
    AND (
      (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text])) 
      AND (tasks.company_id = get_user_company() OR get_user_role() = 'admin'::text)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_services.task_id 
    AND (
      (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text])) 
      AND (tasks.company_id = get_user_company() OR get_user_role() = 'admin'::text)
    )
  )
);

-- Políticas para task_additional_costs
CREATE POLICY "Usuários podem ver custos de tarefas que têm acesso" 
ON public.task_additional_costs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_additional_costs.task_id 
    AND (
      (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text, 'tecnico'::text])) 
      AND (tasks.company_id = get_user_company() OR get_user_role() = 'admin'::text)
    )
  )
);

CREATE POLICY "Gestores podem gerenciar custos de tarefas" 
ON public.task_additional_costs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_additional_costs.task_id 
    AND (
      (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text])) 
      AND (tasks.company_id = get_user_company() OR get_user_role() = 'admin'::text)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_additional_costs.task_id 
    AND (
      (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text])) 
      AND (tasks.company_id = get_user_company() OR get_user_role() = 'admin'::text)
    )
  )
);

-- Políticas para task_attachments
CREATE POLICY "Usuários podem ver anexos de tarefas que têm acesso" 
ON public.task_attachments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_attachments.task_id 
    AND (
      (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text, 'tecnico'::text])) 
      AND (tasks.company_id = get_user_company() OR get_user_role() = 'admin'::text)
    )
  )
);

CREATE POLICY "Usuários podem criar anexos em tarefas que têm acesso" 
ON public.task_attachments 
FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_attachments.task_id 
    AND (
      (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text, 'tecnico'::text])) 
      AND (tasks.company_id = get_user_company() OR get_user_role() = 'admin'::text)
    )
  )
);

-- Políticas para task_equipments
CREATE POLICY "Usuários podem ver equipamentos de tarefas que têm acesso" 
ON public.task_equipments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_equipments.task_id 
    AND (
      (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text, 'tecnico'::text])) 
      AND (tasks.company_id = get_user_company() OR get_user_role() = 'admin'::text)
    )
  )
);

CREATE POLICY "Gestores podem gerenciar equipamentos de tarefas" 
ON public.task_equipments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_equipments.task_id 
    AND (
      (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text])) 
      AND (tasks.company_id = get_user_company() OR get_user_role() = 'admin'::text)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_equipments.task_id 
    AND (
      (get_user_role() = ANY (ARRAY['admin'::text, 'gestor'::text])) 
      AND (tasks.company_id = get_user_company() OR get_user_role() = 'admin'::text)
    )
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();