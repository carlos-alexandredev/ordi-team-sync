
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
      // Use the secure RPC function for logging
      const { error } = await supabase.rpc('log_client_event' as any, {
        p_action: action,
        p_table_name: table_name,
        p_record_id: record_id,
        p_details: {
          timestamp: new Date().toISOString(),
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
