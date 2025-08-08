import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSettings as AdminSettingsComponent } from "@/components/admin/AdminSettings";
import { SystemBackup } from "@/components/backup/SystemBackup";

const AdminSettings = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master"]}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
            <p className="text-muted-foreground">
              Gerencie configurações avançadas e backup do sistema
            </p>
          </div>

          <Tabs defaultValue="settings" className="space-y-4">
            <TabsList>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
              <TabsTrigger value="backup">Backup</TabsTrigger>
            </TabsList>
            
            <TabsContent value="settings">
              <AdminSettingsComponent />
            </TabsContent>
            
            <TabsContent value="backup">
              <SystemBackup />
            </TabsContent>
          </Tabs>
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default AdminSettings;