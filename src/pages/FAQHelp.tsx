import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FAQSearch } from "@/components/faq/FAQSearch";
import { AIChat } from "@/components/faq/AIChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FAQHelp() {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin", "admin_cliente", "admin_master", "cliente_final", "tecnico", "gestor", "supervisor"]}>
        <div className="container mx-auto py-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Central de Ajuda</h1>
            <p className="text-muted-foreground mt-1">
              Encontre respostas para suas perguntas ou consulte nossa inteligência artificial
            </p>
          </div>

          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Buscar FAQs</TabsTrigger>
              <TabsTrigger value="chat">Chat com IA</TabsTrigger>
            </TabsList>
            
            <TabsContent value="search" className="mt-6">
              <FAQSearch />
            </TabsContent>
            
            <TabsContent value="chat" className="mt-6">
              <AIChat />
            </TabsContent>
          </Tabs>
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
}