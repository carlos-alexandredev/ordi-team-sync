import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Upload, MoreHorizontal } from "lucide-react";
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

const Produtos = () => {
  const [products] = useState([
    {
      id: 1,
      name: "ADAPTADOR ACOPLADOR PASSANTE LC DUPLEX",
      image: "/placeholder.svg",
      minStock: 5,
      availableStock: 6,
      value: "R$ 0,50"
    },
    {
      id: 2,
      name: "ADAPTADOR ACOPLADOR PASSANTE SC APC",
      image: "/placeholder.svg",
      minStock: 5,
      availableStock: 6,
      value: "R$ 0,50"
    },
    {
      id: 3,
      name: "ADAPTADOR ACOPLADOR PASSANTE SC UPC",
      image: "/placeholder.svg",
      minStock: 5,
      availableStock: 16,
      value: "R$ 0,50"
    },
    {
      id: 4,
      name: "BARREIRA RETANG ALUM LED 5,00MT ALUM NAT BARRIER",
      image: "/placeholder.svg",
      minStock: 0,
      availableStock: 1,
      value: "R$ 1.355,00"
    }
  ]);

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "gestor"]}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Produtos</h1>
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
                Filtro
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-teal-600 text-white hover:bg-teal-700">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Mais Ações
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload de produtos
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4 mr-2" />
                    Exportar relatório detalhado de movimentação de estoque
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4 mr-2" />
                    Exportar relatório de estoque por colaborador
                    <Badge className="ml-2 bg-blue-600">Novo</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4 mr-2" />
                    Exportar produtos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar produto
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
                  <TableHead className="text-center">Estoque mínimo</TableHead>
                  <TableHead className="text-center">Estoque disponível</TableHead>
                  <TableHead className="text-center">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded bg-blue-100"
                        />
                        <span className="text-blue-600">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={product.minStock === 0 ? "text-red-500" : ""}>
                        {product.minStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {product.availableStock}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Produtos;