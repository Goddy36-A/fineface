import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CameraView } from "@/components/CameraView";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCamera } from "@/hooks/useCamera";
import { detectAllFaces, euclideanDistance, loadFaceModels } from "@/lib/faceApi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, LogIn, LogOut, Loader2, ShieldAlert } from "lucide-react";

const MATCH_THRESHOLD = 0.5; // lower = stricter
const COOLDOWN_MS = 15000;

interface Employee {
  id: string;
  full_name: string;
  employee_code: string;
  department: string | null;
  photo_url: string | null;
  descriptor: Float32Array;
}

export default function Recognize() {
  const [active, setActive] = useState(false);
  const [logType, setLogType] = useState<"check_in" | "check_out">("check_in");
  const [modelsReady, setModelsReady] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [status, setStatus] = useState("Ready");
  const [lastMatch, setLastMatch] = useState<{ name: string; code: string; confidence: number; type: string; at: Date } | null>(null);
  const { videoRef, error, ready } = useCamera(active);
  const lastLogRef = useRef<Record<string, number>>({});
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      setStatus("Loading recognition models...");
      await loadFaceModels();
      setModelsReady(true);
      setStatus("Loading employees...");
      const { data, error } = await supabase.from("employees").select("id, full_name, employee_code, department, photo_url, face_descriptor");
      if (error) { toast.error(error.message); return; }
      const list: Employee[] = (data ?? []).map((e: any) => ({
        ...e,
        descriptor: new Float32Array(e.face_descriptor as number[]),
      }));
      setEmployees(list);
      setStatus(list.length ? "Ready — start camera to recognize" : "No employees enrolled yet");
    })();
  }, []);

  useEffect(() => {
    if (!active || !ready || !modelsReady) return;
    let cancelled = false;

    async function loop() {
      if (cancelled || !videoRef.current) return;
      try {
        const detections = await detectAllFaces(videoRef.current);
        if (detections.length === 0) {
          setStatus("Looking for a face...");
        } else {
          for (const det of detections) {
            let best: { emp: Employee; dist: number } | null = null;
            for (const emp of employees) {
              const d = euclideanDistance(det.descriptor, emp.descriptor);
              if (!best || d < best.dist) best = { emp, dist: d };
            }
            if (best && best.dist < MATCH_THRESHOLD) {
              const conf = Math.max(0, Math.min(1, 1 - best.dist));
              const now = Date.now();
              const key = `${best.emp.id}:${logType}`;
              if (!lastLogRef.current[key] || now - lastLogRef.current[key] > COOLDOWN_MS) {
                lastLogRef.current[key] = now;
                await supabase.from("attendance_logs").insert({
                  employee_id: best.emp.id,
                  log_type: logType,
                  confidence: conf,
                });
                setLastMatch({ name: best.emp.full_name, code: best.emp.employee_code, confidence: conf, type: logType, at: new Date() });
                toast.success(`${logType === "check_in" ? "Checked in" : "Checked out"}: ${best.emp.full_name}`);
                setStatus(`Matched ${best.emp.full_name}`);
              } else {
                setStatus(`${best.emp.full_name} (cooldown)`);
              }
            } else {
              setStatus("Unrecognized face");
            }
          }
        }
      } catch (e) {
        // ignore frame errors
      }
      rafRef.current = window.setTimeout(loop, 600) as unknown as number;
    }
    loop();
    return () => {
      cancelled = true;
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, [active, ready, modelsReady, employees, logType, videoRef]);

  return (
    <AppShell>
      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Live recognition</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Step in. <span className="gradient-text">Be seen.</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg">
              Camera + on-device face matching. Logs attendance the moment an enrolled employee is recognized.
            </p>
          </div>

          <CameraView videoRef={videoRef} status={active ? status : "Camera off"} />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => setLogType("check_in")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${logType === "check_in" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                <LogIn className="h-4 w-4" /> Check-in
              </button>
              <button
                onClick={() => setLogType("check_out")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${logType === "check_out" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                <LogOut className="h-4 w-4" /> Check-out
              </button>
            </div>
            <Button
              onClick={() => setActive((v) => !v)}
              disabled={!modelsReady}
              size="lg"
              className="gradient-primary text-primary-foreground hover:opacity-90 shadow-glow"
            >
              {!modelsReady ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading models</> : active ? "Stop camera" : "Start camera"}
            </Button>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
              <ShieldAlert className="h-4 w-4" /> {error}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="surface border-border p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Last match</div>
            {lastMatch ? (
              <div className="mt-3">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">{lastMatch.type === "check_in" ? "Checked in" : "Checked out"}</span>
                </div>
                <div className="mt-2 text-2xl font-bold">{lastMatch.name}</div>
                <div className="text-sm text-muted-foreground">#{lastMatch.code}</div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-3xl font-bold gradient-text">{(lastMatch.confidence * 100).toFixed(1)}%</span>
                  <span className="text-xs text-muted-foreground">confidence</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{lastMatch.at.toLocaleTimeString()}</div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No matches yet. Enroll employees and start the camera.</p>
            )}
          </Card>

          <Card className="surface border-border p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Roster</div>
            <div className="text-3xl font-bold">{employees.length}</div>
            <p className="text-sm text-muted-foreground">enrolled employee{employees.length === 1 ? "" : "s"}</p>
          </Card>

          <Card className="surface border-border p-5 text-sm text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Tip:</strong> good lighting, face the camera straight on for best accuracy.</p>
            <p>Repeated logs of the same person within 15 seconds are ignored.</p>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
