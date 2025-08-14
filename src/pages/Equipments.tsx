import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { EquipmentsList } from "@/components/equipments/EquipmentsList";

const Equipments = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "admin_cliente", "tecnico", "cliente_final"]}>
        <div className="p-6">
          <EquipmentsList />
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Equipments;