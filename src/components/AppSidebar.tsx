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
    // Itens base estáticos (sem duplicação de cadastros)
    const baseItems = [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Chamados", url: "/calls", icon: FileText },
      { title: "Ordens", url: "/orders", icon: ClipboardList },
      { title: "Clientes", url: "/clients", icon: UserCheck },
      { title: "Equipamentos", url: "/equipments", icon: Wrench },
      { title: "Operação", url: "/operacao", icon: Settings }
    ];

    let menuItems = [...baseItems];

    // Adiciona módulos dinâmicos quando carregou e evita duplicação
    if (!loading && modules.length > 0) {
      const dynamicItems = modules
        .filter(module => module.is_allowed)
        .filter(module => !baseItems.some(base => base.url === module.module_url)) // Evita duplicação
        .filter(module => module.module_url !== '/cadastros') // Remove cadastros duplicado
        .map((module) => ({
          title: module.module_title,
          url: module.module_url,
          icon: getIcon(module.module_icon),
        }));
      
      menuItems.push(...dynamicItems);
    }


    // Admin master sempre tem acesso às configurações
    if (userRole === 'admin_master') {
      menuItems.push({
        title: "Configurações",
        url: "/settings",
        icon: Settings,
      });
    }

    return menuItems;
  };

  const menuItems = getMenuItems();
  const isExpanded = menuItems.some((item) => isActive(item.url));

  // Verificar se cadastros está ativo
  const isCadastrosActive = isActive("/cadastros");

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
              
              {/* Módulo Cadastros - Botão simples */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  className={getNavCls(isCadastrosActive)}
                >
                  <NavLink to="/cadastros" end>
                    <Database className="h-4 w-4" />
                    {state !== "collapsed" && <span>Cadastros</span>}
                  </NavLink>
                </SidebarMenuButton>
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