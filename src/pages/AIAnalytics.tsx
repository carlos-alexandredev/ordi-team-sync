import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AIAnalytics } from "@/components/analytics/AIAnalytics";

export default function AIAnalyticsPage() {
  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin", "admin_cliente", "admin_master"]}>
        <div className="container mx-auto py-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics com IA</h1>
            <p className="text-muted-foreground mt-1">
              Faça perguntas sobre seus dados em linguagem natural e receba insights instantâneos
            </p>
          </div>

          <AIAnalytics />
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
}