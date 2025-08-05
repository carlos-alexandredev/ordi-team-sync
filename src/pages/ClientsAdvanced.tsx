import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Filter, MoreHorizontal, Upload, X } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ClientsAdvanced = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'search'>('list');
  const [clients] = useState([
    {
      id: 1,
      name: "CS PORTO - ATU 12",
      address: "Passé, Candeias - BA, 43840-000, Brasil",
      phone: "07199965835",
      responsible: "Carlos",
      email: "andre.cerqueira@outlook.com.br, johnathan.bezerra@outlook.com.br",
      status: "Ativo"
    },
    {
      id: 2,
      name: "CS PORTO - PIER",
      address: "",
      phone: "",
      responsible: "Carlos",
      email: "",
      status: "Ativo"
    },
    {
      id: 3,
      name: "Morada Flor de Lis",
      address: "Travessa Dantas, Pernambués, Salvador - BA, 41100-256, Brasil",
      phone: "71 99380-9035",
      responsible: "Carlos",
      email: "morada@morada.com",
      status: "Ativo"
    }
  ]);

  const ClientForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('list')}
            className="text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Adicionar cliente
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            Salvar cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações básicas</h3>
              
              <div>
                <Label htmlFor="name">Nome *</Label>
                <div className="relative">
                  <Input id="name" className="pr-8" />
                  <X className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <Label htmlFor="cpf">CPF / CNPJ *</Label>
                <div className="relative">
                  <Input id="cpf" className="pr-8" />
                  <X className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <Label htmlFor="razao">Razão social</Label>
                <div className="relative">
                  <Input id="razao" className="pr-8" />
                  <X className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <Label htmlFor="codigo">Código externo</Label>
                <div className="relative">
                  <Input id="codigo" className="pr-8" />
                  <X className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="status">Status</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Ativo</span>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Tabs defaultValue="observations" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="observations">Observações e anotações</TabsTrigger>
              <TabsTrigger value="address">Endereço do cliente</TabsTrigger>
              <TabsTrigger value="billing">Dados de cobrança</TabsTrigger>
            </TabsList>

            <TabsContent value="observations" className="mt-6">
              <Card className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="observation">Observação</Label>
                    <Textarea 
                      id="observation"
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="internal">Observação interna</Label>
                    <Textarea 
                      id="internal"
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="address" className="mt-6">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar endereço
                    </Button>
                  </div>
                  <div className="text-center text-gray-500 py-8">
                    Nenhum endereço cadastrado
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="mt-6">
              <Card className="p-6">
                <div className="text-center text-gray-500">
                  Dados de cobrança em desenvolvimento
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );

  const ClientSearch = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold">Pesquisar por CNPJ</h3>
              <Badge className="bg-blue-600">Novo</Badge>
            </div>
            
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <div className="flex space-x-2 mt-1">
                <Input id="cnpj" className="flex-1" />
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Buscar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Detalhes do cliente</h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-blue-600">Responsável no local (Falar com)</Label>
              <div className="relative">
                <Input className="pr-8" />
                <X className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <Label className="text-blue-600">Telefone corporativo</Label>
              <Input placeholder="Adicione" />
            </div>

            <div>
              <Label className="text-blue-600">E-mail corporativo</Label>
              <Input placeholder="Adicione" />
            </div>

            <div>
              <Label className="text-blue-600">Colaborador responsável *</Label>
              <div className="flex items-center space-x-2">
                <Badge className="bg-blue-600">Carlos - Outro</Badge>
                <X className="h-4 w-4 text-gray-400" />
              </div>
              <Input placeholder="Selecione" className="mt-1" />
            </div>

            <div>
              <Label className="text-blue-600">Equipe responsável</Label>
              <Input placeholder="Selecione" />
            </div>

            <div>
              <Label className="text-blue-600">Grupo de clientes</Label>
              <Input placeholder="Selecione" />
            </div>

            <div>
              <Label className="text-blue-600">Segmento</Label>
              <Input placeholder="Selecione" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const ClientList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gerenciar clientes</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700">
            Tutorial
          </Button>
          <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-teal-600 text-white hover:bg-teal-700">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Mais ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Upload de clientes
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Exportar clientes
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Gerenciar responsáveis
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Upload de contatos
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Exportar contatos
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Remover todos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setCurrentView('create')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar cliente
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
                <TableHead>
                  <Checkbox />
                </TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <button 
                      className="text-blue-600 hover:underline text-left"
                      onClick={() => setCurrentView('edit')}
                    >
                      {client.name}
                    </button>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{client.address}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.responsible}</TableCell>
                  <TableCell className="max-w-xs truncate">{client.email}</TableCell>
                  <TableCell>{client.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "admin_cliente"]}>
        {currentView === 'list' && <ClientList />}
        {currentView === 'search' && <ClientSearch />}
        {(currentView === 'create' || currentView === 'edit') && <ClientForm />}
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default ClientsAdvanced;