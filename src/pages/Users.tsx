import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, Loader2, Users as UsersIcon } from "lucide-react";

interface Row {
  user_id: string;
  display_name: string | null;
  is_admin: boolean;
  admin_role_id: string | null;
}

export default function Users() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name").order("created_at", { ascending: true }),
      supabase.from("user_roles").select("id, user_id, role"),
    ]);
    if (pErr || rErr) { toast.error((pErr ?? rErr)!.message); setLoading(false); return; }
    const adminMap = new Map<string, string>();
    (roles ?? []).forEach(r => { if (r.role === "admin") adminMap.set(r.user_id, r.id); });
    setRows((profiles ?? []).map(p => ({
      user_id: p.user_id,
      display_name: p.display_name,
      is_admin: adminMap.has(p.user_id),
      admin_role_id: adminMap.get(p.user_id) ?? null,
    })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function grant(userId: string) {
    setBusyId(userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Admin granted");
    load();
  }

  async function revoke(roleId: string, userId: string) {
    if (userId === user?.id) return toast.error("You can't revoke your own admin role");
    if (!confirm("Revoke admin from this user?")) return;
    setBusyId(userId);
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("Admin revoked");
    load();
  }

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Access control</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Manage <span className="gradient-text">admins</span></h1>
        <p className="text-sm text-muted-foreground mt-2">Grant or revoke admin access to any registered user.</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground"><Loader2 className="h-4 w-4 inline mr-2 animate-spin" />Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="surface border-border p-12 text-center">
          <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No users yet.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Card key={r.user_id} className="surface border-border p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium truncate">{r.display_name ?? "(no name)"}{r.user_id === user?.id && <span className="text-xs text-muted-foreground ml-2">(you)</span>}</div>
                <div className="text-xs text-muted-foreground truncate font-mono">{r.user_id}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.is_admin ? <Badge className="gradient-primary text-primary-foreground">Admin</Badge> : <Badge variant="secondary">Client</Badge>}
                {r.is_admin ? (
                  <Button size="sm" variant="outline" disabled={busyId === r.user_id || r.user_id === user?.id}
                    onClick={() => revoke(r.admin_role_id!, r.user_id)}>
                    <ShieldOff className="h-4 w-4 mr-1.5" /> Revoke
                  </Button>
                ) : (
                  <Button size="sm" disabled={busyId === r.user_id} onClick={() => grant(r.user_id)}
                    className="gradient-primary text-primary-foreground">
                    <ShieldCheck className="h-4 w-4 mr-1.5" /> Make admin
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
