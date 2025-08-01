import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CallFormModal } from "@/components/calls/CallFormModal";
import { CallsList } from "@/components/calls/CallsList";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const ClientPortal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["cliente_final"]}>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Portal do Cliente</h1>
              <p className="text-muted-foreground">
                Abra novos chamados e acompanhe o status dos seus atendimentos
              </p>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Abrir Chamado
            </Button>
          </div>

          <CallsList />

          <CallFormModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onSuccess={() => {
              setIsModalOpen(false);
              // Refresh the calls list
            }}
          />
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default ClientPortal;