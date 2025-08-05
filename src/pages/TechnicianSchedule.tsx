import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TechnicianCalendar } from "@/components/technician/TechnicianCalendar";

const TechnicianSchedulePage = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "admin_cliente", "tecnico", "gestor"]}>
        <TechnicianCalendar />
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default TechnicianSchedulePage;