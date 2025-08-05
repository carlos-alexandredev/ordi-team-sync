import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAdminMaster = () => {
  const [isAdminMaster, setIsAdminMaster] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminMaster = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single();
          
          setIsAdminMaster(profile?.role === 'admin_master');
        }
      } catch (error) {
        console.error("Erro ao verificar admin master:", error);
        setIsAdminMaster(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminMaster();
  }, []);

  return { isAdminMaster, loading };
};