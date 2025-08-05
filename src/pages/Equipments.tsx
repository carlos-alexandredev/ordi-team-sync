import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { EquipmentsList } from "@/components/equipments/EquipmentsList";

const Equipments = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "admin_cliente", "tecnico", "cliente_final"]}>
        <EquipmentsList />
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Equipments;