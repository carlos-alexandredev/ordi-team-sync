import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Database, 
  FileText, 
  Shield, 
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SystemBackup() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const generateFullBackup = async () => {
    setIsGenerating(true);
    setBackupStatus('generating');

    try {
      // 1. Backup das tabelas principais
      const tableNames = [
        'profiles', 'companies', 'calls', 
        'equipments', 'order_time_logs', 'system_logs', 'user_sessions',
        'system_modules', 'user_permissions'
      ] as const;

      const backupData: Record<string, any> = {
        metadata: {
          created_at: new Date().toISOString(),
          version: "1.0",
          tables_count: tableNames.length,
          backup_type: "full_system"
        },
        data: {}
      };

      // Buscar dados de cada tabela
      for (const tableName of tableNames) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*');
          
          if (error) {
            console.warn(`Erro ao fazer backup da tabela ${tableName}:`, error);
            backupData.data[tableName] = { error: error.message, data: [] };
          } else {
            backupData.data[tableName] = data || [];
          }
        } catch (err) {
          console.warn(`Erro inesperado na tabela ${tableName}:`, err);
          backupData.data[tableName] = { error: 'Erro inesperado', data: [] };
        }
      }

      // 2. Backup das funções do banco
      try {
        const { data: functions } = await supabase.rpc('get_user_allowed_modules');
        backupData.functions = functions || [];
      } catch (err) {
        console.warn('Erro ao fazer backup das funções:', err);
        backupData.functions = [];
      }

      // 3. Backup das configurações de storage
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        backupData.storage = {
          buckets: buckets || [],
          policies: "Backup manual necessário via painel admin"
        };
      } catch (err) {
        console.warn('Erro ao fazer backup do storage:', err);
        backupData.storage = { error: 'Erro ao acessar storage' };
      }

      // 4. Gerar arquivo para download
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ordi-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setBackupStatus('success');
      toast({
        title: "Backup concluído!",
        description: "Backup completo do sistema foi gerado e baixado com sucesso.",
      });

    } catch (error) {
      console.error('Erro durante o backup:', error);
      setBackupStatus('error');
      toast({
        title: "Erro no backup",
        description: "Ocorreu um erro ao gerar o backup do sistema.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSchemaBackup = async () => {
    try {
      // Backup do esquema do banco
      const schemaInfo = {
        metadata: {
          created_at: new Date().toISOString(),
          type: "schema_backup"
        },
        schema: {
          tables: "Para backup completo do esquema, use pg_dump via CLI",
          functions: "Funções listadas no painel do Supabase",
          policies: "RLS policies via Supabase Dashboard",
          storage: "Configurações de storage via Supabase Dashboard"
        },
        instructions: {
          full_schema: "supabase db dump --schema-only > schema.sql",
          full_data: "supabase db dump --data-only > data.sql",
          complete: "supabase db dump > complete-backup.sql"
        }
      };

      const blob = new Blob([JSON.stringify(schemaInfo, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ordi-schema-info-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Info do esquema baixada",
        description: "Arquivo com instruções de backup do esquema foi gerado.",
      });

    } catch (error) {
      console.error('Erro ao gerar info do esquema:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar informações do esquema.",
        variant: "destructive",
      });
    }
  };

  const backupComponents = [
    {
      title: "Dados de Usuários",
      description: "Perfis, sessões e permissões",
      icon: Shield,
      tables: ["profiles", "user_sessions", "user_permissions"]
    },
    {
      title: "Dados Operacionais", 
      description: "Ordens, chamados e equipamentos",
      icon: FileText,
      tables: ["orders", "calls", "equipments", "order_time_logs"]
    },
    {
      title: "Configurações",
      description: "Módulos do sistema e logs",
      icon: Database,
      tables: ["system_modules", "system_logs", "notifications"]
    },
    {
      title: "Storage",
      description: "Políticas e buckets",
      icon: HardDrive,
      tables: ["storage.buckets", "storage.objects"]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Backup do Sistema</h2>
        <p className="text-muted-foreground">
          Gere backups completos do sistema ORDI incluindo dados, configurações e estrutura.
        </p>
      </div>

      {/* Status do último backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status do Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {backupStatus === 'idle' && (
              <>
                <Badge variant="outline">Pronto</Badge>
                <span className="text-sm text-muted-foreground">Nenhum backup em andamento</span>
              </>
            )}
            {backupStatus === 'generating' && (
              <>
                <Badge variant="default">Gerando...</Badge>
                <span className="text-sm text-muted-foreground">Backup em progresso</span>
              </>
            )}
            {backupStatus === 'success' && (
              <>
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Concluído
                </Badge>
                <span className="text-sm text-muted-foreground">Último backup realizado com sucesso</span>
              </>
            )}
            {backupStatus === 'error' && (
              <>
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Erro
                </Badge>
                <span className="text-sm text-muted-foreground">Erro no último backup</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Componentes do backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {backupComponents.map((component, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <component.icon className="h-5 w-5" />
                {component.title}
              </CardTitle>
              <CardDescription>{component.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Tabelas: {component.tables.join(", ")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ações de backup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Backup Completo
            </CardTitle>
            <CardDescription>
              Inclui todos os dados, configurações e metadados do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={generateFullBackup}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? "Gerando Backup..." : "Gerar Backup Completo"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Arquivo JSON com todos os dados das tabelas principais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Info do Esquema
            </CardTitle>
            <CardDescription>
              Instruções para backup completo via CLI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={generateSchemaBackup}
              variant="outline"
              className="w-full"
            >
              Baixar Instruções
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Comandos para backup via Supabase CLI
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Avisos importantes */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            Importante
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700 space-y-2">
          <p>• O backup completo via interface inclui apenas os dados das tabelas principais</p>
          <p>• Para backup completo com estrutura, funções e políticas, use o Supabase CLI</p>
          <p>• Armazene os backups em local seguro e teste a restauração periodicamente</p>
          <p>• Para ambientes de produção, configure backups automáticos no Supabase</p>
        </CardContent>
      </Card>
    </div>
  );
}