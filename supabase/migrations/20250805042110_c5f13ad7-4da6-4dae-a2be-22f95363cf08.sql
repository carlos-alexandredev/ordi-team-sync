-- Criar tabela de logs do sistema
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'auth', 'crud', 'system'
  action TEXT NOT NULL, -- 'login', 'logout', 'insert', 'update', 'delete', etc
  table_name TEXT, -- nome da tabela afetada (para CRUD)
  record_id TEXT, -- ID do registro afetado
  old_data JSONB, -- dados antes da alteração
  new_data JSONB, -- dados após a alteração
  user_id UUID, -- usuário que fez a ação
  user_email TEXT, -- email do usuário
  ip_address INET, -- endereço IP
  user_agent TEXT, -- browser/device info
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details JSONB -- informações adicionais
);

-- Habilitar RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Política para admin_master ver todos os logs
CREATE POLICY "Admin master pode ver todos os logs" 
ON public.system_logs 
FOR SELECT 
USING (is_admin_master());

-- Índices para performance
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX idx_system_logs_event_type ON public.system_logs(event_type);
CREATE INDEX idx_system_logs_table_name ON public.system_logs(table_name);
CREATE INDEX idx_system_logs_user_id ON public.system_logs(user_id);

-- Função para log de mudanças
CREATE OR REPLACE FUNCTION public.log_table_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Buscar informações do usuário
  SELECT id, email INTO user_profile
  FROM public.profiles 
  WHERE user_id = auth.uid();

  -- Log para INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.system_logs (
      event_type, action, table_name, record_id, 
      new_data, user_id, user_email
    ) VALUES (
      'crud', 'insert', TG_TABLE_NAME, NEW.id::TEXT,
      to_jsonb(NEW), user_profile.id, user_profile.email
    );
    RETURN NEW;
  END IF;

  -- Log para UPDATE
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.system_logs (
      event_type, action, table_name, record_id,
      old_data, new_data, user_id, user_email
    ) VALUES (
      'crud', 'update', TG_TABLE_NAME, NEW.id::TEXT,
      to_jsonb(OLD), to_jsonb(NEW), user_profile.id, user_profile.email
    );
    RETURN NEW;
  END IF;

  -- Log para DELETE
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.system_logs (
      event_type, action, table_name, record_id,
      old_data, user_id, user_email
    ) VALUES (
      'crud', 'delete', TG_TABLE_NAME, OLD.id::TEXT,
      to_jsonb(OLD), user_profile.id, user_profile.email
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers para as principais tabelas
CREATE TRIGGER system_logs_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER system_logs_companies_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER system_logs_calls_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.calls
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER system_logs_orders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER system_logs_equipments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.equipments
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER system_logs_tasks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

CREATE TRIGGER system_logs_user_permissions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_permissions
  FOR EACH ROW EXECUTE FUNCTION public.log_table_changes();

-- Adicionar módulo de logs ao sistema
INSERT INTO public.system_modules (name, title, url, icon, description) 
VALUES (
  'logs', 
  'Logs do Sistema', 
  '/logs', 
  'activity', 
  'Visualização completa de logs e atividades do sistema'
);