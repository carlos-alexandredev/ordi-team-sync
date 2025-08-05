import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TiposTarefas = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "gestor"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Tipos de Tarefas</h1>
            <p className="text-muted-foreground">
              Gerencie os tipos de tarefas disponíveis
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Tipos de Tarefas</CardTitle>
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

export default TiposTarefas;