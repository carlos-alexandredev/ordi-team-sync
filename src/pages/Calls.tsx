import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CallsList } from "@/components/calls/CallsList";

const Calls = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin", "admin_cliente", "cliente_final"]}>
        <CallsList />
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Calls;