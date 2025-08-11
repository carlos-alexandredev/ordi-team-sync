import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaintenancePlans } from "@/components/maintenance/MaintenancePlans";
import { MaintenanceOrders } from "@/components/maintenance/MaintenanceOrders";
import { ConditionReadings } from "@/components/maintenance/ConditionReadings";
import { MaintenanceCalendar } from "@/components/maintenance/MaintenanceCalendar";
import { MaintenanceReports } from "@/components/maintenance/MaintenanceReports";

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

          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orders">Ordens de Manutenção</TabsTrigger>
              <TabsTrigger value="plans">Planos de Manutenção</TabsTrigger>
              <TabsTrigger value="readings">Leituras/Condição</TabsTrigger>
              <TabsTrigger value="calendar">Calendário</TabsTrigger>
              <TabsTrigger value="reports">Relatórios & KPIs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders">
              <MaintenanceOrders />
            </TabsContent>
            
            <TabsContent value="plans">
              <MaintenancePlans />
            </TabsContent>
            
            <TabsContent value="readings">
              <ConditionReadings />
            </TabsContent>
            
            <TabsContent value="calendar">
              <MaintenanceCalendar />
            </TabsContent>
            
            <TabsContent value="reports">
              <MaintenanceReports />
            </TabsContent>
          </Tabs>
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Maintenance;