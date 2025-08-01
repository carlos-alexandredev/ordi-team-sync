import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Configurar listener de mudanças de auth PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Redirecionamento inteligente após login
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", session.user.id)
                .single();

              if (error) {
                console.error("Erro ao buscar perfil:", error);
                return;
              }

              if (profile) {
                setUserProfile(profile);
                
                // Mensagem de boas-vindas
                toast({
                  title: `Bem-vindo, ${profile.name}!`,
                  description: `Acesso autorizado como ${profile.role === 'admin' ? 'Administrador' : 
                    profile.role === 'admin_cliente' ? 'Admin Cliente' : 
                    profile.role === 'tecnico' ? 'Técnico' : 'Cliente'}.`,
                });

                // Redirecionamento baseado no role
                switch (profile.role) {
                  case 'admin':
                    navigate('/dashboard');
                    break;
                  case 'admin_cliente':
                    navigate('/dashboard');
                    break;
                  case 'tecnico':
                    navigate('/technician');
                    break;
                  case 'cliente_final':
                    navigate('/calls');
                    break;
                  default:
                    navigate('/dashboard');
                }
              }
            } catch (error) {
              console.error("Erro no redirecionamento:", error);
            }
          }, 100);
        }
      }
    );

    // DEPOIS verificar sessão existente
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Carregar perfil se usuário logado
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single();
          setUserProfile(profile);
        } catch (error) {
          console.error("Erro ao carregar perfil:", error);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);


  const handleSignIn = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Limpeza de estado de autenticação
      const cleanupAuthState = () => {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      };

      cleanupAuthState();

      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso.",
        });
        // Força refresh da página para garantir limpeza completa
        window.location.href = '/';
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSignIn={handleSignIn} loading={authLoading} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          userRole={userProfile?.role || 'cliente_final'} 
          onSignOut={handleSignOut}
        />
        
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-4">
            <SidebarTrigger />
            <div className="ml-4 flex-1">
              <span className="text-sm text-muted-foreground">
                Bem-vindo, {userProfile?.name || "Usuário"} - 
                {userProfile?.role === 'admin' ? ' Administrador' : 
                 userProfile?.role === 'admin_cliente' ? ' Admin Cliente' :
                 userProfile?.role === 'tecnico' ? ' Técnico' : ' Cliente Final'}
              </span>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

interface AuthFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  loading: boolean;
}

function AuthForm({ onSignIn, loading }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sistema Ordi</CardTitle>
          <CardDescription>
            Sistema de gerenciamento de ordens de serviço
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => onSignIn(email, password)}
              disabled={loading || !email || !password}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Não possui uma conta? Entre em contato com o administrador.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}