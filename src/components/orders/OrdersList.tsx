import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, ClipboardList, Edit, Calendar, User, Building, Eye } from "lucide-react";
import { OrderFormModal } from "./OrderFormModal";
import { OrderDetailsModal } from "./OrderDetailsModal";

interface Order {
  id: string;
  friendly_id: number;
  title: string;
  description: string;
  priority: "baixa" | "média" | "alta" | "crítica";
  status: "pendente" | "em execução" | "concluída" | "cancelada";
  scheduled_date: string | null;
  execution_date: string | null;
  created_at: string;
  updated_at: string;
  client_id: string;
  technician_id?: string;
  client_profile: { name: string };
  company: { name: string };
  technician_profile?: { name: string };
  call?: { title: string };
}

export function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          client_profile: profiles!orders_client_id_fkey(name),
          company: companies(name),
          technician_profile: profiles!orders_technician_id_fkey(name),
          call: calls(title)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar ordens:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar ordens de serviço",
          variant: "destructive",
        });
        return;
      }

      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

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
      case "pendente": return "secondary";
      case "em execução": return "default";
      case "concluída": return "secondary";
      case "cancelada": return "destructive";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando ordens de serviço...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 sm:h-8 sm:w-8" />
            Ordens de Serviço
          </h1>
          <p className="text-muted-foreground">
            Gerencie as ordens de serviço do sistema
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Ordem
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar ordens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em execução">Em execução</SelectItem>
                <SelectItem value="concluída">Concluída</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ordens ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma ordem de serviço encontrada.</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira ordem
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="block lg:hidden space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              #{String(order.friendly_id).padStart(4, '0')}
                            </span>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-primary hover:underline font-medium text-left"
                            >
                              {order.title}
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>
                          {order.call && (
                            <p className="text-xs text-muted-foreground">
                              Ref: {order.call.title}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge variant={getPriorityColor(order.priority)}>
                            {order.priority}
                          </Badge>
                          <Badge variant={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{order.client_profile?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{order.company?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{order.technician_profile?.name || "Não atribuído"}</span>
                        </div>
                        {order.scheduled_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(order.scheduled_date).toLocaleDateString("pt-BR")}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingOrder(order)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Agendada</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          #{String(order.friendly_id).padStart(4, '0')}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-primary hover:underline font-medium text-left"
                          >
                            {order.title}
                          </button>
                          {order.call && (
                            <div className="text-xs text-muted-foreground">
                              Ref: {order.call.title}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{order.client_profile?.name}</TableCell>
                        <TableCell>{order.company?.name}</TableCell>
                        <TableCell>{order.technician_profile?.name || "Não atribuído"}</TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(order.priority)}>
                            {order.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.scheduled_date ? 
                            new Date(order.scheduled_date).toLocaleDateString("pt-BR") : 
                            "Não agendada"
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingOrder(order)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <OrderFormModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => {
          loadOrders();
          setShowCreateModal(false);
        }}
      />

      {editingOrder && (
        <OrderFormModal
          open={!!editingOrder}
          onOpenChange={(open) => !open && setEditingOrder(null)}
          order={editingOrder}
          onSuccess={() => {
            loadOrders();
            setEditingOrder(null);
          }}
        />
      )}

      <OrderDetailsModal
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      />
    </div>
  );
}