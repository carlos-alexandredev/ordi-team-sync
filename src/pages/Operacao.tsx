import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TechnicianDashboard } from "@/components/technician/TechnicianDashboard";
import { TechnicianCalendar } from "@/components/technician/TechnicianCalendar";
import { ReportsAnalytics } from "@/components/reports/ReportsAnalytics";
import { MaintenanceOrders } from "@/components/maintenance/MaintenanceOrders";
import { MaintenancePlans } from "@/components/maintenance/MaintenancePlans";
import { ConditionReadings } from "@/components/maintenance/ConditionReadings";
import { MaintenanceCalendar } from "@/components/maintenance/MaintenanceCalendar";
import { MaintenanceReports } from "@/components/maintenance/MaintenanceReports";
import { Tabs as MaintenanceTabs, TabsContent as MaintenanceTabsContent, TabsList as MaintenanceTabsList, TabsTrigger as MaintenanceTabsTrigger } from "@/components/ui/tabs";

const Operacao = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "admin_cliente", "supervisor", "tecnico"]}>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Operação</h1>
            <p className="text-muted-foreground">
              Central de operações técnicas, agenda, manutenção e relatórios
            </p>
          </div>

          <Tabs defaultValue="tecnicos" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tecnicos">Técnicos</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="manutencao">Manutenção</TabsTrigger>
              <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            </TabsList>

            <TabsContent value="tecnicos" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard dos Técnicos</CardTitle>
                  <CardDescription>
                    Visão geral das atividades e performance dos técnicos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TechnicianDashboard />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agenda" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Agenda</CardTitle>
                  <CardDescription>
                    Calendário e agendamento de atividades técnicas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TechnicianCalendar />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manutencao" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Manutenção</CardTitle>
                  <CardDescription>
                    Gestão completa de manutenção preventiva e corretiva
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MaintenanceTabs defaultValue="orders" className="w-full">
                    <MaintenanceTabsList className="grid w-full grid-cols-5">
                      <MaintenanceTabsTrigger value="orders">Ordens</MaintenanceTabsTrigger>
                      <MaintenanceTabsTrigger value="plans">Planos</MaintenanceTabsTrigger>
                      <MaintenanceTabsTrigger value="readings">Leituras</MaintenanceTabsTrigger>
                      <MaintenanceTabsTrigger value="calendar">Calendário</MaintenanceTabsTrigger>
                      <MaintenanceTabsTrigger value="reports">Relatórios</MaintenanceTabsTrigger>
                    </MaintenanceTabsList>
                    
                    <MaintenanceTabsContent value="orders">
                      <MaintenanceOrders />
                    </MaintenanceTabsContent>
                    
                    <MaintenanceTabsContent value="plans">
                      <MaintenancePlans />
                    </MaintenanceTabsContent>
                    
                    <MaintenanceTabsContent value="readings">
                      <ConditionReadings />
                    </MaintenanceTabsContent>
                    
                    <MaintenanceTabsContent value="calendar">
                      <MaintenanceCalendar />
                    </MaintenanceTabsContent>
                    
                    <MaintenanceTabsContent value="reports">
                      <MaintenanceReports />
                    </MaintenanceTabsContent>
                  </MaintenanceTabs>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="relatorios" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Relatórios</CardTitle>
                  <CardDescription>
                    Análises e relatórios operacionais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReportsAnalytics />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Operacao;