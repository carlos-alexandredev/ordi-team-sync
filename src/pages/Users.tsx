
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UsersList } from "@/components/users/UsersList";

const Users = () => {
  console.log("Users page: Renderizando página de usuários");
  
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin_cliente"]}>
        <UsersList />
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Users;
