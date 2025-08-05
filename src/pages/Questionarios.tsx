import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Copy, Trash2, Upload } from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Questionarios = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [questionnaires] = useState([
    { id: 1, name: "Check list instalação de Alarme" },
    { id: 2, name: "Check list instalação de câmeras cftv" },
    { id: 3, name: "Check list instalação de Cerca Elétrica" },
    { id: 4, name: "Check list manutenção Alarme" },
    { id: 5, name: "Check list manutenção câmeras cftv" },
    { id: 6, name: "Check list manutenção de Cerca Elétrica" },
    { id: 7, name: "Ficha de Atendimento" },
    { id: 8, name: "Formulário de Manutenção Corretiva" },
    { id: 9, name: "Questionário - Instalação CFTV" },
  ]);

  const QuestionnaireForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('list')}
            className="text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Adicionar questionário
          </Button>
        </div>
        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova pergunta
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Questionário</h3>
                <Input placeholder="Título do questionário" />
              </div>

              <div className="flex gap-4 text-sm text-blue-600">
                <button>+ Incluir cabeçalho</button>
                <button>+ Incluir rodapé</button>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Pergunta 1</Label>
                  </div>
                  <div>
                    <Label>Tipo de Resposta</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="multiple">Múltipla Escolha</SelectItem>
                        <SelectItem value="single">Escolha Única</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="required" />
                    <Label htmlFor="required">Resposta obrigatória</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="description" />
                    <Label htmlFor="description">Descrição da pergunta</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configurações deste questionário</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="showInOS" defaultChecked />
                <Label htmlFor="showInOS" className="text-sm">
                  Exibir questionário na OS Digital
                </Label>
              </div>

              <div>
                <Label className="text-sm">Quantidade de perguntas na mesma linha</Label>
                <RadioGroup defaultValue="1" className="flex space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="q1" className="bg-blue-600" />
                    <Label htmlFor="q1">1</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="q2" />
                    <Label htmlFor="q2">2</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="q3" />
                    <Label htmlFor="q3">3</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="4" id="q4" />
                    <Label htmlFor="q4">4</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="sameLine" />
                  <Label htmlFor="sameLine" className="text-sm">
                    Exibir perguntas e respostas na mesma linha
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="showUnanswered" defaultChecked />
                  <Label htmlFor="showUnanswered" className="text-sm">
                    Exibir perguntas não respondidas no Relatório de Tarefas, OS Digital e na Central do Cliente
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="enableEquipment" />
                  <Label htmlFor="enableEquipment" className="text-sm">
                    Habilitar resposta para equipamento
                  </Label>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const QuestionnaireList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gerenciar questionários</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700">
            Tutorial
          </Button>
          <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            Importar por planilha
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setCurrentView('create')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar questionário
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
                <TableHead>Questionário</TableHead>
                <TableHead className="text-center">Remover</TableHead>
                <TableHead className="text-center">Duplicar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionnaires.map((questionnaire) => (
                <TableRow key={questionnaire.id}>
                  <TableCell>
                    <button 
                      className="text-blue-600 hover:underline text-left"
                      onClick={() => setCurrentView('edit')}
                    >
                      {questionnaire.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <div className="text-sm text-gray-600">
          Mostrando de 1 até 9 de 9 registros
        </div>
      </div>
    </div>
  );

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "gestor"]}>
        {currentView === 'list' && <QuestionnaireList />}
        {(currentView === 'create' || currentView === 'edit') && <QuestionnaireForm />}
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Questionarios;