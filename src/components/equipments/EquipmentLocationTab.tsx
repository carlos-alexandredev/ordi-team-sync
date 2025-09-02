import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Equipment {
  location_detail?: string | null;
}

interface EquipmentFormData {
  name: string;
  model: string;
  serial_number: string;
  location: string;
  location_detail: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  observations: string;
}

interface EquipmentLocationTabProps {
  formData: EquipmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<EquipmentFormData>>;
  equipment?: Equipment | null;
}

export const EquipmentLocationTab: React.FC<EquipmentLocationTabProps> = ({
  formData,
  setFormData,
  equipment
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="location">Local Básico</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Ex: Sala de reuniões"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Localização geral do equipamento
        </p>
      </div>

      <div>
        <Label htmlFor="location_detail">Detalhamento da Localização</Label>
        <Textarea
          id="location_detail"
          value={equipment?.location_detail || formData.location_detail}
          onChange={(e) => setFormData({ ...formData, location_detail: e.target.value })}
          placeholder="Ex: Próximo à janela, mesa do coordenador, andar térreo..."
          rows={3}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Descrição detalhada da localização para facilitar a identificação
        </p>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">💡 Dica</h4>
        <p className="text-sm text-muted-foreground">
          Use as abas "Planta" e "Mapa" para definir a posição exata do equipamento 
          visualmente em plantas baixas e coordenadas GPS.
        </p>
      </div>
    </div>
  );
};