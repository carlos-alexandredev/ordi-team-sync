import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Servicos = () => {
  const [services] = useState([
    { id: 1, name: "CABEAMENTO ESTRUTURADO" },
    { id: 2, name: "CERTIFICACAO DE CABEAMENTO DE FIBRA OPTICA" },
    { id: 3, name: "Configuração Controle Portão" },
    { id: 4, name: "Configuração DVR" },
    { id: 5, name: "CONTRATO MANUTENÇÃO MENSAL" },
    { id: 6, name: "Execução de projeto" },
    { id: 7, name: "EXECUÇÃO DE PROJETO DE RÁDIO" },
    { id: 8, name: "FIBRA ÓPTICA - SERVIÇOS DE FUSÃO EM FIBRA ÓPTICA SM E MM" }
  ]);

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "gestor"]}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Serviços</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700">
                Tutorial
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar serviço
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
                    <TableHead>Serviço</TableHead>
                    <TableHead className="text-center">Remover</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <span className="text-blue-600">{service.name}</span>
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

            <div className="text-sm text-gray-600">
              Mostrando de 1 até {services.length} de {services.length} registros
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Servicos;