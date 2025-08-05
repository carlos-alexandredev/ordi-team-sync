import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  XCircle,
  Edit,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { OrderFormModal } from "@/components/orders/OrderFormModal";

interface ScheduleOrder {
  id: string;
  title: string;
  client_name: string;
  scheduled_date: string;
  status: "pendente" | "em execução" | "concluída" | "cancelada" | "atrasada" | "pendente_finalizacao";
  priority: "baixa" | "média" | "alta";
  technician_id: string;
  technician_name: string;
  description: string;
  client_id: string;
}

interface TechnicianScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: ScheduleOrder | null;
  onOrderUpdate: () => void;
}

export function TechnicianScheduleModal({ open, onOpenChange, order, onOrderUpdate }: TechnicianScheduleModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'atrasada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'em execução':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'concluída':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente_finalizacao':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelada':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="h-4 w-4" />;
      case 'atrasada':
        return <AlertTriangle className="h-4 w-4" />;
      case 'em execução':
        return <PlayCircle className="h-4 w-4" />;
      case 'concluída':
        return <CheckCircle className="h-4 w-4" />;
      case 'pendente_finalizacao':
        return <Eye className="h-4 w-4" />;
      case 'cancelada':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-500 text-white';
      case 'média':
        return 'bg-yellow-500 text-white';
      case 'baixa':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'Alta Prioridade';
      case 'média':
        return 'Prioridade Média';
      case 'baixa':
        return 'Baixa Prioridade';
      default:
        return 'Prioridade Não Definida';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Agendada';
      case 'atrasada':
        return 'Atrasada';
      case 'em execução':
        return 'Em Execução';
      case 'concluída':
        return 'Finalizada';
      case 'pendente_finalizacao':
        return 'Pendente Finalização';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
    onOpenChange(false);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    onOrderUpdate();
  };

  const isOverdue = order.status === 'atrasada' || 
    (order.status === 'pendente' && new Date(order.scheduled_date) < new Date());

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-xl font-semibold pr-8">
                  {order.title}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(order.status)} variant="secondary">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {getStatusLabel(order.status)}
                    </div>
                  </Badge>
                  <Badge className={getPriorityColor(order.priority)}>
                    {getPriorityLabel(order.priority)}
                  </Badge>
                  {isOverdue && (
                    <Badge variant="destructive" className="animate-pulse">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Atrasada
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações de Data e Hora */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Data:</span>
                  <span>{format(new Date(order.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Horário:</span>
                  <span>{format(new Date(order.scheduled_date), "HH:mm", { locale: ptBR })}h</span>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Cliente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Nome:</span>
                  <span>{order.client_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>contato@cliente.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>(11) 99999-9999</span>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Técnico */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Técnico Responsável
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Nome:</span>
                  <span>{order.technician_name}</span>
                </div>
              </CardContent>
            </Card>

            {/* Descrição da Tarefa */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Descrição da Tarefa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {order.description}
                </p>
              </CardContent>
            </Card>

            {/* Informações Adicionais */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Código da Tarefa:</span>
                    <p className="font-mono">{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Duração Estimada:</span>
                    <p>2h30min</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <span className="font-medium text-muted-foreground text-sm">Endereço:</span>
                  <p className="text-sm">Rua das Flores, 123 - Centro, São Paulo - SP</p>
                </div>
                
                <div>
                  <span className="font-medium text-muted-foreground text-sm">Orientações:</span>
                  <p className="text-sm">Entrar pela portaria principal e solicitar acesso ao responsável pela segurança.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar Tarefa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      {showEditModal && (
        <OrderFormModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onSuccess={handleEditSuccess}
          order={{
            id: order.id,
            title: order.title,
            description: order.description,
            priority: order.priority,
            status: order.status === 'atrasada' ? 'pendente' : 
                   order.status === 'pendente_finalizacao' ? 'concluída' : 
                   order.status as "pendente" | "em execução" | "concluída" | "cancelada",
            client_id: order.client_id,
            technician_id: order.technician_id,
            scheduled_date: order.scheduled_date
          }}
        />
      )}
    </>
  );
}