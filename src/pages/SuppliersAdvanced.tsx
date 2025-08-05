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
import { Checkbox } from "@/components/ui/checkbox";
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

const SuppliersAdvanced = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [suppliers] = useState([
    {
      id: 1,
      name: "COMBUSTÍVEL",
      cnpj: "36.743.879/0001-09",
      phone: "",
      email: "",
      status: "Ativo"
    },
    {
      id: 2,
      name: "GS REFEIÇÕES",
      cnpj: "02.208.109/0001-44",
      phone: "",
      email: "",
      status: "Ativo"
    },
    {
      id: 3,
      name: "TALENTUS 4: ESCRITÓRIO VIRTUAL",
      cnpj: "43.878.077/0001-71",
      phone: "",
      email: "",
      status: "Ativo"
    },
    {
      id: 4,
      name: "IMPERIAL TECNOLOGIA",
      cnpj: "16.689.857/0001-09",
      phone: "",
      email: "",
      status: "Ativo"
    },
    {
      id: 5,
      name: "RECEITA FEDERAL",
      cnpj: "00.394.460/0058-87",
      phone: "",
      email: "",
      status: "Ativo"
    },
    {
      id: 6,
      name: "Nubank",
      cnpj: "18.236.120/0001-58",
      phone: "",
      email: "",
      status: "Ativo"
    },
    {
      id: 7,
      name: "MARKTEC",
      cnpj: "14.877.896/0001-04",
      phone: "",
      email: "",
      status: "Ativo"
    }
  ]);

  const SupplierForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('list')}
            className="text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Adicionar fornecedor
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            Salvar fornecedor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-6 text-center">
            <div className="space-y-4">
              <div className="w-24 h-24 mx-auto bg-teal-600 rounded-lg flex items-center justify-center">
                <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
                  <span className="text-teal-600 text-2xl">🤝</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <div className="relative">
                    <Input id="name" className="pr-8" />
                    <X className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cnpj">CPF/CNPJ *</Label>
                  <div className="relative">
                    <Input id="cnpj" className="pr-8" />
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
                  <Label htmlFor="codigo">Código Externo</Label>
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
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="annotations">Anotações</TabsTrigger>
              <TabsTrigger value="attachments">Anexos</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <Card className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-blue-600">Telefone corporativo</Label>
                    <Input placeholder="Adicione" />
                  </div>

                  <div>
                    <Label className="text-blue-600">E-mail corporativo</Label>
                    <Input placeholder="Adicione" />
                  </div>

                  <div>
                    <Label className="text-blue-600">Falar com</Label>
                    <Input />
                  </div>

                  <div>
                    <Label className="text-blue-600">Segmento</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tech">Tecnologia</SelectItem>
                        <SelectItem value="services">Serviços</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label className="text-blue-600">Endereço fornecedor</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Input placeholder="Adicione o CEP" />
                        <p className="text-xs text-gray-500 mt-1">CEP</p>
                      </div>
                      <div>
                        <Input placeholder="Logradouro" />
                        <p className="text-xs text-gray-500 mt-1">Logradouro</p>
                      </div>
                      <div>
                        <Input placeholder="Número" />
                        <p className="text-xs text-gray-500 mt-1">Número</p>
                      </div>
                      <div>
                        <Input placeholder="Complemento" />
                        <p className="text-xs text-gray-500 mt-1">Complemento</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="annotations" className="mt-6">
              <Card className="p-6">
                <div className="text-center text-gray-500">
                  Anotações em desenvolvimento
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="attachments" className="mt-6">
              <Card className="p-6">
                <div className="text-center text-gray-500">
                  Anexos em desenvolvimento
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );

  const SupplierList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gerenciar fornecedores</h1>
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
              <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Mais ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Importar fornecedores
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Exportar fornecedores
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setCurrentView('create')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar fornecedor
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
                <TableHead>Fornecedores</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <button 
                      className="text-blue-600 hover:underline text-left"
                      onClick={() => setCurrentView('edit')}
                    >
                      {supplier.name}
                    </button>
                  </TableCell>
                  <TableCell>{supplier.cnpj}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.status}</TableCell>
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
        {currentView === 'list' && <SupplierList />}
        {(currentView === 'create' || currentView === 'edit') && <SupplierForm />}
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default SuppliersAdvanced;