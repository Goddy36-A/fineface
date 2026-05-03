import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, LogOut } from "lucide-react";

interface Row {
  id: string; log_type: string; confidence: number | null; recognized_at: string;
  employees: { full_name: string; employee_code: string; photo_url: string | null } | null;
}

export default function Attendance() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("attendance_logs")
        .select("id, log_type, confidence, recognized_at, employees(full_name, employee_code, photo_url)")
        .order("recognized_at", { ascending: false })
        .limit(200);
      setRows((data as any) ?? []);
    })();
  }, []);

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Logs</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Attendance <span className="gradient-text">timeline</span></h1>
      </div>

      <Card className="surface border-border overflow-hidden">
        <div className="divide-y divide-border">
          {rows.length === 0 && <div className="p-8 text-center text-muted-foreground">No attendance logged yet.</div>}
          {rows.map((r) => {
            const isIn = r.log_type === "check_in";
            return (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/40 transition-colors">
                {r.employees?.photo_url ? (
                  <img src={r.employees.photo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-lg gradient-primary" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.employees?.full_name ?? "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">#{r.employees?.employee_code}</div>
                </div>
                <Badge variant="outline" className={isIn ? "border-success/40 text-success" : "border-warning/40 text-warning"}>
                  {isIn ? <LogIn className="h-3 w-3 mr-1" /> : <LogOut className="h-3 w-3 mr-1" />}
                  {isIn ? "Check-in" : "Check-out"}
                </Badge>
                {r.confidence != null && (
                  <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">{(r.confidence * 100).toFixed(1)}%</span>
                )}
                <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                  {new Date(r.recognized_at).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}
