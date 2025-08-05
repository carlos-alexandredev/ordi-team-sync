import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, X } from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TiposTarefas = () => {
  const [showModal, setShowModal] = useState(false);
  const [taskTypes] = useState([
    { id: "137546", name: "Atendimento de Emergência" },
    { id: "136682", name: "Instalação Nova" },
    { id: "136679", name: "Manutenção Corretiva" },
    { id: "136680", name: "Manutenção Preventiva" },
    { id: "136681", name: "Visita para Orçamento" },
    { id: "136683", name: "Visita técnica" },
  ]);

  const TaskTypeModal = () => (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-purple-600">Adicionar tipo de tarefa</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="type" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="type">Tipo de tarefa</TabsTrigger>
            <TabsTrigger value="requirements">Obrigatoriedades</TabsTrigger>
          </TabsList>

          <TabsContent value="type" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    placeholder="Digite a descrição"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tolerance">Tempo de tolerância</Label>
                    <Input
                      id="tolerance"
                      placeholder="00:00"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Horas e minutos</p>
                  </div>
                  <div>
                    <Label htmlFor="estimated">Tempo estimado de duração</Label>
                    <Input
                      id="estimated"
                      placeholder="00:00"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Horas e minutos</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="questionnaire">Questionário padrão</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione um questionário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="q1">Questionário 1</SelectItem>
                      <SelectItem value="q2">Questionário 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="survey" />
                  <Label htmlFor="survey">Enviar pesquisa de satisfação por email</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="status">Status</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Ativo</span>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="kmTracking">Contabilizar Km rodado</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Ativo</span>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6 mt-6">
            <div>
              <p className="text-sm mb-4">Tornar obrigatório, nesse tipo de tarefa</p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="fillReport" />
                    <Label htmlFor="fillReport">Preencher o relatório</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="signature" />
                    <Label htmlFor="signature">Colher assinatura</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="photos" />
                    <Label htmlFor="photos">Colher fotos</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="questionnaire2" />
                    <Label htmlFor="questionnaire2">Questionário</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="fillKm" />
                    <Label htmlFor="fillKm">Preencher km rodado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sendDigitalOS" />
                    <Label htmlFor="sendDigitalOS">Enviar OS digital por e-mail</Label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowModal(false)}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "gestor"]}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Gerenciar tipos de tarefa</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700">
                Tutorial
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar tipo de tarefa
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Input 
              placeholder="Pesquisar" 
              className="max-w-md"
            />

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo de tarefa</TableHead>
                    <TableHead className="text-center">Remover</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskTypes.map((taskType) => (
                    <TableRow key={taskType.id}>
                      <TableCell className="font-mono">{taskType.id}</TableCell>
                      <TableCell>
                        <button className="text-blue-600 hover:underline text-left">
                          {taskType.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando de 1 até 6 de 6 registros
              </div>
              <div className="flex space-x-1">
                <Button variant="outline" size="sm" disabled>Anterior</Button>
                <Button variant="default" size="sm" className="bg-blue-600">1</Button>
                <Button variant="outline" size="sm" disabled>Próximo</Button>
              </div>
            </div>
          </div>

          <TaskTypeModal />
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default TiposTarefas;