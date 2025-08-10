-- Drop existing function and recreate with correct return type
DROP FUNCTION IF EXISTS get_online_users();

-- Create function to get online users with distinct IP addresses (one user per IP)
CREATE OR REPLACE FUNCTION get_online_users()
RETURNS TABLE (
  user_id uuid,
  user_name text,
  user_email text,
  user_role text,
  login_time timestamptz,
  last_activity timestamptz,
  last_page text,
  ip_address text,
  session_duration interval,
  is_online boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;