import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageLoading } from "@/components/ui/page-loading";
import { usePageLoading } from "@/hooks/usePageLoading";
import { LazyWrapper } from "@/components/common/LazyWrapper";
import { lazy } from "react";

// Lazy load all pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Users = lazy(() => import("./pages/Users"));
const Companies = lazy(() => import("./pages/Companies"));
const Clients = lazy(() => import("./pages/Clients"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Calls = lazy(() => import("./pages/Calls"));
const Orders = lazy(() => import("./pages/Orders"));
const Equipments = lazy(() => import("./pages/Equipments"));
const Technician = lazy(() => import("./pages/Technician"));
const TechnicianSchedule = lazy(() => import("./pages/TechnicianSchedule"));
const Reports = lazy(() => import("./pages/Reports"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const SupervisorDashboard = lazy(() => import("./pages/SupervisorDashboard"));
const Desk = lazy(() => import("./pages/Desk"));
const UserPermissions = lazy(() => import("./pages/UserPermissions"));
const Logs = lazy(() => import("./pages/Logs"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Equipes = lazy(() => import("./pages/Equipes"));
const Colaboradores = lazy(() => import("./pages/Colaboradores"));
const GruposClientes = lazy(() => import("./pages/GruposClientes"));
const Produtos = lazy(() => import("./pages/Produtos"));
const Servicos = lazy(() => import("./pages/Servicos"));
const FormasPagamento = lazy(() => import("./pages/FormasPagamento"));
const TiposTarefas = lazy(() => import("./pages/TiposTarefas"));
const Questionarios = lazy(() => import("./pages/Questionarios"));
const PesquisaSatisfacao = lazy(() => import("./pages/PesquisaSatisfacao"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const ClientsAdvanced = lazy(() => import("./pages/ClientsAdvanced"));
const SuppliersAdvanced = lazy(() => import("./pages/SuppliersAdvanced"));

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

  return (
    <>
      <PageLoading isLoading={isLoading} />
      <Routes>
        <Route path="/" element={<LazyWrapper><Index /></LazyWrapper>} />
        <Route path="/dashboard" element={<LazyWrapper><Dashboard /></LazyWrapper>} />
        <Route path="/users" element={<LazyWrapper><Users /></LazyWrapper>} />
        <Route path="/user-permissions" element={<LazyWrapper><UserPermissions /></LazyWrapper>} />
        <Route path="/logs" element={<LazyWrapper><Logs /></LazyWrapper>} />
        <Route path="/companies" element={<LazyWrapper><Companies /></LazyWrapper>} />
        <Route path="/clients" element={<LazyWrapper><Clients /></LazyWrapper>} />
        <Route path="/suppliers" element={<LazyWrapper><Suppliers /></LazyWrapper>} />
        <Route path="/calls" element={<LazyWrapper><Calls /></LazyWrapper>} />
        <Route path="/orders" element={<LazyWrapper><Orders /></LazyWrapper>} />
        <Route path="/equipments" element={<LazyWrapper><Equipments /></LazyWrapper>} />
        <Route path="/technician" element={<LazyWrapper><Technician /></LazyWrapper>} />
        <Route path="/technician-schedule" element={<LazyWrapper><TechnicianSchedule /></LazyWrapper>} />
        <Route path="/reports" element={<LazyWrapper><Reports /></LazyWrapper>} />
        <Route path="/client-portal" element={<LazyWrapper><ClientPortal /></LazyWrapper>} />
        <Route path="/supervisor" element={<LazyWrapper><SupervisorDashboard /></LazyWrapper>} />
        <Route path="/desk" element={<LazyWrapper><Desk /></LazyWrapper>} />
        
        {/* Módulo Cadastros */}
        <Route path="/equipes" element={<LazyWrapper><Equipes /></LazyWrapper>} />
        <Route path="/colaboradores" element={<LazyWrapper><Colaboradores /></LazyWrapper>} />
        <Route path="/grupos-clientes" element={<LazyWrapper><GruposClientes /></LazyWrapper>} />
        <Route path="/produtos" element={<LazyWrapper><Produtos /></LazyWrapper>} />
        <Route path="/servicos" element={<LazyWrapper><Servicos /></LazyWrapper>} />
        <Route path="/formas-pagamento" element={<LazyWrapper><FormasPagamento /></LazyWrapper>} />
        <Route path="/tipos-tarefas" element={<LazyWrapper><TiposTarefas /></LazyWrapper>} />
        <Route path="/questionarios" element={<LazyWrapper><Questionarios /></LazyWrapper>} />
        <Route path="/pesquisa-satisfacao" element={<LazyWrapper><PesquisaSatisfacao /></LazyWrapper>} />
        <Route path="/admin-settings" element={<LazyWrapper><AdminSettings /></LazyWrapper>} />
        
        {/* Páginas avançadas alternativas para teste */}
        <Route path="/clients-advanced" element={<LazyWrapper><ClientsAdvanced /></LazyWrapper>} />
        <Route path="/suppliers-advanced" element={<LazyWrapper><SuppliersAdvanced /></LazyWrapper>} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<LazyWrapper><NotFound /></LazyWrapper>} />
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
