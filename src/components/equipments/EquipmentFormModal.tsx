import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Equipment {
  id: string;
  name: string;
  model: string | null;
  serial_number: string | null;
  location: string | null;
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
    status: 'ativo',
    client_id: '',
    company_id: '',
    observations: ''
  });
  const [installationDate, setInstallationDate] = useState<Date | undefined>();
  const [maintenanceDate, setMaintenanceDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadClients();
    loadCompanies();
    
    if (equipment) {
      console.log('Equipment recebido no modal:', equipment);
      const newFormData = {
        name: equipment.name,
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        location: equipment.location || '',
        status: equipment.status,
        client_id: equipment.client_id,
        company_id: equipment.company_id,
        observations: equipment.observations || ''
      };
      console.log('Definindo formData:', newFormData);
      setFormData(newFormData);
      
      if (equipment.installation_date) {
        setInstallationDate(new Date(equipment.installation_date));
      }
      
      if (equipment.last_maintenance_date) {
        setMaintenanceDate(new Date(equipment.last_maintenance_date));
      }
    } else {
      // Reset form when no equipment
      setFormData({
        name: '',
        model: '',
        serial_number: '',
        location: '',
        status: 'ativo',
        client_id: '',
        company_id: '',
        observations: ''
      });
      setInstallationDate(undefined);
      setMaintenanceDate(undefined);
    }
  }, [equipment]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'cliente_final')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.client_id || !formData.company_id) {
      toast({
        title: "Erro",
        description: "Nome, cliente e empresa são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const equipmentData = {
        ...formData,
        installation_date: installationDate?.toISOString().split('T')[0] || null,
        last_maintenance_date: maintenanceDate?.toISOString().split('T')[0] || null
      };

      if (equipment) {
        const { error } = await supabase
          .from('equipments')
          .update(equipmentData)
          .eq('id', equipment.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Equipamento atualizado com sucesso!"
        });
      } else {
        const { error } = await supabase
          .from('equipments')
          .insert([equipmentData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Equipamento criado com sucesso!"
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {equipment ? 'Editar Equipamento' : 'Novo Equipamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Impressora HP LaserJet"
                required
              />
            </div>

            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Ex: LaserJet Pro 400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serial_number">Número de Série</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                placeholder="Ex: ABC123456789"
              />
            </div>

            <div>
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Sala de reuniões"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_id">Cliente *</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="company_id">Empresa *</Label>
              <Select value={formData.company_id} onValueChange={(value) => setFormData({ ...formData, company_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
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

            <div>
              <Label>Data de Instalação</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {installationDate ? format(installationDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={installationDate}
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
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {maintenanceDate ? format(maintenanceDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={maintenanceDate}
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
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Observações sobre o equipamento..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (equipment ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};