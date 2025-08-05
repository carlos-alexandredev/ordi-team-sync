import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SystemLogs } from "@/components/SystemLogs";

const Logs = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master"]}>
        <SystemLogs />
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Logs;