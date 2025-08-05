import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OrdersList } from "@/components/orders/OrdersList";

const Orders = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "admin_cliente", "cliente_final"]}>
        <OrdersList />
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Orders;