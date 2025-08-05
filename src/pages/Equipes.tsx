import { useState } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Equipes = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [teams] = useState([
    { id: 1, name: "Equipe Alpha", description: "Equipe de instalação", members: 5 },
    { id: 2, name: "Equipe Beta", description: "Equipe de manutenção", members: 3 },
    { id: 3, name: "Equipe Gamma", description: "Equipe de suporte", members: 4 },
  ]);

  const TeamForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentView('list')}
            className="text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Adicionar equipe
          </Button>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          Salvar equipe
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamName">Descrição da equipe *</Label>
                <Textarea
                  id="teamName"
                  placeholder="Digite a descrição da equipe"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="managers">Gestores da equipe</Label>
                <Textarea
                  id="managers"
                  placeholder="Selecione os gestores"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-600">Usuários da equipe</h3>
                <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar colaborador
                </Button>
              </div>

              <Input 
                placeholder="Pesquisar" 
                className="w-full"
              />

              <div className="space-y-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead className="text-center">Remover</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-blue-600">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="text-sm text-gray-600">
                Mostrando 0 até 0 de 0 registros
              </div>

              <div className="flex justify-between">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Próximo
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const TeamList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gerenciar equipes</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700">
            Tutorial
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setCurrentView('create')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar equipe
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Input 
          placeholder="Pesquisar equipes" 
          className="max-w-md"
        />

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Equipe</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <button 
                      className="text-blue-600 hover:underline text-left"
                      onClick={() => setCurrentView('edit')}
                    >
                      {team.name}
                    </button>
                  </TableCell>
                  <TableCell>{team.description}</TableCell>
                  <TableCell>{team.members}</TableCell>
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
          Mostrando de 1 até {teams.length} de {teams.length} registros
        </div>
      </div>
    </div>
  );

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "gestor"]}>
        {currentView === 'list' && <TeamList />}
        {(currentView === 'create' || currentView === 'edit') && <TeamForm />}
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Equipes;