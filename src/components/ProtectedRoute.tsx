import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "./AppShell";

export function ProtectedRoute({ children, requireAdmin = true }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { session, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (!session) return <Navigate to="/auth" replace />;
  if (requireAdmin && !isAdmin) {
    return (
      <AppShell>
        <Card className="surface border-border p-10 text-center max-w-md mx-auto mt-12">
          <ShieldAlert className="h-10 w-10 mx-auto text-destructive mb-3" />
          <h2 className="text-xl font-bold mb-1">Admin access required</h2>
          <p className="text-sm text-muted-foreground mb-4">This module is restricted to administrators. As a client you can browse the attendance timeline.</p>
          <Navigate to="/attendance" replace />
        </Card>
      </AppShell>
    );
  }
  return <>{children}</>;
}
