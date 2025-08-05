import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserModule {
  module_name: string;
  module_title: string;
  module_url: string;
  module_icon: string;
  has_custom_permission: boolean;
  is_allowed: boolean;
}

export const useUserPermissions = () => {
  const [modules, setModules] = useState<UserModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserModules();
  }, []);

  const loadUserModules = async () => {
    try {
      const { data, error } = await supabase.rpc("get_user_allowed_modules");

      if (error) throw error;

      const allowedModules = data?.filter((module: UserModule) => module.is_allowed) || [];
      setModules(allowedModules);
    } catch (error) {
      console.error("Erro ao carregar módulos do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  return { modules, loading, refetch: loadUserModules };
};