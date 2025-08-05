import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ReportsAnalytics } from "@/components/reports/ReportsAnalytics";

const Reports = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "admin_cliente"]}>
        <ReportsAnalytics />
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Reports;