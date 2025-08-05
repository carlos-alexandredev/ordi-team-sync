import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GruposClientes = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "admin_cliente"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Grupos de Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie os grupos de clientes
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Grupos de Clientes</CardTitle>
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

export default GruposClientes;