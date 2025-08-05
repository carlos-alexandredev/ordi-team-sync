import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PesquisaSatisfacao = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "gestor"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Pesquisa de Satisfação</h1>
            <p className="text-muted-foreground">
              Gerencie as pesquisas de satisfação
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Pesquisas de Satisfação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidade em desenvolvimento
              </p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default PesquisaSatisfacao;