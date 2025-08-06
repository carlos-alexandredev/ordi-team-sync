import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RBACManager } from "@/components/rbac/RBACManager";

const UserPermissions = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master"]}>
        <div className="container mx-auto p-6">
          <RBACManager />
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default UserPermissions;