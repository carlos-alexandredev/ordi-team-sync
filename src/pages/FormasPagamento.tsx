import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal } from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FormasPagamento = () => {
  const [paymentMethods] = useState([
    { id: 1, description: "PIX - CNPJ: 35.731.083/0001-73" },
    { id: 2, description: "Dinheiro" },
    { id: 3, description: "Cartão de crédito" }
  ]);

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "gestor"]}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Formas de pagamentos</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700">
                Tutorial
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar forma de pagamento
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
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <span className="text-blue-600">{method.description}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando de 1 até 3 de 3 registros
              </div>
              <div className="flex space-x-1">
                <Button variant="outline" size="sm" disabled>Anterior</Button>
                <Button variant="default" size="sm" className="bg-blue-600">1</Button>
                <Button variant="outline" size="sm" disabled>Próximo</Button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default FormasPagamento;