
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
        console.log("ProtectedRoute: Iniciando verificação de perfil...");
        const { data: { user } } = await supabase.auth.getUser();
        console.log("ProtectedRoute: Usuário:", user?.id);
        
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();
          
          console.log("ProtectedRoute: Profile:", profile, "Error:", profileError);
          setUserProfile(profile);
          
          // Se allowedRoles está vazio, qualquer usuário autenticado tem acesso
          if (allowedRoles.length === 0) {
            console.log("ProtectedRoute: Sem restrições de role");
            setHasAccess(true);
            return;
          }
          
          // Verificar se o role está nas roles permitidas
          console.log("ProtectedRoute: Verificando role:", profile?.role, "contra:", allowedRoles);
          if (allowedRoles.includes(profile?.role)) {
            console.log("ProtectedRoute: Acesso permitido por role");
            setHasAccess(true);
            return;
          }
          
          // Para usuários não admin_master, verificar permissões dinâmicas
          if (profile?.role !== 'admin_master') {
            const currentPath = location.pathname;
            console.log("ProtectedRoute: Verificando permissões dinâmicas para:", currentPath);
            const { data: modules } = await supabase.rpc("get_user_allowed_modules");
            console.log("ProtectedRoute: Módulos do usuário:", modules);
            
            const hasModuleAccess = modules?.some((module: any) => 
              module.module_url === currentPath && module.is_allowed
            );
            
            console.log("ProtectedRoute: Tem acesso ao módulo:", hasModuleAccess);
            setHasAccess(hasModuleAccess || false);
          } else {
            // admin_master sempre tem acesso se não foi explicitamente negado acima
            console.log("ProtectedRoute: Admin master - verificando se deve ter acesso");
            setHasAccess(false); // Só se não estiver nas allowedRoles
          }
        } else {
          console.log("ProtectedRoute: Usuário não autenticado");
          setHasAccess(false);
        }
      } catch (error) {
        console.error("ProtectedRoute: Erro ao carregar perfil:", error);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          {userProfile?.role && (
            <p className="text-sm text-muted-foreground mt-2">
              Seu nível de acesso: {userProfile.role}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
