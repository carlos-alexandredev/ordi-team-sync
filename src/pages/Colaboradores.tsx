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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2, Upload, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Colaboradores = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [collaborators] = useState([
    { 
      id: 1, 
      name: "Bruno Alexandre", 
      phone: "bruno.ssa", 
      role: "Gestor", 
      userType: "Administrador", 
      checkIn: "Manual" 
    },
    { 
      id: 2, 
      name: "Carlos", 
      phone: "carlos.alexandress@outlook.com", 
      role: "Outro", 
      userType: "Administrador principal", 
      checkIn: "Manual" 
    },
    { 
      id: 3, 
      name: "Wagner", 
      phone: "wagner.salvador", 
      role: "Técnico", 
      userType: "Usuário", 
      checkIn: "Manual" 
    },
  ]);

  const CollaboratorForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('list')}
            className="text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Adicionar colaborador
          </Button>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          Salvar colaborador
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-6 text-center">
            <div className="space-y-4">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarImage src="" />
                <AvatarFallback className="bg-slate-600 text-white text-2xl">
                  👤
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <div className="relative">
                    <Input id="name" className="pr-8" />
                    <X className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="login">Login *</Label>
                  <div className="relative">
                    <Input id="login" className="pr-8" />
                    <X className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="role">Cargo</Label>
                  <div className="relative">
                    <Input id="role" className="pr-8" />
                    <X className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contact">Contato</Label>
                  <div className="relative">
                    <Input id="contact" className="pr-8" />
                    <X className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Input id="email" type="email" className="pr-8" />
                    <X className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="config">Configurações</TabsTrigger>
              <TabsTrigger value="notifications">Notificações</TabsTrigger>
              <TabsTrigger value="interface">Interface</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <Card className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label>Tipo de usuário *</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="admin_principal">Administrador principal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tipo de check-in</Label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Manual" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automático</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Senha *</Label>
                    <Input type="password" className="mt-1" />
                  </div>

                  <div>
                    <Label>Confirmar senha *</Label>
                    <Input type="password" className="mt-1" />
                  </div>

                  <div>
                    <Label>Valor por hora trabalhada</Label>
                    <Input className="mt-1" />
                  </div>

                  <div>
                    <Label>Valor por KM rodado</Label>
                    <Input className="mt-1" />
                  </div>
                </div>

                <div className="mt-6">
                  <Label className="text-base font-medium">Jornada de trabalho</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Intervalo de tempo em que o monitoramento estará ativo
                  </p>
                  
                  <RadioGroup defaultValue="always" className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="always" id="always" className="bg-teal-600" />
                      <Label htmlFor="always">Sempre Ativo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom">Jornada Personalizada</Label>
                    </div>
                  </RadioGroup>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="config" className="mt-6">
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-blue-600">Tarefas</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="createTasks" defaultChecked />
                          <Label htmlFor="createTasks" className="text-sm text-teal-600">
                            Pode criar tarefas
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="allTaskTypes" defaultChecked />
                          <Label htmlFor="allTaskTypes" className="text-sm text-teal-600">
                            Todos os tipos de tarefa
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="executeTasks" defaultChecked />
                          <Label htmlFor="executeTasks" className="text-sm text-teal-600">
                            Pode executar tarefas
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="pauseTasks" />
                          <Label htmlFor="pauseTasks" className="text-sm">
                            Pode pausar tarefas
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="reschedule" defaultChecked />
                          <Label htmlFor="reschedule" className="text-sm text-teal-600">
                            Pode reagendar tarefas
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="usePhotos" defaultChecked />
                          <Label htmlFor="usePhotos" className="text-sm text-teal-600">
                            Pode utilizar fotos da galeria em tarefas
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="manualCheckout" defaultChecked />
                          <Label htmlFor="manualCheckout" className="text-sm text-teal-600">
                            Pode fazer check-out manual em tarefas com pendências
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="manualCheckin" defaultChecked />
                          <Label htmlFor="manualCheckin" className="text-sm text-teal-600">
                            Pode fazer check-in manual com check-out pendente em outra tarefa
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="reportWithoutCheckin" defaultChecked />
                          <Label htmlFor="reportWithoutCheckin" className="text-sm text-teal-600">
                            Pode preencher relatório sem fazer check-in
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="manualScheduled" />
                          <Label htmlFor="manualScheduled" className="text-sm">
                            Pode fazer check-in manual em tarefas fora do dia agendado
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-blue-600">Colaboradores</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="changePointBase" defaultChecked />
                          <Label htmlFor="changePointBase" className="text-sm text-teal-600">
                            Pode alterar Ponto Base
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="addEditClients" defaultChecked />
                          <Label htmlFor="addEditClients" className="text-sm text-teal-600">
                            Pode cadastrar/editar clientes
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="viewEmailPhone" defaultChecked />
                          <Label htmlFor="viewEmailPhone" className="text-sm text-teal-600">
                            Pode visualizar e-mail e telefone dos clientes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="viewDashboard" />
                          <Label htmlFor="viewDashboard" className="text-sm">
                            Pode visualizar dashboard
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="informStartDisplacement" />
                          <Label htmlFor="informStartDisplacement" className="text-sm">
                            Habilitar opção para informar "início do deslocamento" na tarefa
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="viewProductValues" defaultChecked />
                          <Label htmlFor="viewProductValues" className="text-sm text-teal-600">
                            Pode visualizar valores de produtos
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <Card className="p-6">
                <div className="text-center text-gray-500">
                  Configurações de notificações em desenvolvimento
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="interface" className="mt-6">
              <Card className="p-6">
                <div className="text-center text-gray-500">
                  Configurações de interface em desenvolvimento
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );

  const CollaboratorList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gerenciar colaboradores</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700">
            Tutorial
          </Button>
          <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            Exportar usuários
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setCurrentView('create')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar colaborador
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
                <TableHead>Nome</TableHead>
                <TableHead>Telefone/Login</TableHead>
                <TableHead>Cargo colaborador</TableHead>
                <TableHead>Tipo de usuário</TableHead>
                <TableHead>Check in</TableHead>
                <TableHead className="text-center">Remover</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaborators.map((collaborator) => (
                <TableRow key={collaborator.id}>
                  <TableCell>
                    <button 
                      className="text-blue-600 hover:underline text-left"
                      onClick={() => setCurrentView('edit')}
                    >
                      {collaborator.name}
                    </button>
                  </TableCell>
                  <TableCell>{collaborator.phone}</TableCell>
                  <TableCell>{collaborator.role}</TableCell>
                  <TableCell>{collaborator.userType}</TableCell>
                  <TableCell>{collaborator.checkIn}</TableCell>
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

        <div className="text-sm text-gray-600">
          Mostrando de 1 até 3 de 3 registros
        </div>
      </div>
    </div>
  );

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "gestor"]}>
        {currentView === 'list' && <CollaboratorList />}
        {(currentView === 'create' || currentView === 'edit') && <CollaboratorForm />}
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Colaboradores;