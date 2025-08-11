import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConditionReadingFormModal } from "./ConditionReadingFormModal";
import { useToast } from "@/hooks/use-toast";

interface ConditionReading {
  id: string;
  metric: string;
  value: number;
  unit?: string;
  equipment_name: string;
  reading_at: string;
  source: string;
}

export const ConditionReadings = () => {
  const [readings, setReadings] = useState<ConditionReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [metricFilter, setMetricFilter] = useState("all");
  const [equipments, setEquipments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<string[]>([]);
  const { toast } = useToast();

  const loadReadings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("condition_readings")
        .select(`
          *,
          equipments!equipment_id(name)
        `)
        .order("reading_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedReadings = data?.map((reading: any) => ({
        id: reading.id,
        metric: reading.metric,
        value: reading.value,
        unit: reading.unit,
        equipment_name: reading.equipments?.name || "N/A",
        reading_at: reading.reading_at,
        source: reading.source,
      })) || [];

      setReadings(formattedReadings);

      // Extract unique metrics
      const uniqueMetrics = [...new Set(formattedReadings.map(r => r.metric))];
      setMetrics(uniqueMetrics);
    } catch (error: any) {
      console.error("Erro ao carregar leituras:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as leituras de condição",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEquipments = async () => {
    try {
      const { data, error } = await supabase
        .from("equipments")
        .select("id, name")
        .eq("status", "ativo")
        .order("name");

      if (error) throw error;
      setEquipments(data || []);
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error);
    }
  };

  useEffect(() => {
    loadReadings();
    loadEquipments();
  }, []);

  const getConditionStatus = (metric: string, value: number) => {
    // Simplified condition assessment - in real implementation,
    // this would use thresholds from maintenance plans
    if (metric.includes("temperature") && value > 80) return "critical";
    if (metric.includes("vibration") && value > 50) return "warning";
    if (metric.includes("pressure") && value > 100) return "critical";
    return "normal";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      normal: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const filteredReadings = readings.filter((reading) => {
    const matchesEquipment = equipmentFilter === "all" || 
      equipments.find(e => e.name === reading.equipment_name)?.id === equipmentFilter;
    const matchesMetric = metricFilter === "all" || reading.metric === metricFilter;
    return matchesEquipment && matchesMetric;
  });

  if (loading) {
    return <div className="text-center py-8">Carregando leituras de condição...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Equipamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Equipamentos</SelectItem>
              {equipments.map((equipment) => (
                <SelectItem key={equipment.id} value={equipment.id}>
                  {equipment.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={metricFilter} onValueChange={setMetricFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Métrica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Métricas</SelectItem>
              {metrics.map((metric) => (
                <SelectItem key={metric} value={metric}>
                  {metric}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Leitura
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredReadings.map((reading) => {
          const status = getConditionStatus(reading.metric, reading.value);
          return (
            <Card key={reading.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {reading.metric}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Equipamento: {reading.equipment_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {reading.value} {reading.unit}
                    </div>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Fonte: {reading.source}</span>
                  <span>
                    {new Date(reading.reading_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredReadings.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma leitura de condição encontrada
        </div>
      )}

      <ConditionReadingFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          loadReadings();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};