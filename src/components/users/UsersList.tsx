import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserFormModal } from "./UserFormModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id?: string;
  companies?: {
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      console.log("UsersList: Iniciando busca de usuários...");
      let query = supabase
        .from("profiles")
        .select(`
          id,
          name,
          email,
          role,
          company_id,
          companies:company_id (
            name
          )
        `);

      if (searchName) {
        query = query.ilike("name", `%${searchName}%`);
      }
      if (filterRole) {
        query = query.eq("role", filterRole);
      }
      if (filterCompany) {
        query = query.eq("company_id", filterCompany);
      }

      console.log("UsersList: Executando query...");
      const { data, error } = await query;
      console.log("UsersList: Resultado da query:", { data, error });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("UsersList: Erro ao carregar usuários:", error);
      toast({
        title: "Erro",
        description: `Erro ao carregar usuários: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("active", true);

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchUsers(), fetchCompanies()]);
      setLoading(false);
    };
    loadData();
  }, [searchName, filterRole, filterCompany]);

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
      });
      
      fetchUsers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin_master: { label: "Admin Master", className: "bg-purple-100 text-purple-800 border-purple-300" },
      admin: { label: "Admin", className: "bg-red-100 text-red-800 border-red-300" },
      admin_cliente: { label: "Admin Cliente", className: "bg-orange-100 text-orange-800 border-orange-300" },
      gestor: { label: "Gestor", className: "bg-indigo-100 text-indigo-800 border-indigo-300" },
      tecnico: { label: "Técnico", className: "bg-blue-100 text-blue-800 border-blue-300" },
      cliente_final: { label: "Cliente Final", className: "bg-green-100 text-green-800 border-green-300" }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || { 
      label: role, 
      className: "bg-gray-100 text-gray-800 border-gray-300" 
    };

    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterRole || "all"} onValueChange={(value) => setFilterRole(value === "all" ? "" : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os perfis</SelectItem>
            <SelectItem value="admin_master">Admin Master</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="admin_cliente">Admin Cliente</SelectItem>
            <SelectItem value="gestor">Gestor</SelectItem>
            <SelectItem value="tecnico">Técnico</SelectItem>
            <SelectItem value="cliente_final">Cliente Final</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCompany || "all"} onValueChange={(value) => setFilterCompany(value === "all" ? "" : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          onClick={() => {
            setSearchName("");
            setFilterRole("");
            setFilterCompany("");
          }}
        >
          Limpar Filtros
        </Button>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => (
                <TableRow key={`${user.id}-${index}`}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{user.companies?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUser(user);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSuccess={() => {
          fetchUsers();
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        editingUser={editingUser}
        companies={companies}
      />
    </div>
  );
}