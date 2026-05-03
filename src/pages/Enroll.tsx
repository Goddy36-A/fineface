import { useEffect, useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { CameraView } from "@/components/CameraView";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCamera } from "@/hooks/useCamera";
import { detectSingleFace, loadFaceModels } from "@/lib/faceApi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, Loader2, UserPlus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  employee_code: z.string().trim().min(1).max(40),
  full_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  department: z.string().trim().max(80).optional().or(z.literal("")),
  position: z.string().trim().max(80).optional().or(z.literal("")),
});

export default function Enroll() {
  const [active, setActive] = useState(true);
  const [modelsReady, setModelsReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [form, setForm] = useState({ employee_code: "", full_name: "", email: "", department: "", position: "" });
  const { videoRef, error, ready } = useCamera(active);
  const navigate = useNavigate();

  useEffect(() => {
    loadFaceModels().then(() => setModelsReady(true));
  }, []);

  async function captureFace() {
    if (!videoRef.current) return;
    setCapturing(true);
    try {
      const det = await detectSingleFace(videoRef.current);
      if (!det) {
        toast.error("No face detected. Center your face and try again.");
        return;
      }
      setDescriptor(det.descriptor);
      // snapshot
      const v = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(v, 0, 0);
      setSnapshot(canvas.toDataURL("image/jpeg", 0.85));
      toast.success("Face captured! Fill in the details below.");
    } finally {
      setCapturing(false);
    }
  }

  async function submit() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!descriptor) {
      toast.error("Capture a face first.");
      return;
    }
    setSubmitting(true);
    try {
      let photo_url: string | null = null;
      if (snapshot) {
        const blob = await (await fetch(snapshot)).blob();
        const path = `${parsed.data.employee_code}-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from("employee-photos").upload(path, blob, { contentType: "image/jpeg", upsert: true });
        if (!upErr) {
          photo_url = supabase.storage.from("employee-photos").getPublicUrl(path).data.publicUrl;
        }
      }
      const { error: insErr } = await supabase.from("employees").insert({
        employee_code: parsed.data.employee_code,
        full_name: parsed.data.full_name,
        email: parsed.data.email || null,
        department: parsed.data.department || null,
        position: parsed.data.position || null,
        photo_url,
        face_descriptor: Array.from(descriptor) as any,
      });
      if (insErr) throw insErr;
      toast.success("Employee enrolled!");
      navigate("/employees");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to enroll");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Enrollment</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Enroll a <span className="gradient-text">new face</span></h1>
        <p className="mt-3 text-muted-foreground">Capture a clear frontal photo, then save the employee details.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <CameraView videoRef={videoRef} status={!modelsReady ? "Loading models..." : ready ? "Live" : "Starting camera..."} />
          <div className="mt-4 flex gap-3">
            <Button onClick={captureFace} disabled={!ready || !modelsReady || capturing} size="lg" className="gradient-primary text-primary-foreground shadow-glow">
              {capturing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Detecting</> : <><Camera className="h-4 w-4 mr-2" /> Capture face</>}
            </Button>
            {descriptor && <span className="inline-flex items-center gap-1 text-sm text-success"><Sparkles className="h-4 w-4" /> Face encoded</span>}
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        <Card className="surface border-border p-6">
          {snapshot && (
            <div className="mb-4 flex items-center gap-3">
              <img src={snapshot} alt="snapshot" className="h-20 w-20 rounded-xl object-cover border border-border" />
              <div className="text-sm text-muted-foreground">Captured snapshot will be saved as the profile photo.</div>
            </div>
          )}
          <div className="grid gap-4">
            {[
              { k: "employee_code", l: "Employee code *", ph: "EMP-001" },
              { k: "full_name", l: "Full name *", ph: "Jane Doe" },
              { k: "email", l: "Email", ph: "jane@company.com" },
              { k: "department", l: "Department", ph: "Engineering" },
              { k: "position", l: "Position", ph: "Senior Developer" },
            ].map((f) => (
              <div key={f.k}>
                <Label htmlFor={f.k}>{f.l}</Label>
                <Input
                  id={f.k}
                  value={(form as any)[f.k]}
                  onChange={(e) => setForm((s) => ({ ...s, [f.k]: e.target.value }))}
                  placeholder={f.ph}
                  className="mt-1.5 bg-input border-border"
                />
              </div>
            ))}
            <Button onClick={submit} disabled={submitting || !descriptor} size="lg" className="gradient-primary text-primary-foreground">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving</> : <><UserPlus className="h-4 w-4 mr-2" /> Save employee</>}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
