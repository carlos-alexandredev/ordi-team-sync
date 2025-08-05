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
  Plus
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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

  const isActive = (path: string) => currentPath === path;
  const getNavCls = (isActive: boolean) =>
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted/50";

  // Definir itens do menu baseado no role
  const getMenuItems = () => {
    const baseItems = [
      { title: "Dashboard", url: "/dashboard", icon: Home }
    ];

    if (userRole === 'admin_master') {
      return [
        ...baseItems,
        { title: "Desk", url: "/desk", icon: Settings },
        { title: "Usuários", url: "/users", icon: Users },
        { title: "Empresas", url: "/companies", icon: Building },
        { title: "Clientes", url: "/clients", icon: UserCheck },
        { title: "Chamados", url: "/calls", icon: FileText },
        { title: "Ordens", url: "/orders", icon: ClipboardList },
        { title: "Equipamentos", url: "/equipments", icon: Wrench },
        { title: "Técnicos", url: "/technician", icon: Settings },
        { title: "Fornecedores", url: "/suppliers", icon: Building },
        { title: "Relatórios", url: "/reports", icon: BarChart },
      ];
    }

    if (userRole === 'admin') {
      return [
        ...baseItems,
        { title: "Configurações", url: "/desk", icon: Settings },
        { title: "Empresas", url: "/companies", icon: Building },
        { title: "Fornecedores", url: "/suppliers", icon: Building },
        { title: "Relatórios", url: "/reports", icon: BarChart },
      ];
    }

    if (userRole === 'gestor' || userRole === 'admin_cliente') {
      return [
        ...baseItems,
        { title: "Desk", url: "/desk", icon: Settings },
        { title: "Clientes", url: "/clients", icon: UserCheck },
        { title: "Chamados", url: "/calls", icon: FileText },
        { title: "Ordens", url: "/orders", icon: ClipboardList },
        { title: "Equipamentos", url: "/equipments", icon: Wrench },
        { title: "Técnicos", url: "/technician", icon: Settings },
        { title: "Relatórios", url: "/reports", icon: BarChart },
      ];
    }

    if (userRole === 'tecnico') {
      return [
        { title: "Painel Técnico", url: "/technician", icon: Settings },
        { title: "Minhas Ordens", url: "/orders", icon: ClipboardList },
        { title: "Chamados", url: "/calls", icon: FileText },
      ];
    }

    if (userRole === 'cliente') {
      return [
        { title: "Portal Cliente", url: "/client-portal", icon: Home },
        { title: "Meus Chamados", url: "/calls", icon: FileText },
        { title: "Minhas Ordens", url: "/orders", icon: ClipboardList },
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();
  const isExpanded = menuItems.some((item) => isActive(item.url));

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold">
            Sistema Ordi
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
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