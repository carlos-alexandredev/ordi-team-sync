import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaintenanceOverview } from "@/components/maintenance/MaintenanceOverview";
import { MaintenanceOrders } from "@/components/maintenance/MaintenanceOrders";
import { MaintenanceReports } from "@/components/maintenance/MaintenanceReports";
import { MaintenanceSettings } from "@/components/maintenance/MaintenanceSettings";

const Maintenance = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "admin_cliente", "supervisor", "tecnico"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Módulo de Manutenção</h1>
            <p className="text-muted-foreground">
              Gerencie planos, ordens e análises de manutenção preventiva, preditiva, corretiva, detectiva e baseada no tempo
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="orders">Ordens de Serviço</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <MaintenanceOverview />
            </TabsContent>
            
            <TabsContent value="orders">
              <MaintenanceOrders />
            </TabsContent>
            
            <TabsContent value="reports">
              <MaintenanceReports />
            </TabsContent>
            
            <TabsContent value="settings">
              <MaintenanceSettings />
            </TabsContent>
          </Tabs>
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Maintenance;