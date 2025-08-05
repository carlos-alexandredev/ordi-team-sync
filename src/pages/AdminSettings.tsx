import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppSettings } from '@/stores/useAppSettings';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { toast } from 'sonner';

const AdminSettings = () => {
  const { pageLoadingEnabled, setPageLoadingEnabled } = useAppSettings();

  const handleLoadingToggle = (enabled: boolean) => {
    setPageLoadingEnabled(enabled);
    toast.success(
      enabled 
        ? 'Loading de transição ativado' 
        : 'Loading de transição desativado'
    );
  };

  return (
    <ProtectedRoute allowedRoles={["admin_master"]}>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Configurações do Sistema
          </h1>
          <p className="text-muted-foreground">
            Configurações avançadas disponíveis apenas para administradores master
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interface do Usuário</CardTitle>
            <CardDescription>
              Configurações relacionadas à experiência do usuário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="page-loading">Loading de transição entre páginas</Label>
                <p className="text-sm text-muted-foreground">
                  Exibe uma animação de carregamento durante a navegação entre páginas
                </p>
              </div>
              <Switch
                id="page-loading"
                checked={pageLoadingEnabled}
                onCheckedChange={handleLoadingToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Placeholder para futuras configurações */}
        <Card>
          <CardHeader>
            <CardTitle>Sistema</CardTitle>
            <CardDescription>
              Configurações do sistema e performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Mais configurações serão adicionadas em breve...
            </p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default AdminSettings;