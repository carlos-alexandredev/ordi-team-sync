import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle } from "lucide-react";

export function NotificationPlaceholder() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Sistema de Notificações
            <Badge variant="secondary">Em Desenvolvimento</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="font-medium">E-mail Automático</span>
              </div>
              <p className="text-sm text-muted-foreground">
                📧 Placeholder: Envio de e-mail ao criar cliente
                <br />
                Exemplo: "Sua conta foi criada no Sistema Ordi"
              </p>
            </div>
            
            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">WhatsApp API</span>
              </div>
              <p className="text-sm text-muted-foreground">
                📱 Placeholder: Integração com WhatsApp
                <br />
                Exemplo: Mensagem de boas-vindas e credenciais de login
              </p>
            </div>

            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Notificação Chamado</span>
              </div>
              <p className="text-sm text-muted-foreground">
                🔔 Placeholder: E-mail quando chamado é criado
                <br />
                Exemplo: "Novo chamado #001 criado"
              </p>
            </div>

            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Notificação Ordem</span>
              </div>
              <p className="text-sm text-muted-foreground">
                📋 Placeholder: WhatsApp quando ordem é gerada
                <br />
                Exemplo: "Ordem de serviço OS-001 foi criada"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}