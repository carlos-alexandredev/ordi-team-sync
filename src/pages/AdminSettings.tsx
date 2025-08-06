import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAppSettings } from '@/stores/useAppSettings';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthLayout } from '@/components/AuthLayout';
import { toast } from 'sonner';

const AdminSettings = () => {
  const { 
    pageLoadingEnabled, 
    setPageLoadingEnabled,
    customLoginNotification,
    setCustomLoginNotification 
  } = useAppSettings();

  const [localNotification, setLocalNotification] = useState({
    title: customLoginNotification.title,
    description: customLoginNotification.description
  });

  const handleLoadingToggle = (enabled: boolean) => {
    setPageLoadingEnabled(enabled);
    toast.success(
      enabled 
        ? 'Loading de transição ativado' 
        : 'Loading de transição desativado'
    );
  };

  const handleSaveNotification = () => {
    setCustomLoginNotification(localNotification);
    toast.success('Notificação personalizada salva com sucesso!');
  };

  return (
    <ProtectedRoute allowedRoles={["admin_master"]}>
      <AuthLayout>
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

        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>
              Configuração de mensagens e notificações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notification-title">Título da notificação de login</Label>
                <Input
                  id="notification-title"
                  value={localNotification.title}
                  onChange={(e) => setLocalNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Digite o título da notificação"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notification-description">Descrição da notificação de login</Label>
                <Textarea
                  id="notification-description"
                  value={localNotification.description}
                  onChange={(e) => setLocalNotification(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Digite a descrição da notificação"
                  rows={3}
                />
              </div>
              <Button onClick={handleSaveNotification} className="w-full">
                Salvar Notificação
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </AuthLayout>
    </ProtectedRoute>
  );
};

export default AdminSettings;