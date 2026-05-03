import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Employee {
  id: string; employee_code: string; full_name: string; email: string | null;
  department: string | null; position: string | null; photo_url: string | null; created_at: string;
}

export default function Employees() {
  const [list, setList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data, error } = await supabase
      .from("employees")
      .select("id, employee_code, full_name, email, department, position, photo_url, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setList(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm("Delete this employee and all their attendance logs?")) return;
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  }

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Roster</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Enrolled <span className="gradient-text">employees</span></h1>
        </div>
        <Link to="/enroll"><Button className="gradient-primary text-primary-foreground">+ New enrollment</Button></Link>
      </div>

      {loading ? <p className="text-muted-foreground">Loading...</p> : list.length === 0 ? (
        <Card className="surface border-border p-12 text-center">
          <UserCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No employees yet. Start by enrolling one.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => (
            <Card key={e.id} className="surface border-border p-5 hover:shadow-elegant transition-shadow">
              <div className="flex items-start gap-4">
                {e.photo_url ? (
                  <img src={e.photo_url} alt={e.full_name} className="h-16 w-16 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="h-16 w-16 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {e.full_name.split(" ").map(s => s[0]).slice(0,2).join("")}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{e.full_name}</div>
                  <div className="text-xs text-muted-foreground">#{e.employee_code}</div>
                  {e.position && <div className="text-sm mt-1 truncate">{e.position}</div>}
                  {e.department && <div className="text-xs text-muted-foreground truncate">{e.department}</div>}
                </div>
                <button onClick={() => remove(e.id)} className="text-muted-foreground hover:text-destructive p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
