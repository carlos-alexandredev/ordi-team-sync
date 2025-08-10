import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSettings as AdminSettingsComponent } from "@/components/admin/AdminSettings";
import { SystemBackup } from "@/components/backup/SystemBackup";
import { UserPermissionsManager } from "@/components/permissions/UserPermissionsManager";
import { SystemLogs } from "@/components/SystemLogs";
import { ReportsAnalytics } from "@/components/reports/ReportsAnalytics";

const Settings = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
            <p className="text-muted-foreground">
              Gerencie todas as configurações, permissões e monitoramento do sistema
            </p>
          </div>

          <Tabs defaultValue="settings" className="space-y-4">
            <TabsList>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
              <TabsTrigger value="permissions">Permissões</TabsTrigger>
              <TabsTrigger value="backup">Backup</TabsTrigger>
              <TabsTrigger value="logs">Logs do Sistema</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings">
              <AdminSettingsComponent />
            </TabsContent>
            
            <TabsContent value="permissions">
              <UserPermissionsManager />
            </TabsContent>
            
            <TabsContent value="backup">
              <SystemBackup />
            </TabsContent>
            
            <TabsContent value="logs">
              <SystemLogs />
            </TabsContent>
            
            <TabsContent value="reports">
              <ReportsAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Settings;