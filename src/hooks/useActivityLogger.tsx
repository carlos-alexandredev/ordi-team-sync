
import { supabase } from "@/integrations/supabase/client";

interface LogActivity {
  action: string;
  table_name?: string;
  record_id?: string;
  details?: any;
  error_details?: any;
}

export const useActivityLogger = () => {
  const logActivity = async ({ action, table_name, record_id, details, error_details }: LogActivity) => {
    try {
      // Get current user profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      // Log the activity
      const { error } = await supabase
        .from('system_logs')
        .insert({
          event_type: error_details ? 'error' : 'activity',
          action,
          table_name,
          record_id,
          user_id: userProfile?.id,
          user_email: userProfile?.email,
          details: {
            timestamp: new Date().toISOString(),
            user_role: userProfile?.role || 'unknown',
            error_details,
            ...details
          }
        });

      if (error) {
        console.error('Error logging activity:', error);
      }
    } catch (error) {
      console.error('Error in logActivity:', error);
    }
  };

  const logError = async (action: string, error: any, context?: any) => {
    await logActivity({
      action: `error_${action}`,
      error_details: {
        message: error?.message || String(error),
        stack: error?.stack,
        code: error?.code,
        details: error?.details
      },
      details: context
    });
  };

  return { logActivity, logError };
};
