import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UsersList } from "@/components/users/UsersList";

const Users = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master"]}>
        <UsersList />
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Users;