import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaintenancePlanFormModal } from "./MaintenancePlanFormModal";
import { useToast } from "@/hooks/use-toast";

interface MaintenancePlan {
  id: string;
  title: string;
  type: string;
  status: string;
  periodicity_days?: number;
  usage_interval?: number;
  condition_metric?: string;
  condition_threshold?: number;
  equipment_name: string;
  next_due_at?: string;
  last_executed_at?: string;
}

export const MaintenancePlans = () => {
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const { toast } = useToast();

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("maintenance_plans")
        .select(`
          *,
          equipments!equipment_id(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedPlans = data?.map((plan: any) => ({
        id: plan.id,
        title: plan.title,
        type: plan.type,
        status: plan.status,
        periodicity_days: plan.periodicity_days,
        usage_interval: plan.usage_interval,
        condition_metric: plan.condition_metric,
        condition_threshold: plan.condition_threshold,
        equipment_name: plan.equipments?.name || "N/A",
        next_due_at: plan.next_due_at,
        last_executed_at: plan.last_executed_at,
      })) || [];

      setPlans(formattedPlans);
    } catch (error: any) {
      console.error("Erro ao carregar planos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos de manutenção",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const getStatusColor = (status: string) => {
    const colors = {
      ativo: "bg-green-100 text-green-800",
      pausado: "bg-yellow-100 text-yellow-800",
      cancelado: "bg-red-100 text-red-800",
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

  const generateNextOrder = async (planId: string) => {
    try {
      // This would call an edge function to generate the next order
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "A geração automática de ordens será implementada em breve",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao gerar próxima ordem",
        variant: "destructive",
      });
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.equipment_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
    const matchesType = typeFilter === "all" || plan.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return <div className="text-center py-8">Carregando planos de manutenção...</div>;
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
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="pausado">Pausado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
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
          Novo Plano
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredPlans.map((plan) => (
          <Card key={plan.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Equipamento: {plan.equipment_name}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    {plan.periodicity_days && (
                      <span>Periodicidade: {plan.periodicity_days} dias</span>
                    )}
                    {plan.usage_interval && (
                      <span>Intervalo de uso: {plan.usage_interval}</span>
                    )}
                    {plan.condition_metric && plan.condition_threshold && (
                      <span>
                        Condição: {plan.condition_metric} ≥ {plan.condition_threshold}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={getStatusColor(plan.status)}>
                    {plan.status.toUpperCase()}
                  </Badge>
                  <Badge className={getTypeColor(plan.type)}>
                    {plan.type.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {plan.next_due_at && (
                    <span>
                      Próxima: {new Date(plan.next_due_at).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  {plan.last_executed_at && (
                    <span className="ml-4">
                      Última: {new Date(plan.last_executed_at).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateNextOrder(plan.id)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Gerar Próxima
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPlans.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum plano de manutenção encontrado
        </div>
      )}

      <MaintenancePlanFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          loadPlans();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};