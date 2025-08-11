import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaintenanceOrderFormModal } from "./MaintenanceOrderFormModal";
import { useToast } from "@/hooks/use-toast";

interface MaintenanceOrder {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  scheduled_date: string;
  equipment_name: string;
  technician_name?: string;
  created_at: string;
}

export const MaintenanceOrders = () => {
  const [orders, setOrders] = useState<MaintenanceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("maintenance_orders")
        .select(`
          *,
          equipments!equipment_id(name),
          profiles!technician_id(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedOrders = data?.map((order: any) => ({
        id: order.id,
        title: order.title,
        type: order.type,
        status: order.status,
        priority: order.priority,
        scheduled_date: order.scheduled_date,
        equipment_name: order.equipments?.name || "N/A",
        technician_name: order.profiles?.name,
        created_at: order.created_at,
      })) || [];

      setOrders(formattedOrders);
    } catch (error: any) {
      console.error("Erro ao carregar ordens:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as ordens de manutenção",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const getStatusColor = (status: string) => {
    const colors = {
      planejada: "bg-blue-100 text-blue-800",
      aberta: "bg-yellow-100 text-yellow-800",
      em_execucao: "bg-orange-100 text-orange-800",
      aguardando_peca: "bg-purple-100 text-purple-800",
      concluida: "bg-green-100 text-green-800",
      cancelada: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getTypeColor = (type: string) => {
    const colors = {
      preventiva: "bg-blue-100 text-blue-800",
      preditiva: "bg-green-100 text-green-800",
      corretiva: "bg-red-100 text-red-800",
      detectiva: "bg-purple-100 text-purple-800",
      tempo: "bg-orange-100 text-orange-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.equipment_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesType = typeFilter === "all" || order.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return <div className="text-center py-8">Carregando ordens de manutenção...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por título ou equipamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="planejada">Planejada</SelectItem>
              <SelectItem value="aberta">Aberta</SelectItem>
              <SelectItem value="em_execucao">Em Execução</SelectItem>
              <SelectItem value="aguardando_peca">Aguardando Peça</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="preventiva">Preventiva</SelectItem>
              <SelectItem value="preditiva">Preditiva</SelectItem>
              <SelectItem value="corretiva">Corretiva</SelectItem>
              <SelectItem value="detectiva">Detectiva</SelectItem>
              <SelectItem value="tempo">Baseada no Tempo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ordem
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{order.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Equipamento: {order.equipment_name}
                  </p>
                  {order.technician_name && (
                    <p className="text-sm text-muted-foreground">
                      Técnico: {order.technician_name}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace("_", " ").toUpperCase()}
                  </Badge>
                  <Badge className={getTypeColor(order.type)}>
                    {order.type.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Prioridade: {order.priority}</span>
                {order.scheduled_date && (
                  <span>
                    Agendado: {new Date(order.scheduled_date).toLocaleDateString("pt-BR")}
                  </span>
                )}
                <span>
                  Criado: {new Date(order.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma ordem de manutenção encontrada
        </div>
      )}

      <MaintenanceOrderFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          loadOrders();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};