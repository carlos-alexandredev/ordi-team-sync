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
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-lg font-semibold pr-8 leading-tight">
                  {order.title}
                </DialogTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getStatusColor(order.status)} variant="secondary">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      <span className="text-xs">{getStatusLabel(order.status)}</span>
                    </div>
                  </Badge>
                  <Badge className={getPriorityColor(order.priority)}>
                    <span className="text-xs">{order.priority.toUpperCase()}</span>
                  </Badge>
                  {isOverdue && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      <span className="text-xs">Atrasada</span>
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Data e Hora - Compacta */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="text-sm">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs font-medium">Data</span>
                </div>
                <p className="font-medium">{format(new Date(order.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs font-medium">Horário</span>
                </div>
                <p className="font-medium">{format(new Date(order.scheduled_date), "HH:mm", { locale: ptBR })}h</p>
              </div>
            </div>

            {/* Cliente e Técnico - Compacta */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-2 border rounded">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium text-sm">{order.client_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 border rounded">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Técnico</p>
                  <p className="font-medium text-sm">{order.technician_name}</p>
                </div>
              </div>
            </div>

            {/* Descrição - Compacta */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Descrição</h4>
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded">
                {order.description}
              </p>
            </div>

            {/* Informações Extras - Compacta */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="text-center p-2 bg-muted/20 rounded">
                <p className="text-muted-foreground">Código</p>
                <p className="font-mono font-medium">{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-center p-2 bg-muted/20 rounded">
                <p className="text-muted-foreground">Duração</p>
                <p className="font-medium">2h30min</p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button size="sm" onClick={handleEdit} className="flex items-center gap-1">
              <Edit className="h-3 w-3" />
              Editar
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