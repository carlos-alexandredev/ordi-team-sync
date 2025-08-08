import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building, Wrench, FileText, Settings, ClipboardList, BarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const cadastrosModules = [
  {
    category: "Colaboradores",
    modules: [
      {
        title: "Colaboradores",
        description: "Gerenciar colaboradores do sistema",
        icon: Users,
        url: "/users",
        color: "bg-blue-500"
      },
      {
        title: "Equipes",
        description: "Organizar equipes de trabalho",
        icon: Users,
        url: "/equipes",
        color: "bg-green-500"
      }
    ]
  },
  {
    category: "Clientes e Fornecedores",
    modules: [
      {
        title: "Clientes",
        description: "Gerenciar cadastro de clientes",
        icon: Users,
        url: "/clients",
        color: "bg-purple-500"
      },
      {
        title: "Fornecedores",
        description: "Gerenciar fornecedores e empresas",
        icon: Building,
        url: "/companies",
        color: "bg-orange-500"
      },
      {
        title: "Grupos de Clientes",
        description: "Organizar clientes em grupos",
        icon: Building,
        url: "/grupos-clientes",
        color: "bg-cyan-500"
      }
    ]
  },
  {
    category: "Inventário e Serviços",
    modules: [
      {
        title: "Equipamentos",
        description: "Controle de equipamentos",
        icon: Wrench,
        url: "/equipments",
        color: "bg-red-500"
      },
      {
        title: "Produtos",
        description: "Catálogo de produtos",
        icon: FileText,
        url: "/produtos",
        color: "bg-indigo-500"
      },
      {
        title: "Serviços",
        description: "Catálogo de serviços",
        icon: Settings,
        url: "/servicos",
        color: "bg-yellow-500"
      },
      {
        title: "Formas de Pagamento",
        description: "Métodos de pagamento",
        icon: FileText,
        url: "/formas-pagamento",
        color: "bg-pink-500"
      }
    ]
  },
  {
    category: "Tarefas e Questionários",
    modules: [
      {
        title: "Tipos de Tarefas",
        description: "Categorias de tarefas",
        icon: ClipboardList,
        url: "/tipos-tarefas",
        color: "bg-teal-500"
      },
      {
        title: "Questionários",
        description: "Formulários e questionários",
        icon: FileText,
        url: "/questionarios",
        color: "bg-amber-500"
      },
      {
        title: "Pesquisa de Satisfação",
        description: "Avaliações de satisfação",
        icon: BarChart,
        url: "/pesquisa-satisfacao",
        color: "bg-emerald-500"
      }
    ]
  }
];

const Cadastros = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "admin_cliente", "gestor"]}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Cadastros</h1>
              <p className="text-muted-foreground">
                Central de gerenciamento de todos os cadastros do sistema
              </p>
            </div>
          </div>

          {cadastrosModules.map((category) => (
            <div key={category.category} className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                {category.category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Card key={module.title} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${module.color} text-white`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{module.title}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-4">
                          {module.description}
                        </CardDescription>
                        <Button 
                          onClick={() => navigate(module.url)}
                          className="w-full"
                          variant="outline"
                        >
                          Acessar
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Cadastros;