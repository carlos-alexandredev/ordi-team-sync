-- Create secure logging function if not exists
CREATE OR REPLACE FUNCTION public.log_client_event(
  p_action text,
  p_table_name text DEFAULT NULL,
  p_record_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile RECORD;
  v_event_type text;
BEGIN
  -- Get user profile id/email
  SELECT id, email INTO user_profile
  FROM public.profiles
  WHERE user_id = auth.uid();

  -- Define event type
  v_event_type := CASE
    WHEN COALESCE(p_details->>'error_details','') <> '' THEN 'error'
    ELSE 'activity'
  END;

  INSERT INTO public.system_logs (
    event_type, action, table_name, record_id, details, user_id, user_email
  ) VALUES (
    v_event_type,
    p_action,
    p_table_name,
    p_record_id,
    COALESCE(p_details, '{}'::jsonb) || jsonb_build_object('timestamp', now()),
    user_profile.id,
    user_profile.email
  );
END;
$$;

-- Create audit trigger function for equipment changes
CREATE OR REPLACE FUNCTION public.log_equipment_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Get user profile
  SELECT id, email INTO user_profile
  FROM public.profiles 
  WHERE user_id = auth.uid();

  -- Log for INSERT
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

  -- Log for UPDATE
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

  -- Log for DELETE
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
$$;

-- Create triggers for audit logging
DROP TRIGGER IF EXISTS audit_equipments_changes ON public.equipments;
CREATE TRIGGER audit_equipments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.equipments
  FOR EACH ROW EXECUTE FUNCTION public.log_equipment_changes();

DROP TRIGGER IF EXISTS audit_order_equipments_changes ON public.order_equipments;
CREATE TRIGGER audit_order_equipments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.order_equipments
  FOR EACH ROW EXECUTE FUNCTION public.log_equipment_changes();

DROP TRIGGER IF EXISTS audit_call_equipments_changes ON public.call_equipments;
CREATE TRIGGER audit_call_equipments_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.call_equipments
  FOR EACH ROW EXECUTE FUNCTION public.log_equipment_changes();