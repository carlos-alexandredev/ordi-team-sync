-- Fix function search path security warning by setting search_path for functions
-- that don't have it set

-- Update ensure_admin_master_exists function
CREATE OR REPLACE FUNCTION public.ensure_admin_master_exists()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_master_count INTEGER;
BEGIN
  -- Verificar se existe admin_master
  SELECT COUNT(*) INTO admin_master_count 
  FROM public.profiles 
  WHERE role = 'admin_master';
  
  -- Se não existir admin_master, mostrar alerta no log
  IF admin_master_count = 0 THEN
    RAISE NOTICE 'ATENÇÃO: Nenhum usuário admin_master encontrado. Crie um admin_master para ter acesso total ao sistema.';
  END IF;
END;
$function$;

-- Update calculate_maintenance_mttr function
CREATE OR REPLACE FUNCTION public.calculate_maintenance_mttr()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'concluida' AND NEW.started_at IS NOT NULL AND NEW.finished_at IS NOT NULL THEN
    NEW.mttr_minutes := EXTRACT(EPOCH FROM (NEW.finished_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update log_table_changes function
CREATE OR REPLACE FUNCTION public.log_table_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Update count_online_users function
CREATE OR REPLACE FUNCTION public.count_online_users()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT us.ip_address)
    FROM user_sessions us
    WHERE us.is_active = true
      AND us.last_activity > NOW() - INTERVAL '5 minutes'
  );
END;
$function$;

-- Update get_online_users function
CREATE OR REPLACE FUNCTION public.get_online_users()
 RETURNS TABLE(user_id uuid, user_name text, user_email text, user_role text, login_time timestamp with time zone, last_activity timestamp with time zone, last_page text, ip_address text, session_duration interval, is_online boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (us.ip_address)
    p.user_id,
    p.name as user_name,
    p.email as user_email,
    p.role as user_role,
    us.login_time,
    us.last_activity,
    us.last_page,
    us.ip_address::text,
    (us.last_activity - us.login_time) as session_duration,
    (us.last_activity > NOW() - INTERVAL '5 minutes' AND us.is_active = true) as is_online
  FROM user_sessions us
  JOIN profiles p ON p.user_id = us.user_id
  WHERE us.is_active = true
    AND us.last_activity > NOW() - INTERVAL '30 minutes'
  ORDER BY us.ip_address, us.last_activity DESC;
END;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'cliente_final')
  );
  RETURN NEW;
END;
$function$;

-- Update generate_order_number function
CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update set_order_number function
CREATE OR REPLACE FUNCTION public.set_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Update calculate_time_log_duration function
CREATE OR REPLACE FUNCTION public.calculate_time_log_duration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
    NEW.total_minutes := EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60;
  END IF;
  RETURN NEW;
END;
$function$;