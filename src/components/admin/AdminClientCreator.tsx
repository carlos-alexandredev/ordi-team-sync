import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Building2, User, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CompanyData {
  name: string;
  fantasy_name: string;
  cnpj: string;
  responsible_name: string;
  phone: string;
  email: string;
  address: string;
}

interface AdminData {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export function AdminClientCreator() {
  const [currentStep, setCurrentStep] = useState<'company' | 'admin'>('company');
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    fantasy_name: '',
    cnpj: '',
    responsible_name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [adminData, setAdminData] = useState<AdminData>({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const { toast } = useToast();

  const formatCNPJ = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const validateCNPJ = (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.length === 14;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCompanyNext = () => {
    // Validar dados da empresa
    if (!companyData.name || !companyData.cnpj || !companyData.responsible_name || !companyData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (!validateCNPJ(companyData.cnpj)) {
      toast({
        title: "CNPJ inválido",
        description: "O CNPJ deve ter 14 dígitos.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(companyData.email)) {
      toast({
        title: "Email inválido",
        description: "Digite um email válido.",
        variant: "destructive"
      });
      return;
    }

    setCurrentStep('admin');
  };

  const handleSubmit = async () => {
    // Validar dados do admin
    if (!adminData.name || !adminData.email || !adminData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(adminData.email)) {
      toast({
        title: "Email inválido",
        description: "Digite um email válido.",
        variant: "destructive"
      });
      return;
    }

    if (adminData.password.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-client', {
        body: {
          company: companyData,
          admin: adminData
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        // Extract more detailed error from the function response
        let errorMessage = 'Failed to create client';
        if (error.message) {
          try {
            const parsed = JSON.parse(error.message);
            errorMessage = parsed.error || error.message;
          } catch {
            errorMessage = error.message;
          }
        }
        throw new Error(errorMessage);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Cliente criado com sucesso!",
        description: `Empresa: ${companyData.name} | Admin: ${adminData.name}`
      });

      // Reset form
      setCompanyData({
        name: '',
        fantasy_name: '',
        cnpj: '',
        responsible_name: '',
        phone: '',
        email: '',
        address: ''
      });
      setAdminData({
        name: '',
        email: '',
        password: '',
        phone: ''
      });
      setCurrentStep('company');

    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      toast({
        title: "Erro ao criar cliente",
        description: error.message || "Erro interno do servidor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Criar Novo Cliente</h2>
          <p className="text-muted-foreground">
            Configure empresa e administrador do cliente
          </p>
        </div>
        <Progress value={currentStep === 'company' ? 50 : 100} className="w-32" />
      </div>

      <Tabs value={currentStep} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value="company" 
            className="flex items-center gap-2"
            disabled={loading}
          >
            <Building2 className="h-4 w-4" />
            Empresa
            {currentStep === 'admin' && <Check className="h-4 w-4 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger 
            value="admin" 
            className="flex items-center gap-2"
            disabled={currentStep === 'company'}
          >
            <User className="h-4 w-4" />
            Administrador
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados da Empresa
              </CardTitle>
              <CardDescription>
                Informe os dados da empresa do cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="company-name">Nome da Empresa *</Label>
                  <Input
                    id="company-name"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                    placeholder="Empresa LTDA"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="fantasy-name">Nome Fantasia</Label>
                  <Input
                    id="fantasy-name"
                    value={companyData.fantasy_name}
                    onChange={(e) => setCompanyData({...companyData, fantasy_name: e.target.value})}
                    placeholder="Empresa"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={companyData.cnpj}
                    onChange={(e) => setCompanyData({...companyData, cnpj: formatCNPJ(e.target.value)})}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="responsible">Responsável *</Label>
                  <Input
                    id="responsible"
                    value={companyData.responsible_name}
                    onChange={(e) => setCompanyData({...companyData, responsible_name: e.target.value})}
                    placeholder="Nome do responsável"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="company-phone">Telefone</Label>
                  <Input
                    id="company-phone"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData({...companyData, phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="company-email">Email *</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({...companyData, email: e.target.value})}
                    placeholder="empresa@exemplo.com"
                    disabled={loading}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    value={companyData.address}
                    onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
                    placeholder="Endereço completo da empresa"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleCompanyNext} disabled={loading}>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Administrador do Cliente
              </CardTitle>
              <CardDescription>
                Configure o usuário administrador da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="admin-name">Nome Completo *</Label>
                  <Input
                    id="admin-name"
                    value={adminData.name}
                    onChange={(e) => setAdminData({...adminData, name: e.target.value})}
                    placeholder="João Silva"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="admin-phone">Telefone</Label>
                  <Input
                    id="admin-phone"
                    value={adminData.phone}
                    onChange={(e) => setAdminData({...adminData, phone: e.target.value})}
                    placeholder="(11) 99999-9999"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="admin-email">Email *</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminData.email}
                    onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                    placeholder="admin@empresa.com"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="admin-password">Senha *</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={adminData.password}
                    onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                    placeholder="Mínimo 8 caracteres"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('company')}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Criar Cliente
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}