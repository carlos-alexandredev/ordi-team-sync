import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, allowedRoles = [], fallback }: ProtectedRouteProps) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();
          
          setUserProfile(profile);
          
          // Se allowedRoles está vazio, qualquer usuário autenticado tem acesso
          if (allowedRoles.length === 0) {
            setHasAccess(true);
            return;
          }
          
          // Verificar se o role está nas roles permitidas
          if (allowedRoles.includes(profile?.role)) {
            setHasAccess(true);
            return;
          }
          
          // Para outros usuários, verificar permissões dinâmicas
          const currentPath = location.pathname;
          const { data: modules } = await supabase.rpc("get_user_allowed_modules");
          
          const hasModuleAccess = modules?.some((module: any) => 
            module.module_url === currentPath && module.is_allowed
          );
          
          setHasAccess(hasModuleAccess || false);
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [allowedRoles, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!userProfile || !hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}