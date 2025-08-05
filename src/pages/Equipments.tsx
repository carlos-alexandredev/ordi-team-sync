import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, MoreHorizontal, Upload, Download } from "lucide-react";
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

const Equipments = () => {
  const [equipments] = useState([
    {
      id: 1,
      name: "CAM D01",
      identifier: "7827091960393213",
      association: "CS PORTO - ATU 12",
      category: "Câmera Dome",
      warranty: "Indefinido",
      status: "Ativo"
    },
    {
      id: 2,
      name: "CAM D02",
      identifier: "9799331322789564",
      association: "CS PORTO - ATU 12",
      category: "Câmera Dome",
      warranty: "Indefinido",
      status: "Ativo"
    },
    {
      id: 3,
      name: "CAM D03",
      identifier: "5909142708673636",
      association: "CS PORTO - ATU 12",
      category: "Câmera Dome",
      warranty: "Indefinido",
      status: "Ativo"
    },
    {
      id: 4,
      name: "CAM D04",
      identifier: "3977792879475013",
      association: "CS PORTO - ATU 12",
      category: "Câmera Dome",
      warranty: "Indefinido",
      status: "Ativo"
    },
    {
      id: 5,
      name: "CAM D07",
      identifier: "4665502197123404",
      association: "CS PORTO - ATU 12",
      category: "Câmera Dome",
      warranty: "Indefinido",
      status: "Ativo"
    },
    {
      id: 6,
      name: "CAM D08",
      identifier: "5100706090731063",
      association: "CS PORTO - ATU 12",
      category: "Câmera Dome",
      warranty: "Indefinido",
      status: "Ativo"
    },
    {
      id: 7,
      name: "CAM D09",
      identifier: "1026995124380542",
      association: "CS PORTO - ATU 12",
      category: "Câmera Dome",
      warranty: "Indefinido",
      status: "Ativo"
    },
    {
      id: 8,
      name: "CAM D10",
      identifier: "1668002970841333",
      association: "CS PORTO - ATU 12",
      category: "Câmera Dome",
      warranty: "Indefinido",
      status: "Ativo"
    }
  ]);

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "admin_cliente", "tecnico", "cliente_final"]}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Equipamentos</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700">
                Tutorial
              </Button>
              <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Categorias
              </Button>
              <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-teal-600 text-white hover:bg-teal-700">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Mais Ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar por planilha
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4 mr-2" />
                    Exportar por planilha
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Download de etiquetas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar equipamento
              </Button>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Associação</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Garantia Até</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipments.map((equipment) => (
                  <TableRow key={equipment.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">📷</span>
                        </div>
                        <span className="text-blue-600">{equipment.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-blue-600">{equipment.identifier}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600">🏢</span>
                        <span className="text-blue-600">{equipment.association}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-blue-600">{equipment.category}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">● {equipment.warranty}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-cyan-500 text-white hover:bg-cyan-600">
                        {equipment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando de 1 até 10 de 291 registros
            </div>
            <div className="flex space-x-1">
              <Button variant="outline" size="sm" disabled>Anterior</Button>
              <Button variant="default" size="sm" className="bg-blue-600">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">4</Button>
              <Button variant="outline" size="sm">5</Button>
              <span className="px-2">...</span>
              <Button variant="outline" size="sm">30</Button>
              <Button variant="outline" size="sm">Próximo</Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Equipments;