import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Calculator } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ValuesTabProps {
  form: UseFormReturn<any>;
}

interface ProductService {
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface AdditionalCost {
  description: string;
  value: number;
}

export function ValuesTab({ form }: ValuesTabProps) {
  const [newProduct, setNewProduct] = useState<ProductService>({
    name: "", quantity: 1, unitPrice: 0, discount: 0, total: 0
  });
  const [newService, setNewService] = useState<ProductService>({
    name: "", quantity: 1, unitPrice: 0, discount: 0, total: 0
  });
  const [newCost, setNewCost] = useState<AdditionalCost>({
    description: "", value: 0
  });

  const products: ProductService[] = form.watch("products") || [];
  const services: ProductService[] = form.watch("services") || [];
  const additionalCosts: AdditionalCost[] = form.watch("additionalCosts") || [];
  const globalDiscount = form.watch("globalDiscount") || 0;

  const calculateItemTotal = (quantity: number, unitPrice: number, discount: number) => {
    const subtotal = quantity * unitPrice;
    return subtotal - discount;
  };

  const addProduct = () => {
    if (!newProduct.name || newProduct.unitPrice <= 0) return;
    
    const total = calculateItemTotal(newProduct.quantity, newProduct.unitPrice, newProduct.discount);
    const productToAdd = { ...newProduct, total };
    
    const currentProducts = form.getValues("products") || [];
    form.setValue("products", [...currentProducts, productToAdd]);
    
    setNewProduct({ name: "", quantity: 1, unitPrice: 0, discount: 0, total: 0 });
  };

  const removeProduct = (index: number) => {
    const currentProducts = form.getValues("products") || [];
    form.setValue("products", currentProducts.filter((_: any, i: number) => i !== index));
  };

  const clearAllProducts = () => {
    form.setValue("products", []);
  };

  const addService = () => {
    if (!newService.name || newService.unitPrice <= 0) return;
    
    const total = calculateItemTotal(newService.quantity, newService.unitPrice, newService.discount);
    const serviceToAdd = { ...newService, total };
    
    const currentServices = form.getValues("services") || [];
    form.setValue("services", [...currentServices, serviceToAdd]);
    
    setNewService({ name: "", quantity: 1, unitPrice: 0, discount: 0, total: 0 });
  };

  const removeService = (index: number) => {
    const currentServices = form.getValues("services") || [];
    form.setValue("services", currentServices.filter((_: any, i: number) => i !== index));
  };

  const clearAllServices = () => {
    form.setValue("services", []);
  };

  const addCost = () => {
    if (!newCost.description || newCost.value <= 0) return;
    
    const currentCosts = form.getValues("additionalCosts") || [];
    form.setValue("additionalCosts", [...currentCosts, newCost]);
    
    setNewCost({ description: "", value: 0 });
  };

  const removeCost = (index: number) => {
    const currentCosts = form.getValues("additionalCosts") || [];
    form.setValue("additionalCosts", currentCosts.filter((_: any, i: number) => i !== index));
  };

  const clearAllCosts = () => {
    form.setValue("additionalCosts", []);
  };

  // Calcular totais
  const productsTotal = products.reduce((sum, product) => sum + product.total, 0);
  const servicesTotal = services.reduce((sum, service) => sum + service.total, 0);
  const costsTotal = additionalCosts.reduce((sum, cost) => sum + cost.value, 0);
  const subtotal = productsTotal + servicesTotal + costsTotal;
  const finalTotal = subtotal - globalDiscount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Produtos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Produtos</h3>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clearAllProducts}>
              Remover Todos
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-20">Qtd</TableHead>
                <TableHead className="w-32">Valor Unit.</TableHead>
                <TableHead className="w-32">Desconto</TableHead>
                <TableHead className="w-32">Total</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={index}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>{formatCurrency(product.unitPrice)}</TableCell>
                  <TableCell>{formatCurrency(product.discount)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(product.total)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>
                  <Input
                    placeholder="Nome do produto"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, quantity: Number(e.target.value) })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.unitPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, unitPrice: Number(e.target.value) })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.discount}
                    onChange={(e) => setNewProduct({ ...newProduct, discount: Number(e.target.value) })}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(calculateItemTotal(newProduct.quantity, newProduct.unitPrice, newProduct.discount))}
                </TableCell>
                <TableCell>
                  <Button type="button" size="sm" onClick={addProduct}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <Separator />

      {/* Serviços */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Serviços</h3>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clearAllServices}>
              Remover Todos
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-20">Qtd</TableHead>
                <TableHead className="w-32">Valor Unit.</TableHead>
                <TableHead className="w-32">Desconto</TableHead>
                <TableHead className="w-32">Total</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service, index) => (
                <TableRow key={index}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{service.quantity}</TableCell>
                  <TableCell>{formatCurrency(service.unitPrice)}</TableCell>
                  <TableCell>{formatCurrency(service.discount)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(service.total)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeService(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell>
                  <Input
                    placeholder="Nome do serviço"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={newService.quantity}
                    onChange={(e) => setNewService({ ...newService, quantity: Number(e.target.value) })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newService.unitPrice}
                    onChange={(e) => setNewService({ ...newService, unitPrice: Number(e.target.value) })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newService.discount}
                    onChange={(e) => setNewService({ ...newService, discount: Number(e.target.value) })}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(calculateItemTotal(newService.quantity, newService.unitPrice, newService.discount))}
                </TableCell>
                <TableCell>
                  <Button type="button" size="sm" onClick={addService}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <Separator />

      {/* Custos Adicionais */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Custos Adicionais</h3>
          <Button type="button" variant="outline" size="sm" onClick={clearAllCosts}>
            Remover Todos
          </Button>
        </div>

        <div className="space-y-3">
          {additionalCosts.map((cost, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-1">
                <span className="font-medium">{cost.description}</span>
              </div>
              <div className="font-medium">
                {formatCurrency(cost.value)}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCost(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex gap-3 p-3 border rounded-lg bg-muted/50">
            <Input
              placeholder="Descrição do custo"
              value={newCost.description}
              onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
              className="flex-1"
            />
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={newCost.value}
              onChange={(e) => setNewCost({ ...newCost, value: Number(e.target.value) })}
              className="w-32"
            />
            <Button type="button" onClick={addCost}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Resumo Geral */}
      <div className="bg-muted/50 p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5" />
          <h3 className="text-lg font-medium">Resumo Geral</h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Total de Produtos:</span>
            <span className="font-medium">{formatCurrency(productsTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total de Serviços:</span>
            <span className="font-medium">{formatCurrency(servicesTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total de Custos Adicionais:</span>
            <span className="font-medium">{formatCurrency(costsTotal)}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Desconto Global:</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                max={subtotal}
                value={globalDiscount}
                onChange={(e) => form.setValue("globalDiscount", Number(e.target.value))}
                className="w-32"
              />
            </div>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Valor Total Final:</span>
            <span className="text-primary">{formatCurrency(finalTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}