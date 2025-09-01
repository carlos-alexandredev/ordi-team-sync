-- Fix security issues: Update functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_session_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.faq_sessions 
  SET last_activity = now() 
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_analytics_data(
  p_table_name text,
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_aggregations jsonb DEFAULT '{}'::jsonb,
  p_date_range jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  base_query text;
  where_clause text := '';
  user_company_id uuid;
  user_role_name text;
BEGIN
  -- Get user context
  SELECT company_id, role INTO user_company_id, user_role_name 
  FROM profiles WHERE user_id = auth.uid();
  
  -- Only allow admin roles to use analytics
  IF user_role_name NOT IN ('admin_master', 'admin_cliente', 'admin') THEN
    RETURN jsonb_build_object('error', 'Acesso negado para analytics');
  END IF;

  -- Validate table name (whitelist approach)
  IF p_table_name NOT IN ('orders', 'calls', 'equipments', 'profiles', 'system_logs', 'faq_queries') THEN
    RETURN jsonb_build_object('error', 'Tabela não permitida');
  END IF;

  -- Build base query with RLS considerations
  CASE p_table_name
    WHEN 'orders' THEN
      base_query := 'SELECT count(*) as total FROM orders';
      IF user_role_name != 'admin_master' THEN
        where_clause := ' WHERE company_id = ''' || user_company_id || '''';
      END IF;
    WHEN 'calls' THEN
      base_query := 'SELECT count(*) as total FROM calls';
      IF user_role_name != 'admin_master' THEN
        where_clause := ' WHERE company_id = ''' || user_company_id || '''';
      END IF;
    WHEN 'equipments' THEN
      base_query := 'SELECT count(*) as total FROM equipments';
      IF user_role_name != 'admin_master' THEN
        where_clause := ' WHERE company_id = ''' || user_company_id || '''';
      END IF;
    WHEN 'profiles' THEN
      base_query := 'SELECT count(*) as total FROM profiles';
      IF user_role_name != 'admin_master' THEN
        where_clause := ' WHERE company_id = ''' || user_company_id || '''';
      END IF;
    ELSE
      RETURN jsonb_build_object('error', 'Consulta não implementada para esta tabela');
  END CASE;

  -- Execute query and return result
  EXECUTE base_query || where_clause INTO result;
  
  RETURN jsonb_build_object('data', result, 'table', p_table_name);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$;