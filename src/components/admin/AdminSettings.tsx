import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Mail, Shield, Database, Clock, Palette, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemSettings {
  general: {
    system_name: string;
    company_name: string;
    timezone: string;
    language: string;
    currency: string;
  };
  notifications: {
    email_enabled: boolean;
    sms_enabled: boolean;
    push_enabled: boolean;
    sla_alerts: boolean;
    order_updates: boolean;
    daily_reports: boolean;
  };
  email: {
    smtp_server: string;
    smtp_port: string;
    smtp_user: string;
    smtp_password: string;
    from_email: string;
    from_name: string;
  };
  security: {
    session_timeout: number;
    password_min_length: number;
    require_2fa: boolean;
    max_login_attempts: number;
    password_expiry_days: number;
  };
  sla: {
    default_hours: number;
    warning_threshold: number;
    critical_threshold: number;
    auto_escalation: boolean;
  };
  appearance: {
    theme: string;
    primary_color: string;
    logo_url: string;
    favicon_url: string;
  };
}

export function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      system_name: "Sistema Ordi",
      company_name: "Empresa LTDA",
      timezone: "America/Sao_Paulo",
      language: "pt-BR",
      currency: "BRL"
    },
    notifications: {
      email_enabled: true,
      sms_enabled: false,
      push_enabled: true,
      sla_alerts: true,
      order_updates: true,
      daily_reports: false
    },
    email: {
      smtp_server: "",
      smtp_port: "587",
      smtp_user: "",
      smtp_password: "",
      from_email: "",
      from_name: "Sistema Ordi"
    },
    security: {
      session_timeout: 60,
      password_min_length: 8,
      require_2fa: false,
      max_login_attempts: 5,
      password_expiry_days: 90
    },
    sla: {
      default_hours: 24,
      warning_threshold: 75,
      critical_threshold: 90,
      auto_escalation: true
    },
    appearance: {
      theme: "light",
      primary_color: "#3B82F6",
      logo_url: "",
      favicon_url: ""
    }
  });
  
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();

  const updateSetting = (section: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações salvas",
        description: "As configurações foram salvas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testEmailConfig = async () => {
    toast({
      title: "Teste de email",
      description: "Email de teste enviado! Verifique sua caixa de entrada."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Configurações Administrativas</h2>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            SLA
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Aparência
          </TabsTrigger>
        </TabsList>

        {/* Configurações Gerais */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configurações básicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Sistema</Label>
                  <Input
                    value={settings.general.system_name}
                    onChange={(e) => updateSetting('general', 'system_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={settings.general.company_name}
                    onChange={(e) => updateSetting('general', 'company_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Fuso Horário</Label>
                  <Select
                    value={settings.general.timezone}
                    onValueChange={(value) => updateSetting('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                      <SelectItem value="America/New_York">Nova York (UTC-5)</SelectItem>
                      <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Idioma</Label>
                  <Select
                    value={settings.general.language}
                    onValueChange={(value) => updateSetting('general', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Moeda</Label>
                  <Select
                    value={settings.general.currency}
                    onValueChange={(value) => updateSetting('general', 'currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Configure como e quando as notificações são enviadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Canais de Notificação</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">Enviar notificações via email</p>
                    </div>
                    <Switch
                      checked={settings.notifications.email_enabled}
                      onCheckedChange={(checked) => updateSetting('notifications', 'email_enabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações por SMS</Label>
                      <p className="text-sm text-muted-foreground">Enviar notificações via SMS</p>
                    </div>
                    <Switch
                      checked={settings.notifications.sms_enabled}
                      onCheckedChange={(checked) => updateSetting('notifications', 'sms_enabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações Push</Label>
                      <p className="text-sm text-muted-foreground">Notificações no navegador</p>
                    </div>
                    <Switch
                      checked={settings.notifications.push_enabled}
                      onCheckedChange={(checked) => updateSetting('notifications', 'push_enabled', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Tipos de Notificação</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Alertas de SLA</Label>
                      <p className="text-sm text-muted-foreground">Avisos quando SLA está próximo do vencimento</p>
                    </div>
                    <Switch
                      checked={settings.notifications.sla_alerts}
                      onCheckedChange={(checked) => updateSetting('notifications', 'sla_alerts', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Atualizações de Ordens</Label>
                      <p className="text-sm text-muted-foreground">Notificar mudanças de status nas ordens</p>
                    </div>
                    <Switch
                      checked={settings.notifications.order_updates}
                      onCheckedChange={(checked) => updateSetting('notifications', 'order_updates', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Relatórios Diários</Label>
                      <p className="text-sm text-muted-foreground">Resumo diário de atividades</p>
                    </div>
                    <Switch
                      checked={settings.notifications.daily_reports}
                      onCheckedChange={(checked) => updateSetting('notifications', 'daily_reports', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Email */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
              <CardDescription>
                Configure o servidor SMTP para envio de emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Servidor SMTP</Label>
                  <Input
                    value={settings.email.smtp_server}
                    onChange={(e) => updateSetting('email', 'smtp_server', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label>Porta SMTP</Label>
                  <Input
                    value={settings.email.smtp_port}
                    onChange={(e) => updateSetting('email', 'smtp_port', e.target.value)}
                    placeholder="587"
                  />
                </div>
                <div>
                  <Label>Usuário SMTP</Label>
                  <Input
                    value={settings.email.smtp_user}
                    onChange={(e) => updateSetting('email', 'smtp_user', e.target.value)}
                    placeholder="seu-email@gmail.com"
                  />
                </div>
                <div>
                  <Label>Senha SMTP</Label>
                  <Input
                    type="password"
                    value={settings.email.smtp_password}
                    onChange={(e) => updateSetting('email', 'smtp_password', e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <Label>Email Remetente</Label>
                  <Input
                    value={settings.email.from_email}
                    onChange={(e) => updateSetting('email', 'from_email', e.target.value)}
                    placeholder="noreply@empresa.com"
                  />
                </div>
                <div>
                  <Label>Nome Remetente</Label>
                  <Input
                    value={settings.email.from_name}
                    onChange={(e) => updateSetting('email', 'from_name', e.target.value)}
                    placeholder="Sistema Ordi"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={testEmailConfig}>
                  Testar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Segurança */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
              <CardDescription>
                Configure políticas de segurança e autenticação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Timeout de Sessão (minutos)</Label>
                  <Input
                    type="number"
                    value={settings.security.session_timeout}
                    onChange={(e) => updateSetting('security', 'session_timeout', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Tamanho Mínimo da Senha</Label>
                  <Input
                    type="number"
                    value={settings.security.password_min_length}
                    onChange={(e) => updateSetting('security', 'password_min_length', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Máximo de Tentativas de Login</Label>
                  <Input
                    type="number"
                    value={settings.security.max_login_attempts}
                    onChange={(e) => updateSetting('security', 'max_login_attempts', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Expiração de Senha (dias)</Label>
                  <Input
                    type="number"
                    value={settings.security.password_expiry_days}
                    onChange={(e) => updateSetting('security', 'password_expiry_days', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground">Exigir 2FA para todos os usuários</p>
                </div>
                <Switch
                  checked={settings.security.require_2fa}
                  onCheckedChange={(checked) => updateSetting('security', 'require_2fa', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de SLA */}
        <TabsContent value="sla">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de SLA</CardTitle>
              <CardDescription>
                Configure os parâmetros de Service Level Agreement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>SLA Padrão (horas)</Label>
                  <Input
                    type="number"
                    value={settings.sla.default_hours}
                    onChange={(e) => updateSetting('sla', 'default_hours', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Limite de Aviso (%)</Label>
                  <Input
                    type="number"
                    value={settings.sla.warning_threshold}
                    onChange={(e) => updateSetting('sla', 'warning_threshold', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Limite Crítico (%)</Label>
                  <Input
                    type="number"
                    value={settings.sla.critical_threshold}
                    onChange={(e) => updateSetting('sla', 'critical_threshold', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Escalação Automática</Label>
                  <p className="text-sm text-muted-foreground">Escalar automaticamente quando SLA crítico</p>
                </div>
                <Switch
                  checked={settings.sla.auto_escalation}
                  onCheckedChange={(checked) => updateSetting('sla', 'auto_escalation', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Aparência */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tema</Label>
                  <Select
                    value={settings.appearance.theme}
                    onValueChange={(value) => updateSetting('appearance', 'theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="auto">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cor Primária</Label>
                  <Input
                    type="color"
                    value={settings.appearance.primary_color}
                    onChange={(e) => updateSetting('appearance', 'primary_color', e.target.value)}
                  />
                </div>
                <div>
                  <Label>URL do Logo</Label>
                  <Input
                    value={settings.appearance.logo_url}
                    onChange={(e) => updateSetting('appearance', 'logo_url', e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                <div>
                  <Label>URL do Favicon</Label>
                  <Input
                    value={settings.appearance.favicon_url}
                    onChange={(e) => updateSetting('appearance', 'favicon_url', e.target.value)}
                    placeholder="https://exemplo.com/favicon.ico"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}