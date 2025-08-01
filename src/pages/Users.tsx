import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UsersList } from "@/components/users/UsersList";
import { useToast } from "@/hooks/use-toast";

export default function Users() {
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Erro",
            description: "Usuário não autenticado",
            variant: "destructive",
          });
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        setCurrentUserRole(profile?.role || null);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao verificar permissões",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (currentUserRole !== "admin") {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Apenas usuários com perfil de Administrador podem acessar o gerenciamento de usuários.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <UsersList />
    </div>
  );
}