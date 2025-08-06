import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageLoading } from "@/components/ui/page-loading";
import { usePageLoading } from "@/hooks/usePageLoading";
import { useAppSettings } from "@/stores/useAppSettings";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Companies from "./pages/Companies";
import Clients from "./pages/Clients";
import Suppliers from "./pages/Suppliers";
import Calls from "./pages/Calls";
import Orders from "./pages/Orders";
import Equipments from "./pages/Equipments";
import Technician from "./pages/Technician";
import TechnicianSchedule from "./pages/TechnicianSchedule";
import Reports from "./pages/Reports";
import ClientPortal from "./pages/ClientPortal";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import Desk from "./pages/Desk";
import UserPermissions from "./pages/UserPermissions";
import Logs from "./pages/Logs";
import NotFound from "./pages/NotFound";
import Equipes from "./pages/Equipes";
import Colaboradores from "./pages/Colaboradores";
import GruposClientes from "./pages/GruposClientes";
import Produtos from "./pages/Produtos";
import Servicos from "./pages/Servicos";
import FormasPagamento from "./pages/FormasPagamento";
import TiposTarefas from "./pages/TiposTarefas";
import Questionarios from "./pages/Questionarios";
import PesquisaSatisfacao from "./pages/PesquisaSatisfacao";
import AdminSettings from "./pages/AdminSettings";
import ClientsAdvanced from "./pages/ClientsAdvanced";
import SuppliersAdvanced from "./pages/SuppliersAdvanced";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function AppContent() {
  const isLoading = usePageLoading();
  const pageLoadingEnabled = useAppSettings((state) => state.pageLoadingEnabled);

  return (
    <>
      {/* Só renderiza o PageLoading se estiver habilitado */}
      {pageLoadingEnabled && <PageLoading isLoading={isLoading} />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/user-permissions" element={<UserPermissions />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/calls" element={<Calls />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/equipments" element={<Equipments />} />
        <Route path="/technician" element={<Technician />} />
        <Route path="/technician-schedule" element={<TechnicianSchedule />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/client-portal" element={<ClientPortal />} />
        <Route path="/supervisor" element={<SupervisorDashboard />} />
        <Route path="/desk" element={<Desk />} />
        
        {/* Módulo Cadastros */}
        <Route path="/equipes" element={<Equipes />} />
        <Route path="/colaboradores" element={<Colaboradores />} />
        <Route path="/grupos-clientes" element={<GruposClientes />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/servicos" element={<Servicos />} />
        <Route path="/formas-pagamento" element={<FormasPagamento />} />
        <Route path="/tipos-tarefas" element={<TiposTarefas />} />
        <Route path="/questionarios" element={<Questionarios />} />
        <Route path="/pesquisa-satisfacao" element={<PesquisaSatisfacao />} />
        <Route path="/admin-settings" element={<AdminSettings />} />
        
        {/* Páginas avançadas alternativas para teste */}
        <Route path="/clients-advanced" element={<ClientsAdvanced />} />
        <Route path="/suppliers-advanced" element={<SuppliersAdvanced />} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
