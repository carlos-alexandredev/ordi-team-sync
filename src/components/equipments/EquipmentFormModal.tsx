import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, MapPin, Building2, Satellite } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { EquipmentLocationTab } from "./EquipmentLocationTab";
import { EquipmentFloorPlanTab } from "./EquipmentFloorPlanTab";
import { EquipmentMapTab } from "./EquipmentMapTab";
import { EquipmentPlantsTab } from "./EquipmentPlantsTab";

interface Equipment {
  id: string;
  friendly_id: number;
  name: string;
  model: string | null;
  serial_number: string | null;
  location: string | null;
  location_detail: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  installation_date: string | null;
  last_maintenance_date: string | null;
  observations: string | null;
  client_id: string;
  company_id: string;
}

interface EquipmentFormModalProps {
  equipment?: Equipment | null;
  onClose: () => void;
}

export const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  equipment,
  onClose
}) => {
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serial_number: '',
    location: '',
    location_detail: '',
    latitude: null as number | null,
    longitude: null as number | null,
    status: 'ativo',
    observations: ''
  });
  const [installationDate, setInstallationDate] = useState<Date | undefined>();
  const [maintenanceDate, setMaintenanceDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<{id: string, company_id: string | null, role: string} | null>(null);
  const { toast } = useToast();
  const { logActivity, logError } = useActivityLogger();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User from auth:', user);
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, company_id, role')
        .eq('user_id', user.id)
        .single();

      console.log('Profile data loaded:', data);
      console.log('Profile error:', error);

      if (error) throw error;
      
      setUserProfile(data);
    } catch (error: any) {
      console.error('Erro ao carregar perfil do usuário:', error);
      toast({
        title: "Erro",
        description: `Erro ao carregar perfil: ${error.message}`,
        variant: "destructive"
      });
      await logError('load_user_profile', error, { context: 'EquipmentFormModal' });
    }
  };

  useEffect(() => {
    if (equipment) {
      console.log('Equipment recebido no modal:', equipment);
      const newFormData = {
        name: equipment.name,
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        location: equipment.location || '',
        location_detail: equipment.location_detail || '',
        latitude: equipment.latitude,
        longitude: equipment.longitude,
        status: equipment.status,
        observations: equipment.observations || ''
      };
      console.log('Definindo formData:', newFormData);
      setFormData(newFormData);
      
      if (equipment.installation_date) {
        setInstallationDate(new Date(equipment.installation_date));
      } else {
        setInstallationDate(undefined);
      }
      
      if (equipment.last_maintenance_date) {
        setMaintenanceDate(new Date(equipment.last_maintenance_date));
      } else {
        setMaintenanceDate(undefined);
      }
    } else {
      // Reset form when no equipment
      setFormData({
        name: '',
        model: '',
        serial_number: '',
        location: '',
        location_detail: '',
        latitude: null,
        longitude: null,
        status: 'ativo',
        observations: ''
      });
      setInstallationDate(undefined);
      setMaintenanceDate(undefined);
    }
  }, [equipment]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !userProfile) {
      const validationError = !formData.name ? "Nome é obrigatório" : "Perfil do usuário não carregado";
      
      console.log('Validation failed:', { 
        formData, 
        userProfile, 
        hasName: !!formData.name,
        hasUserProfile: !!userProfile,
        userRole: userProfile?.role
      });
      
      toast({
        title: "Erro",
        description: validationError,
        variant: "destructive"
      });
      
      await logError('equipment_validation', new Error(validationError), {
        formData,
        userProfile,
        missingFields: {
          name: !formData.name,
          userProfile: !userProfile
        }
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Preparing equipment data with:', { userProfile, formData });
      
      const equipmentData = {
        ...formData,
        client_id: userProfile.id,
        // Para admin_master sem company_id, usar uma empresa padrão ou deixar null
        company_id: userProfile.company_id || (userProfile.role === 'admin_master' ? null : userProfile.company_id),
        installation_date: installationDate?.toISOString().split('T')[0] || null,
        last_maintenance_date: maintenanceDate?.toISOString().split('T')[0] || null
      };

      console.log('Equipment data to be saved:', equipmentData);

      if (equipment) {
        const { error } = await supabase
          .from('equipments')
          .update(equipmentData)
          .eq('id', equipment.id);

        if (error) throw error;

        await logActivity({
          action: 'update',
          table_name: 'equipments',
          record_id: equipment.id,
          details: {
            equipment_name: formData.name,
            client_id: userProfile.id,
            changes: equipmentData,
            operation: 'equipment_update'
          }
        });

        toast({
          title: "Sucesso",
          description: "Equipamento atualizado com sucesso!"
        });
      } else {
        const { data: newEquipment, error } = await supabase
          .from('equipments')
          .insert([equipmentData])
          .select()
          .single();

        if (error) throw error;

        await logActivity({
          action: 'insert',
          table_name: 'equipments',
          record_id: newEquipment.id,
          details: {
            equipment_name: formData.name,
            client_id: userProfile.id,
            company_id: userProfile.company_id,
            equipment_data: equipmentData,
            operation: 'equipment_create'
          }
        });

        toast({
          title: "Sucesso",
          description: "Equipamento criado com sucesso!"
        });
      }

      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar equipamento:', error);
      
      const errorMessage = error.message || 'Erro desconhecido ao salvar equipamento';
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });

      await logError('equipment_save', error, {
        operation: equipment ? 'update' : 'create',
        equipment_id: equipment?.id,
        formData,
        equipmentData: {
          ...formData,
          client_id: userProfile?.id,
          company_id: userProfile?.company_id,
          installation_date: installationDate?.toISOString().split('T')[0] || null,
          last_maintenance_date: maintenanceDate?.toISOString().split('T')[0] || null
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto max-sm:max-w-[100vw] max-sm:h-[100dvh]">
        <DialogHeader>
          <DialogTitle>
            {equipment ? 'Editar Equipamento' : 'Novo Equipamento'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5 max-sm:grid-cols-1 max-sm:overflow-x-auto max-sm:whitespace-nowrap max-sm:flex">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Localização
            </TabsTrigger>
            <TabsTrigger value="floorplan" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Planta
            </TabsTrigger>
            <TabsTrigger value="plants" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Plantas
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Satellite className="h-4 w-4" />
              Mapa
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={equipment ? equipment.name : formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Impressora HP LaserJet"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={equipment ? (equipment.model || '') : formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Ex: LaserJet Pro 400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serial_number">Número de Série</Label>
                  <Input
                    id="serial_number"
                    value={equipment ? (equipment.serial_number || '') : formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    placeholder="Ex: ABC123456789"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={equipment ? equipment.status : formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="manutenção">Em Manutenção</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data de Instalação</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {(equipment?.installation_date ? new Date(equipment.installation_date) : installationDate) ? 
                          format(equipment?.installation_date ? new Date(equipment.installation_date) : installationDate!, "PPP", { locale: ptBR }) : 
                          "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={equipment?.installation_date ? new Date(equipment.installation_date) : installationDate}
                        onSelect={setInstallationDate}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Última Manutenção</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {(equipment?.last_maintenance_date ? new Date(equipment.last_maintenance_date) : maintenanceDate) ? 
                          format(equipment?.last_maintenance_date ? new Date(equipment.last_maintenance_date) : maintenanceDate!, "PPP", { locale: ptBR }) : 
                          "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={equipment?.last_maintenance_date ? new Date(equipment.last_maintenance_date) : maintenanceDate}
                        onSelect={setMaintenanceDate}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={equipment ? (equipment.observations || '') : formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  placeholder="Observações sobre o equipamento..."
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="location">
              <EquipmentLocationTab
                formData={formData}
                setFormData={setFormData}
                equipment={equipment}
              />
            </TabsContent>

            <TabsContent value="floorplan">
              <EquipmentFloorPlanTab
                equipment={equipment}
              />
            </TabsContent>

            <TabsContent value="plants">
              <EquipmentPlantsTab
                equipment={equipment}
              />
            </TabsContent>

            <TabsContent value="map">
              <EquipmentMapTab
                formData={formData}
                setFormData={setFormData}
                equipment={equipment}
              />
            </TabsContent>

            <div className="flex justify-end space-x-2 pt-4 max-sm:sticky max-sm:bottom-0 max-sm:bg-background max-sm:p-4 max-sm:border-t max-sm:-mx-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : (equipment ? 'Atualizar' : 'Criar')}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
