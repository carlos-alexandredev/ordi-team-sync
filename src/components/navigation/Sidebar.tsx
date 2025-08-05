import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardList, 
  Users, 
  Building, 
  UserCheck, 
  Wrench, 
  BarChart, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Home,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";

interface SidebarProps {
  userRole: string;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ userRole, collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const [showTaskModal, setShowTaskModal] = useState(false);

  const getMenuItems = () => {
    const baseItems = [
      { 
        href: "/dashboard", 
        icon: LayoutDashboard, 
        label: "Dashboard",
        roles: ["admin", "admin_cliente", "cliente_final", "tecnico"]
      }
    ];

    const adminItems = [
      { href: "/users", icon: Users, label: "Usuários", roles: ["admin"] },
      { href: "/companies", icon: Building, label: "Empresas", roles: ["admin"] },
      { href: "/clients", icon: UserCheck, label: "Clientes", roles: ["admin", "admin_cliente"] },
      { href: "/calls", icon: FileText, label: "Chamados", roles: ["admin", "admin_cliente"] },
      { href: "/orders", icon: ClipboardList, label: "Ordens", roles: ["admin", "admin_cliente"] },
      { href: "/equipments", icon: Wrench, label: "Equipamentos", roles: ["admin", "admin_cliente"] },
      { href: "/technician", icon: Settings, label: "Técnicos", roles: ["admin"] },
      { href: "/reports", icon: BarChart, label: "Relatórios", roles: ["admin", "admin_cliente"] }
    ];

    const clientItems = [
      { href: "/calls", icon: FileText, label: "Meus Chamados", roles: ["cliente_final"] },
      { href: "/orders", icon: ClipboardList, label: "Minhas Ordens", roles: ["cliente_final"] }
    ];

    const technicianItems = [
      { href: "/technician", icon: Settings, label: "Painel Técnico", roles: ["tecnico"] }
    ];

    return [...baseItems, ...adminItems, ...clientItems, ...technicianItems]
      .filter(item => item.roles.includes(userRole));
  };

  const menuItems = getMenuItems();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    return location.pathname === href;
  };

  return (
    <div className={cn(
      "relative flex flex-col bg-card border-r transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">O</span>
            </div>
            <span className="font-semibold text-lg">ORDI</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-8 h-8 p-0"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b">
        {userRole === "cliente_final" ? (
          <Button className="w-full" size={collapsed ? "sm" : "default"}>
            {collapsed ? <Plus className="h-4 w-4" /> : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Novo Chamado
              </>
            )}
          </Button>
        ) : (userRole === "admin" || userRole === "admin_cliente") ? (
          <div className={cn("space-y-2", collapsed && "space-y-1")}>
            <Button className="w-full" size={collapsed ? "sm" : "default"}>
              {collapsed ? <Plus className="h-4 w-4" /> : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Chamado
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              size={collapsed ? "sm" : "default"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowTaskModal(true);
              }}
            >
              {collapsed ? <PlusCircle className="h-4 w-4" /> : (
                <>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nova Ordem
                </>
              )}
            </Button>
          </div>
        ) : null}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent",
                  active && "bg-primary text-primary-foreground hover:bg-primary/90",
                  collapsed && "justify-center"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground">
            Sistema ORDI v1.0
          </div>
        </div>
      )}

      {/* Modal Nova Ordem */}
      <TaskFormModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        onSuccess={() => {
          setShowTaskModal(false);
        }}
      />
    </div>
  );
}