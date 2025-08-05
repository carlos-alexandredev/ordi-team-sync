import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CompaniesList } from "@/components/companies/CompaniesList";

const Companies = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin"]}>
        <CompaniesList />
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Companies;