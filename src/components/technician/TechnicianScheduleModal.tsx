import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Clock, 
  User, 
  Wrench,
  CheckCircle,
  PlayCircle,
  XCircle,
  Edit,
  Eye,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ScheduleOrder {
  id: string;
  title: string;
  client_name: string;
  scheduled_date: string;
  status: "pendente" | "em execução" | "concluída" | "cancelada" | "atrasada" | "pendente_finalizacao";
  priority: "baixa" | "média" | "alta" | "crítica";
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
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    priority: "média",
    status: "pendente",
    scheduled_date: "",
    technician_id: ""
  });

  useEffect(() => {
    if (order) {
      setFormData({
        description: order.description,
        priority: order.priority,
        status: order.status === 'atrasada' ? 'pendente' : order.status,
        scheduled_date: order.scheduled_date.split('T')[0],
        technician_id: order.technician_id
      });
    }
  }, [order]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'em execução':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'concluída':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelada':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'crítica':
        return 'bg-red-700 text-white';
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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Aqui você implementaria a lógica de salvar
    setIsEditing(false);
    onOrderUpdate();
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (order) {
      setFormData({
        description: order.description,
        priority: order.priority,
        status: order.status === 'atrasada' ? 'pendente' : order.status,
        scheduled_date: order.scheduled_date.split('T')[0],
        technician_id: order.technician_id
      });
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-lg font-semibold">
            {order.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descrição detalhada do serviço"
              rows={3}
              disabled={!isEditing}
              className="resize-none"
            />
          </div>

          {/* Prioridade, Status e Data */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({...formData, priority: value})}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="média">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="crítica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em execução">Em execução</SelectItem>
                  <SelectItem value="concluída">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">Data Agendada</Label>
              <Input
                id="date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Técnico Responsável */}
          <div className="space-y-2">
            <Label htmlFor="technician" className="text-sm font-medium">Técnico Responsável</Label>
            <Select
              value={formData.technician_id}
              onValueChange={(value) => setFormData({...formData, technician_id: value})}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um técnico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={order.technician_id}>{order.technician_name}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Equipamentos do Cliente */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              <Label className="text-sm font-medium">Equipamentos do Cliente</Label>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <input type="radio" className="w-4 h-4" defaultChecked />
                  <div>
                    <p className="font-medium text-sm">CÂMERA HIKVISION</p>
                    <p className="text-xs text-muted-foreground">BULLET • S/N: 123963 • PÁTIO ENXOFRE</p>
                  </div>
                </div>
                <Badge className="bg-blue-500 text-white text-xs">ativo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <input type="radio" className="w-4 h-4" />
                  <div>
                    <p className="font-medium text-sm">CÂMERA HIKVISION</p>
                    <p className="text-xs text-muted-foreground">Local não informado</p>
                  </div>
                </div>
                <Badge className="bg-blue-500 text-white text-xs">ativo</Badge>
              </div>
            </div>
          </div>

          {/* Controle de Tempo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <Label className="text-sm font-medium">Controle de Tempo</Label>
            </div>
            <div className="p-4 border rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground text-center">
                Nenhum atendimento em andamento
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave}>
                Salvar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button size="sm" onClick={handleEdit} className="flex items-center gap-1">
                <Edit className="h-3 w-3" />
                Editar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}