import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit2, UserX, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientFormModal } from "./ClientFormModal";

interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  company_id?: string;
  active: boolean;
  created_at: string;
  companies?: {
    id: string;
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

export function ClientsList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchClients();
  }, [searchTerm, statusFilter, companyFilter]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("active", true)
        .order("name");

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar empresas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchClients = async () => {
    try {
      let query = supabase
        .from("profiles")
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq("role", "cliente_final")
        .order("name");

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      if (statusFilter) {
        query = query.eq("active", statusFilter === "active");
      }

      if (companyFilter) {
        query = query.eq("company_id", companyFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client: Client) => {
    console.log("handleEdit clicked - client:", client);
    setEditingClient(client);
    setIsModalOpen(true);
    console.log("Modal should be open now, editingClient:", client);
  };

  const handleToggleStatus = async (client: Client) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ active: !client.active })
        .eq("id", client.id);

      if (error) throw error;

      toast({
        title: client.active ? "Cliente desativado" : "Cliente ativado",
        description: `${client.name} foi ${client.active ? "desativado" : "ativado"} com sucesso.`,
      });

      fetchClients();
    } catch (error: any) {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    fetchClients();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os clientes cadastrados no sistema
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-filter">Empresa</Label>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as empresas</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">Nenhum cliente encontrado.</p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar primeiro cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes ({clients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4">
              {clients.map((client) => (
                <Card key={client.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <h3 className="font-medium truncate">{client.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                        {client.phone && (
                          <p className="text-sm text-muted-foreground">{client.phone}</p>
                        )}
                      </div>
                      <Badge variant={client.active ? "default" : "secondary"}>
                        {client.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    
                    {client.companies?.name && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Empresa: </span>
                        <span>{client.companies.name}</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                        className="flex-1"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant={client.active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleStatus(client)}
                        className="flex-1"
                      >
                        {client.active ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone || "-"}</TableCell>
                      <TableCell>{client.companies?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={client.active ? "default" : "secondary"}>
                          {client.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(client)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(client)}
                          >
                            {client.active ? (
                              <UserX className="h-4 w-4 text-destructive" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {isModalOpen && (
        <ClientFormModal
          open={isModalOpen}
          onClose={handleModalClose}
          client={editingClient}
          companies={companies}
        />
      )}
    </div>
  );
}