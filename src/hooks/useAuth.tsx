import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ session: null, user: null, isAdmin: false, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const resolvedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    const applySession = async (nextSession: Session | null) => {
      if (!mountedRef.current) return;

      const nextUser = nextSession?.user ?? null;
      setSession(nextSession);

      if (!nextUser) {
        resolvedUserIdRef.current = null;
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (resolvedUserIdRef.current === nextUser.id) {
        setLoading(false);
        return;
      }

      resolvedUserIdRef.current = nextUser.id;
      setLoading(true);
      const admin = await checkAdmin(nextUser.id);

      if (!mountedRef.current) return;
      setIsAdmin(admin);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    supabase.auth.getSession().then(({ data }) => {
      void applySession(data.session);
    });

    return () => {
      mountedRef.current = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function checkAdmin(uid: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();
    if (error) console.error("checkAdmin error", error);
    return !!data;
  }

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, isAdmin, loading, signOut: async () => { await supabase.auth.signOut(); } }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
