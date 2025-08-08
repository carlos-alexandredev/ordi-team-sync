import { useState } from "react";
import { 
  FileText, 
  Users, 
  Building, 
  UserCheck, 
  ClipboardList, 
  Wrench, 
  BarChart, 
  Settings, 
  LogOut,
  Home,
  Plus,
  Shield,
  Database,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { useUserPermissions } from "@/hooks/useUserPermissions";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  userRole: string;
  onSignOut: () => void;
}

export function AppSidebar({ userRole, onSignOut }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [cadastrosOpen, setCadastrosOpen] = useState(currentPath === "/cadastros" || currentPath.startsWith("/cadastros"));
  const { modules, loading } = useUserPermissions();

  const isActive = (path: string) => currentPath === path;
  const getNavCls = (isActive: boolean) =>
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted/50";

  // Mapear ícones
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Home,
      Settings,
      Users,
      Building,
      UserCheck,
      FileText,
      ClipboardList,
      Wrench,
      BarChart,
      Shield,
    };
    return iconMap[iconName] || Settings;
  };

  // Construir itens do menu baseado nas permissões do usuário
  const getMenuItems = () => {
    // Sempre retorna itens base independente do loading
    const baseItems = [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Chamados", url: "/calls", icon: FileText },
      { title: "Ordens", url: "/orders", icon: ClipboardList },
      { title: "Clientes", url: "/clients", icon: UserCheck },
      { title: "Equipamentos", url: "/equipments", icon: Wrench },
      { title: "Relatórios", url: "/reports", icon: BarChart }
    ];

    const menuItems = [...baseItems];

    // Adiciona módulos dinâmicos quando não está carregando
    if (!loading && modules.length > 0) {
      const dynamicItems = modules
        .filter(module => module.is_allowed)
        .map((module) => ({
          title: module.module_title,
          url: module.module_url,
          icon: getIcon(module.module_icon),
        }));
      
      menuItems.push(...dynamicItems);
    }

    // Admin master sempre tem acesso ao gerenciamento de permissões
    if (userRole === 'admin_master') {
      menuItems.push({
        title: "Permissões",
        url: "/user-permissions",
        icon: Shield,
      });
    }

    return menuItems;
  };

  const menuItems = getMenuItems();
  const isExpanded = menuItems.some((item) => isActive(item.url));

  // Itens do módulo Cadastros
  const cadastrosItems = [
    {
      category: "Colaboradores",
      items: [
        { title: "Colaboradores", url: "/users", icon: Users },
        { title: "Equipes", url: "/equipes", icon: Users },
      ]
    },
    {
      category: "Clientes e Fornecedores", 
      items: [
        { title: "Clientes", url: "/clients", icon: Users },
        { title: "Fornecedores", url: "/companies", icon: Building },
        { title: "Grupos de Clientes", url: "/grupos-clientes", icon: Building },
      ]
    },
    {
      category: "Inventário e Serviços",
      items: [
        { title: "Equipamentos", url: "/equipments", icon: Wrench },
        { title: "Produtos", url: "/produtos", icon: FileText },
        { title: "Serviços", url: "/servicos", icon: Settings },
        { title: "Formas de Pagamento", url: "/formas-pagamento", icon: FileText },
      ]
    },
    {
      category: "Tarefas",
      items: [
        { title: "Tipos de Tarefas", url: "/tipos-tarefas", icon: ClipboardList },
        { title: "Questionários", url: "/questionarios", icon: FileText },
        { title: "Pesquisa de Satisfação", url: "/pesquisa-satisfacao", icon: BarChart },
      ]
    }
  ];

  // Verificar se algum item de cadastros está ativo
  const isCadastrosActive = isActive("/cadastros") || cadastrosItems.some(category => 
    category.items.some(item => isActive(item.url))
  );

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold">
            Sistema Ordi
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Menus originais baseados em permissões */}
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={getNavCls(isActive(item.url))}
                  >
                    <NavLink to={item.url} end>
                      <item.icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Módulo Cadastros */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className={getNavCls(isCadastrosActive)}
                >
                  <NavLink 
                    to="/cadastros" 
                    onClick={() => setCadastrosOpen(true)}
                    end
                  >
                    <Database className="h-4 w-4" />
                    {state !== "collapsed" && <span>Cadastros</span>}
                  </NavLink>
                </SidebarMenuButton>
                
                {cadastrosOpen && state !== "collapsed" && (
                  <SidebarMenuSub>
                    <div className="flex justify-between items-center px-3 py-1">
                      <span className="text-xs font-medium text-muted-foreground">Opções de Cadastro</span>
                      <button 
                        onClick={() => setCadastrosOpen(false)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    </div>
                    {cadastrosItems.map((category) => (
                      <div key={category.category}>
                        <div className="px-3 py-1 text-xs font-medium text-muted-foreground">
                          {category.category}
                        </div>
                        {category.items.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton 
                              asChild
                              className={getNavCls(isActive(item.url))}
                            >
                              <NavLink to={item.url} end>
                                <item.icon className="h-3 w-3" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </div>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Botão Nova Tarefa para gestores e admin_cliente */}
        {(userRole === 'admin_master' || userRole === 'gestor' || userRole === 'admin_cliente' || userRole === 'admin') && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Clicou no botão Nova Tarefa");
                      setShowTaskModal(true);
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    {state !== "collapsed" && <span>Nova Tarefa</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={onSignOut}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  {state !== "collapsed" && <span>Sair</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Modal de criação de tarefa */}
      <TaskFormModal 
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
      />
    </Sidebar>
  );
}