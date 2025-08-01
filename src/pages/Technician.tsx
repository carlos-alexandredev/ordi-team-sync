import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TechnicianDashboard } from "@/components/technician/TechnicianDashboard";

const Technician = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin", "admin_cliente", "tecnico"]}>
        <TechnicianDashboard />
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Technician;