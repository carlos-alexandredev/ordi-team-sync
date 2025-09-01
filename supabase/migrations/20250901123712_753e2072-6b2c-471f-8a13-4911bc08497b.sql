-- Enhanced analytics function with better query support and security
CREATE OR REPLACE FUNCTION public.get_analytics_data(
  p_table_name text, 
  p_query_type text DEFAULT 'count',
  p_filters jsonb DEFAULT '{}'::jsonb, 
  p_aggregations jsonb DEFAULT '{}'::jsonb, 
  p_date_range jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  base_query text;
  where_clause text := '';
  user_company_id uuid;
  user_role_name text;
  record_count integer;
BEGIN
  -- Get user context
  SELECT company_id, role INTO user_company_id, user_role_name 
  FROM profiles WHERE user_id = auth.uid();
  
  -- Only allow admin roles to use analytics
  IF user_role_name NOT IN ('admin_master', 'admin_cliente', 'admin') THEN
    RETURN jsonb_build_object('error', 'Acesso negado para analytics');
  END IF;

  -- Validate table name (whitelist approach)
  IF p_table_name NOT IN ('orders', 'calls', 'equipments', 'profiles', 'system_logs', 'faq_queries', 'companies') THEN
    RETURN jsonb_build_object('error', 'Tabela não permitida');
  END IF;

  -- Validate query type
  IF p_query_type NOT IN ('count', 'list', 'aggregate') THEN
    RETURN jsonb_build_object('error', 'Tipo de consulta não permitido');
  END IF;

  -- Build security context for queries
  IF user_role_name != 'admin_master' THEN
    CASE p_table_name
      WHEN 'orders', 'calls', 'equipments', 'profiles', 'faq_queries' THEN
        where_clause := ' WHERE company_id = ''' || user_company_id || '''';
      WHEN 'companies' THEN
        where_clause := ' WHERE id = ''' || user_company_id || '''';
      ELSE
        where_clause := ' WHERE company_id = ''' || user_company_id || '''';
    END CASE;
  END IF;

  -- Handle different query types
  CASE p_query_type
    WHEN 'count' THEN
      EXECUTE 'SELECT COUNT(*) FROM ' || p_table_name || where_clause INTO record_count;
      result := jsonb_build_object('count', record_count, 'table', p_table_name);
      
    WHEN 'list' THEN
      -- For list queries, return a sample with limited fields for security
      CASE p_table_name
        WHEN 'orders' THEN
          EXECUTE 'SELECT jsonb_agg(jsonb_build_object(''id'', id, ''title'', title, ''status'', status, ''created_at'', created_at)) FROM (SELECT id, title, status, created_at FROM orders' || where_clause || ' ORDER BY created_at DESC LIMIT 10) sub' INTO result;
        WHEN 'calls' THEN
          EXECUTE 'SELECT jsonb_agg(jsonb_build_object(''id'', id, ''title'', title, ''status'', status, ''created_at'', created_at)) FROM (SELECT id, title, status, created_at FROM calls' || where_clause || ' ORDER BY created_at DESC LIMIT 10) sub' INTO result;
        WHEN 'equipments' THEN
          EXECUTE 'SELECT jsonb_agg(jsonb_build_object(''id'', id, ''name'', name, ''status'', status, ''location'', location)) FROM (SELECT id, name, status, location FROM equipments' || where_clause || ' LIMIT 10) sub' INTO result;
        WHEN 'profiles' THEN
          EXECUTE 'SELECT jsonb_agg(jsonb_build_object(''id'', id, ''name'', name, ''role'', role, ''created_at'', created_at)) FROM (SELECT id, name, role, created_at FROM profiles' || where_clause || ' LIMIT 10) sub' INTO result;
        ELSE
          result := jsonb_build_object('error', 'Listagem não implementada para esta tabela');
      END CASE;
      
    WHEN 'aggregate' THEN
      -- Simple aggregations by status for supported tables
      CASE p_table_name
        WHEN 'orders', 'calls' THEN
          EXECUTE 'SELECT jsonb_object_agg(status, count) FROM (SELECT status, COUNT(*) as count FROM ' || p_table_name || where_clause || ' GROUP BY status) sub' INTO result;
        WHEN 'equipments' THEN
          EXECUTE 'SELECT jsonb_object_agg(status, count) FROM (SELECT status, COUNT(*) as count FROM equipments' || where_clause || ' GROUP BY status) sub' INTO result;
        ELSE
          result := jsonb_build_object('error', 'Agregação não implementada para esta tabela');
      END CASE;
  END CASE;

  RETURN jsonb_build_object(
    'data', COALESCE(result, jsonb_build_object()),
    'table', p_table_name,
    'query_type', p_query_type,
    'user_role', user_role_name
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('error', 'Erro na consulta: ' || SQLERRM);
END;
$$;

-- Create trigger to update session activity when queries are added
CREATE OR REPLACE FUNCTION public.update_session_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update session last_activity when a new query is added
  IF NEW.session_id IS NOT NULL THEN
    UPDATE public.faq_sessions 
    SET last_activity = now() 
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_faq_session_activity ON public.faq_queries;
CREATE TRIGGER update_faq_session_activity
  AFTER INSERT ON public.faq_queries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_session_activity();