import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit } from "lucide-react";

interface ModuleSetting {
  id: string;
  key: string;
  type: string;
  value_text?: string;
  value_number?: number;
  value_boolean?: boolean;
  value_json?: any;
}

interface Module {
  id: string;
  name: string;
}

interface ModuleSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: Module | null;
}

export const ModuleSettingsDrawer = ({ open, onOpenChange, module }: ModuleSettingsDrawerProps) => {
  const [settings, setSettings] = useState<ModuleSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState<ModuleSetting | null>(null);
  const [newSetting, setNewSetting] = useState({
    key: "",
    type: "string",
    value: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open && module) {
      loadSettings();
    }
  }, [open, module]);

  const loadSettings = async () => {
    if (!module) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('module_settings')
        .select('*')
        .eq('module_id', module.id)
        .order('key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!module) return;

    try {
      const settingData: any = {
        module_id: module.id,
        key: newSetting.key,
        type: newSetting.type
      };

      // Set the appropriate value field based on type
      switch (newSetting.type) {
        case 'string':
          settingData.value_text = newSetting.value;
          break;
        case 'number':
          settingData.value_number = parseFloat(newSetting.value);
          break;
        case 'boolean':
          settingData.value_boolean = newSetting.value === 'true';
          break;
        case 'json':
          try {
            settingData.value_json = JSON.parse(newSetting.value);
          } catch {
            throw new Error('JSON inválido');
          }
          break;
      }

      const { error } = await supabase
        .from('module_settings')
        .upsert(settingData);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração salva com sucesso",
      });
      loadSettings();
      setShowAddModal(false);
      setEditingSetting(null);
      setNewSetting({ key: "", type: "string", value: "" });
    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao salvar configuração",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSetting = async (settingId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta configuração?')) return;

    try {
      const { error } = await supabase
        .from('module_settings')
        .delete()
        .eq('id', settingId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração excluída com sucesso",
      });
      loadSettings();
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir configuração",
        variant: "destructive"
      });
    }
  };

  const getSettingValue = (setting: ModuleSetting) => {
    switch (setting.type) {
      case 'string':
        return setting.value_text || '';
      case 'number':
        return setting.value_number?.toString() || '0';
      case 'boolean':
        return setting.value_boolean ? 'Sim' : 'Não';
      case 'json':
        return JSON.stringify(setting.value_json, null, 2);
      default:
        return '';
    }
  };

  const startEdit = (setting: ModuleSetting) => {
    setEditingSetting(setting);
    setNewSetting({
      key: setting.key,
      type: setting.type,
      value: getSettingValue(setting)
    });
    setShowAddModal(true);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center justify-between">
            <span>Configurações do Módulo: {module?.name}</span>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Configuração
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingSetting ? 'Editar Configuração' : 'Nova Configuração'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveSetting} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="key">Chave *</Label>
                    <Input
                      id="key"
                      value={newSetting.key}
                      onChange={(e) => setNewSetting(prev => ({ ...prev, key: e.target.value }))}
                      placeholder="nome_da_configuracao"
                      required
                      disabled={!!editingSetting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                      value={newSetting.type}
                      onValueChange={(value) => setNewSetting(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">Texto</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="boolean">Verdadeiro/Falso</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="value">Valor *</Label>
                    {newSetting.type === 'boolean' ? (
                      <Select
                        value={newSetting.value}
                        onValueChange={(value) => setNewSetting(prev => ({ ...prev, value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Verdadeiro</SelectItem>
                          <SelectItem value="false">Falso</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : newSetting.type === 'json' ? (
                      <Textarea
                        id="value"
                        value={newSetting.value}
                        onChange={(e) => setNewSetting(prev => ({ ...prev, value: e.target.value }))}
                        placeholder='{"exemplo": "valor"}'
                        rows={4}
                        required
                      />
                    ) : (
                      <Input
                        id="value"
                        type={newSetting.type === 'number' ? 'number' : 'text'}
                        value={newSetting.value}
                        onChange={(e) => setNewSetting(prev => ({ ...prev, value: e.target.value }))}
                        placeholder="Valor da configuração"
                        required
                      />
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingSetting(null);
                        setNewSetting({ key: "", type: "string", value: "" });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingSetting ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : settings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma configuração encontrada
            </div>
          ) : (
            <div className="grid gap-4">
              {settings.map((setting) => (
                <div
                  key={setting.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{setting.key}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        Tipo: {setting.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(setting)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSetting(setting.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Valor:</label>
                    <div className="bg-muted p-2 rounded text-sm font-mono">
                      {getSettingValue(setting)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};