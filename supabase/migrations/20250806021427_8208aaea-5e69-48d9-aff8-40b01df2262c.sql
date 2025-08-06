-- Criar tabela para rastrear sessões de usuários online
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_page TEXT,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  logout_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Política para admin master ver todas as sessões
CREATE POLICY "Admin master pode ver todas as sessões"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (is_admin_master());

-- Política para usuários verem apenas suas próprias sessões
CREATE POLICY "Usuários podem ver suas próprias sessões"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (user_id = ( SELECT profiles.user_id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Política para criar sessões
CREATE POLICY "Usuários podem criar suas próprias sessões"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política para atualizar sessões
CREATE POLICY "Usuários podem atualizar suas próprias sessões"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Adicionar trigger de updated_at
CREATE TRIGGER update_user_sessions_updated_at
BEFORE UPDATE ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para obter usuários online
CREATE OR REPLACE FUNCTION public.get_online_users()
RETURNS TABLE(
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT,
  login_time TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE,
  last_page TEXT,
  ip_address INET,
  session_duration INTERVAL,
  is_online BOOLEAN
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.name as user_name,
    p.email as user_email,
    p.role as user_role,
    us.login_time,
    us.last_activity,
    us.last_page,
    us.ip_address,
    (us.last_activity - us.login_time) as session_duration,
    (us.last_activity > (NOW() - INTERVAL '5 minutes') AND us.is_active = true) as is_online
  FROM public.user_sessions us
  JOIN public.profiles p ON us.user_id = p.user_id
  WHERE us.is_active = true
    AND us.last_activity > (NOW() - INTERVAL '30 minutes') -- Considerado online nos últimos 30 minutos
  ORDER BY us.last_activity DESC;
END;
$function$;

-- Função para contar usuários online
CREATE OR REPLACE FUNCTION public.count_online_users()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count_result
  FROM public.user_sessions
  WHERE is_active = true
    AND last_activity > (NOW() - INTERVAL '5 minutes'); -- Online nos últimos 5 minutos
  
  RETURN COALESCE(count_result, 0);
END;
$function$;

-- Inserir o módulo de usuários online no sistema
INSERT INTO public.system_modules (name, title, url, icon, description, is_active)
VALUES ('users-online', 'Usuários Online', '/users-online', 'Users', 'Monitoramento de usuários online e atividade do sistema', true)
ON CONFLICT (name) DO UPDATE SET
  title = EXCLUDED.title,
  url = EXCLUDED.url,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;