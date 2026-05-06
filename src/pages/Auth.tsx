import { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ScanFace, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
});

export default function Auth() {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authHint, setAuthHint] = useState<string | null>(null);
  const navigate = useNavigate();
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  useEffect(() => {
    if (session) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  if (loading) return null;
  if (session) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setAuthHint(null);
    const parsed = schema.safeParse({ email: normalizedEmail, password });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: normalizedEmail, password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        // Try to sign in immediately (works when email auto-confirm is on)
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (signInErr) {
          toast.success("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
          setAuthHint("Your account exists now. If your password still does not work, use Forgot password to set a new one.");
          return;
        }
        toast.success("Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
      }
      navigate("/");
    } catch (e: any) {
      const message = e?.message ?? "Authentication failed";

      if (message.toLowerCase().includes("invalid login credentials")) {
        setAuthHint("That email is registered, but this password does not match. Use Forgot password to set a new password.");
        toast.error("Wrong password for this email");
        return;
      }

      if (message.toLowerCase().includes("user already registered")) {
        setMode("signin");
        setAuthHint("That email already has an account. Sign in instead, or use Forgot password if you don't remember the password.");
        toast.error("Account already exists");
        return;
      }

      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    const parsed = schema.shape.email.safeParse(normalizedEmail);
    if (!parsed.success) { toast.error("Enter your email above first"); return; }
    setAuthHint(null);
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      setAuthHint(`Password reset sent to ${normalizedEmail}. Open the newest email and follow the link to choose a new password.`);
      toast.success("Password reset email sent. Check your inbox.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="surface border-border p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-glow">
            <ScanFace className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="text-lg font-bold">FaceID HR</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Admin access</div>
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-1">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signin" ? "Sign in to manage employees and attendance." : "First account becomes the admin."}
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5 bg-input border-border" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1.5">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-input border-border pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={busy} size="lg" className="w-full gradient-primary text-primary-foreground">
            {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Please wait</> : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={busy}
          onClick={async () => {
            setAuthHint(null);
            setBusy(true);
            const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
            if (result.error) { toast.error(result.error.message ?? "Google sign-in failed"); setBusy(false); return; }
            if (result.redirected) return;
            setBusy(false);
          }}
          className="w-full"
        >
          Continue with Google
        </Button>

        {authHint && (
          <p className="mt-4 text-sm text-muted-foreground text-center">
            {authHint}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2 items-center">
          <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-sm text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "No account? Sign up" : "Already have an account? Sign in"}
          </button>
          {mode === "signin" && (
            <button type="button" onClick={forgotPassword} disabled={busy} className="text-sm text-primary hover:underline">
              Forgot password?
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
