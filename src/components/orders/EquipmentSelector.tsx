import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wrench, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Equipment {
  id: string;
  name: string;
  model: string | null;
  serial_number: string | null;
  location: string | null;
  status: string;
}

interface SelectedEquipment {
  equipment_id: string;
  action_type: string;
  observations: string;
  equipment?: Equipment;
}

interface EquipmentSelectorProps {
  clientId: string;
  orderId?: string;
  selectedEquipments: SelectedEquipment[];
  onSelectionChange: (equipments: SelectedEquipment[]) => void;
  isReadOnly?: boolean;
}

export const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({
  clientId,
  orderId,
  selectedEquipments,
  onSelectionChange,
  isReadOnly = false
}) => {
  const [availableEquipments, setAvailableEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (clientId) {
      loadEquipments();
    }
  }, [clientId]);

  const loadEquipments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'ativo')
        .order('name');

      if (error) throw error;
      setAvailableEquipments(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar equipamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentToggle = (equipment: Equipment, checked: boolean) => {
    if (checked) {
      const newSelection: SelectedEquipment = {
        equipment_id: equipment.id,
        action_type: 'manutenção',
        observations: '',
        equipment
      };
      onSelectionChange([...selectedEquipments, newSelection]);
    } else {
      onSelectionChange(selectedEquipments.filter(item => item.equipment_id !== equipment.id));
    }
  };

  const updateEquipmentDetails = (equipmentId: string, field: 'action_type' | 'observations', value: string) => {
    const updated = selectedEquipments.map(item =>
      item.equipment_id === equipmentId ? { ...item, [field]: value } : item
    );
    onSelectionChange(updated);
  };

  const isEquipmentSelected = (equipmentId: string) => {
    return selectedEquipments.some(item => item.equipment_id === equipmentId);
  };

  const getSelectedEquipment = (equipmentId: string) => {
    return selectedEquipments.find(item => item.equipment_id === equipmentId);
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando equipamentos...</p>
        </div>
      </Card>
    );
  }

  if (!clientId) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground text-center">
          Selecione um cliente para ver os equipamentos disponíveis
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center mb-4">
        <Wrench className="mr-2 h-4 w-4" />
        <h3 className="font-semibold">Equipamentos do Cliente</h3>
      </div>

      {availableEquipments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum equipamento ativo encontrado para este cliente
        </p>
      ) : (
        <div className="space-y-3">
          {availableEquipments.map((equipment) => {
            const isSelected = isEquipmentSelected(equipment.id);
            const selectedData = getSelectedEquipment(equipment.id);

            return (
              <div key={equipment.id} className="border rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleEquipmentToggle(equipment, checked as boolean)}
                    disabled={isReadOnly}
                  />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{equipment.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {equipment.model && `${equipment.model} • `}
                          {equipment.serial_number && `S/N: ${equipment.serial_number} • `}
                          {equipment.location || 'Local não informado'}
                        </p>
                      </div>
                      <Badge variant="default">{equipment.status}</Badge>
                    </div>

                    {isSelected && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                        <div>
                          <Label className="text-xs">Tipo de Ação</Label>
                          <select
                            value={selectedData?.action_type || 'manutenção'}
                            onChange={(e) => updateEquipmentDetails(equipment.id, 'action_type', e.target.value)}
                            disabled={isReadOnly}
                            className="w-full mt-1 px-2 py-1 text-sm border rounded"
                          >
                            <option value="manutenção">Manutenção</option>
                            <option value="instalação">Instalação</option>
                            <option value="troca">Troca</option>
                            <option value="inspeção">Inspeção</option>
                            <option value="retirada">Retirada</option>
                          </select>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Observações</Label>
                          <Input
                            value={selectedData?.observations || ''}
                            onChange={(e) => updateEquipmentDetails(equipment.id, 'observations', e.target.value)}
                            placeholder="Observações..."
                            disabled={isReadOnly}
                            className="mt-1 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};