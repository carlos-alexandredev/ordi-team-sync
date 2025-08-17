import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProfileEdit } from "@/components/profile/ProfileEdit";

const Profile = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["cliente_final", "admin", "admin_cliente", "gestor", "tecnico", "admin_master"]}>
        <ProfileEdit />
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Profile;