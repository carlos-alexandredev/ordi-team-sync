import { UseFormReturn } from "react-hook-form";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface EquipmentsTabProps {
  form: UseFormReturn<any>;
}

interface Equipment {
  id: string;
  name: string;
  model?: string;
  serial_number?: string;
  status: string;
}

export function EquipmentsTab({ form }: EquipmentsTabProps) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const selectedEquipments = form.watch("equipments") || [];

  useEffect(() => {
    loadEquipments();
  }, []);

  useEffect(() => {
    filterEquipments();
  }, [searchTerm, equipments]);

  const loadEquipments = async () => {
    try {
      const { data, error } = await supabase
        .from("equipments")
        .select("id, name, model, serial_number, status")
        .eq("status", "ativo")
        .order("name");

      if (error) throw error;
      if (data) {
        setEquipments(data);
        setFilteredEquipments(data);
      }
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEquipments = () => {
    if (!searchTerm.trim()) {
      setFilteredEquipments(equipments);
      return;
    }

    const filtered = equipments.filter(equipment =>
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.serial_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredEquipments(filtered);
  };

  const handleEquipmentToggle = (equipmentId: string, checked: boolean) => {
    const currentSelected = form.getValues("equipments") || [];
    
    if (checked) {
      form.setValue("equipments", [...currentSelected, equipmentId]);
    } else {
      form.setValue("equipments", currentSelected.filter((id: string) => id !== equipmentId));
    }
  };

  const selectAll = () => {
    const allIds = filteredEquipments.map(eq => eq.id);
    form.setValue("equipments", allIds);
  };

  const clearAll = () => {
    form.setValue("equipments", []);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Carregando equipamentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Equipamentos Disponíveis</h3>
        <div className="text-sm text-muted-foreground">
          {selectedEquipments.length} selecionado(s)
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar equipamentos por nome, modelo ou número de série..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={selectAll}
          className="text-sm text-primary hover:underline"
        >
          Selecionar todos
        </button>
        <span className="text-muted-foreground">•</span>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm text-primary hover:underline"
        >
          Limpar seleção
        </button>
      </div>

      {filteredEquipments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "Nenhum equipamento encontrado com este termo." : "Nenhum equipamento disponível."}
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredEquipments.map((equipment) => (
            <div
              key={equipment.id}
              className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50"
            >
              <Checkbox
                id={equipment.id}
                checked={selectedEquipments.includes(equipment.id)}
                onCheckedChange={(checked) => 
                  handleEquipmentToggle(equipment.id, checked as boolean)
                }
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={equipment.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {equipment.name}
                </label>
                <div className="text-sm text-muted-foreground mt-1">
                  {equipment.model && (
                    <span>Modelo: {equipment.model}</span>
                  )}
                  {equipment.model && equipment.serial_number && " • "}
                  {equipment.serial_number && (
                    <span>S/N: {equipment.serial_number}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    equipment.status === 'ativo' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {equipment.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEquipments.length > 0 && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Equipamentos Selecionados:</h4>
          <div className="text-sm text-muted-foreground">
            {selectedEquipments.length} equipamento(s) será(ão) associado(s) a esta tarefa.
          </div>
        </div>
      )}
    </div>
  );
}