import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "./AppShell";

export function ProtectedRoute({ children, requireAdmin = true }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { session, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/auth" replace />;
  if (requireAdmin && !isAdmin) {
    return (
      <AppShell>
        <Card className="surface border-border p-10 text-center max-w-md mx-auto mt-12">
          <ShieldAlert className="h-10 w-10 mx-auto text-destructive mb-3" />
          <h2 className="text-xl font-bold mb-1">Admin access required</h2>
          <p className="text-sm text-muted-foreground">Your account does not have permission to access this module.</p>
        </Card>
      </AppShell>
    );
  }
  return <>{children}</>;
}
