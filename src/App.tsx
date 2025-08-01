import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageLoading } from "@/components/ui/page-loading";
import { usePageLoading } from "@/hooks/usePageLoading";
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
import Reports from "./pages/Reports";
import ClientPortal from "./pages/ClientPortal";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import Desk from "./pages/Desk";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const isLoading = usePageLoading();

  return (
    <>
      <PageLoading isLoading={isLoading} />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/calls" element={<Calls />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/equipments" element={<Equipments />} />
        <Route path="/technician" element={<Technician />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/client-portal" element={<ClientPortal />} />
        <Route path="/supervisor" element={<SupervisorDashboard />} />
        <Route path="/desk" element={<Desk />} />
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
