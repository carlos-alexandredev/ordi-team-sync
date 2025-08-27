import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OperationType {
  id: string;
  name: string;
  standard_time: number;
  standard_cost: number;
  created_at: string;
}

export const MaintenanceSettings = () => {
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newType, setNewType] = useState({
    name: "",
    standard_time: 0,
    standard_cost: 0
  });
  const { toast } = useToast();

  const loadOperationTypes = async () => {
    try {
      setLoading(true);
      // Como não temos a tabela operation_types ainda, vamos simular dados
      const mockData: OperationType[] = [
        {
          id: "1",
          name: "Inspeção Visual",
          standard_time: 30,
          standard_cost: 50,
          created_at: new Date().toISOString()
        },
        {
          id: "2", 
          name: "Lubrificação",
          standard_time: 45,
          standard_cost: 75,
          created_at: new Date().toISOString()
        },
        {
          id: "3",
          name: "Substituição de Peça",
          standard_time: 120,
          standard_cost: 200,
          created_at: new Date().toISOString()
        },
        {
          id: "4",
          name: "Balanceamento",
          standard_time: 90,
          standard_cost: 150,
          created_at: new Date().toISOString()
        },
        {
          id: "5",
          name: "Soldagem",
          standard_time: 180,
          standard_cost: 300,
          created_at: new Date().toISOString()
        }
      ];
      
      setOperationTypes(mockData);
    } catch (error) {
      console.error("Erro ao carregar tipos de operação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tipos de operação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperationTypes();
  }, []);

  const handleAddType = async () => {
    if (!newType.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da operação é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simular adição
      const mockNewType: OperationType = {
        id: Date.now().toString(),
        name: newType.name,
        standard_time: newType.standard_time,
        standard_cost: newType.standard_cost,
        created_at: new Date().toISOString()
      };

      setOperationTypes(prev => [...prev, mockNewType]);
      setNewType({ name: "", standard_time: 0, standard_cost: 0 });
      
      toast({
        title: "Sucesso",
        description: "Tipo de operação adicionado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao adicionar tipo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o tipo de operação",
        variant: "destructive",
      });
    }
  };

  const handleDeleteType = async (id: string) => {
    try {
      setOperationTypes(prev => prev.filter(type => type.id !== id));
      toast({
        title: "Sucesso",
        description: "Tipo de operação removido com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover tipo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o tipo de operação",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-2xl font-bold">Configurações de Manutenção</h2>
      </div>

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="operations">Tipos de Operação</TabsTrigger>
          <TabsTrigger value="sla">Regras de SLA</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-6">
          {/* Formulário para adicionar novo tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Adicionar Tipo de Operação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Operação</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Inspeção, Lubrificação..."
                    value={newType.name}
                    onChange={(e) => setNewType(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Tempo Padrão (min)</Label>
                  <Input
                    id="time"
                    type="number"
                    placeholder="60"
                    value={newType.standard_time}
                    onChange={(e) => setNewType(prev => ({ ...prev, standard_time: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Custo Padrão (R$)</Label>
                  <Input
                    id="cost"
                    type="number"
                    placeholder="100"
                    value={newType.standard_cost}
                    onChange={(e) => setNewType(prev => ({ ...prev, standard_cost: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddType} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de tipos existentes */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Operação Cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tempo Padrão (min)</TableHead>
                    <TableHead>Custo Padrão (R$)</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operationTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.standard_time}</TableCell>
                      <TableCell>R$ {type.standard_cost.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Implementar edição
                              toast({
                                title: "Em desenvolvimento",
                                description: "Funcionalidade de edição será implementada em breve",
                              });
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteType(type.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regras de SLA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="response-time">Tempo de Resposta (horas)</Label>
                    <Input
                      id="response-time"
                      type="number"
                      placeholder="2"
                      defaultValue="2"
                    />
                    <p className="text-sm text-muted-foreground">
                      Tempo máximo para iniciar uma ordem de manutenção
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="completion-time">Tempo de Conclusão (horas)</Label>
                    <Input
                      id="completion-time"
                      type="number"
                      placeholder="24"
                      defaultValue="24"
                    />
                    <p className="text-sm text-muted-foreground">
                      Tempo máximo para concluir uma ordem de manutenção
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="escalation-time">Tempo de Escalonamento (horas)</Label>
                    <Input
                      id="escalation-time"
                      type="number"
                      placeholder="4"
                      defaultValue="4"
                    />
                    <p className="text-sm text-muted-foreground">
                      Tempo para escalonar ordem em atraso
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sla-target">Meta de SLA (%)</Label>
                    <Input
                      id="sla-target"
                      type="number"
                      placeholder="80"
                      defaultValue="80"
                    />
                    <p className="text-sm text-muted-foreground">
                      Percentual mínimo de cumprimento do SLA
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button>
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};