import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SuppliersList } from "@/components/suppliers/SuppliersList";

const Suppliers = () => {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin", "admin_cliente"]}>
        <SuppliersList />
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Suppliers;