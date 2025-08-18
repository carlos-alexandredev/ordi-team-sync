import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, User, Building, Calendar, Clock, Hash } from "lucide-react";

interface Call {
  id: string;
  friendly_id: number;
  title: string;
  description: string;
  priority: "baixa" | "média" | "alta";
  status: "aberto" | "em análise" | "fechado";
  created_at: string;
  updated_at: string;
  client_profile: { name: string };
  company: { name: string };
}

interface CallDetailsModalProps {
  call: Call | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CallDetailsModal({ call, open, onOpenChange }: CallDetailsModalProps) {
  if (!call) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta": return "destructive";
      case "média": return "default";
      case "baixa": return "secondary";
      default: return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberto": return "destructive";
      case "em análise": return "default";
      case "fechado": return "secondary";
      default: return "default";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Chamado #{String(call.friendly_id).padStart(4, '0')}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 p-1">
            {/* Header Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  {call.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getPriorityColor(call.priority)}>
                    Prioridade: {call.priority}
                  </Badge>
                  <Badge variant={getStatusColor(call.status)}>
                    Status: {call.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Cliente:</strong> {call.client_profile?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Empresa:</strong> {call.company?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Criado:</strong> {new Date(call.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Atualizado:</strong> {new Date(call.updated_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {call.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}