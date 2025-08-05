import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UserPermissionsManager } from "@/components/permissions/UserPermissionsManager";

const UserPermissions = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master"]}>
        <div className="container mx-auto p-6">
          <UserPermissionsManager />
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default UserPermissions;