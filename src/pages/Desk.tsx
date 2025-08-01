import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SupervisorPanel } from "@/components/dashboard/SupervisorPanel";

const Desk = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin", "admin_cliente"]}>
        <SupervisorPanel />
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Desk;