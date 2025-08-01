import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Phone, Mail, MapPin, Edit, Trash2 } from "lucide-react";
import { SupplierFormModal } from "./SupplierFormModal";

// Mock data - será substituído por dados reais do Supabase
const mockSuppliers = [
  {
    id: "1",
    name: "TechnoSupply Ltda",
    cnpj: "12.345.678/0001-90",
    contact_name: "João Silva",
    email: "contato@technosupply.com",
    phone: "(11) 9999-8888",
    address: "Rua das Indústrias, 123 - São Paulo/SP",
    services: ["Peças", "Manutenção", "Consultoria"],
    status: "ativo",
    created_at: "2024-01-15"
  },
  {
    id: "2", 
    name: "Equipamentos Pro",
    cnpj: "98.765.432/0001-10",
    contact_name: "Maria Santos",
    email: "vendas@equipamentospro.com",
    phone: "(11) 8888-7777",
    address: "Av. Industrial, 456 - São Paulo/SP",
    services: ["Equipamentos", "Instalação"],
    status: "ativo",
    created_at: "2024-02-10"
  }
];

export function SuppliersList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const handleEdit = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDelete = (supplierId: string) => {
    if (confirm("Tem certeza que deseja excluir este fornecedor?")) {
      // Implementar exclusão
      console.log("Excluir fornecedor:", supplierId);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground">
            Gerencie os fornecedores da empresa
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockSuppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {supplier.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    CNPJ: {supplier.cnpj}
                  </p>
                </div>
                <Badge variant={supplier.status === "ativo" ? "default" : "secondary"}>
                  {supplier.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {supplier.phone}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {supplier.email}
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="line-clamp-2">{supplier.address}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Serviços:</p>
                <div className="flex flex-wrap gap-1">
                  {supplier.services.map((service) => (
                    <Badge key={service} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(supplier)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(supplier.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSupplier(null);
        }}
        supplier={selectedSupplier}
      />
    </div>
  );
}