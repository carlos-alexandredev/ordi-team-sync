import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ClientsList } from "@/components/clients/ClientsList";

const Clients = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "admin_cliente"]}>
        <ClientsList />
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Clients;