import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ScanFace, UserPlus, Users, ClipboardList, Menu, X, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const adminLinks = [
  { to: "/", label: "Recognize", icon: ScanFace },
  { to: "/enroll", label: "Enroll", icon: UserPlus },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/attendance", label: "Attendance", icon: ClipboardList },
  { to: "/users", label: "Admins", icon: ShieldCheck },
];
const clientLinks = [
  { to: "/attendance", label: "Attendance", icon: ClipboardList },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const links = isAdmin ? adminLinks : clientLinks;


  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <ScanFace className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight">FaceID HR</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Module 01 · Recognition</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            {user && (
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4 mr-1.5" /> Sign out
              </Button>
            )}
          </div>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-secondary">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t border-border container py-2 flex flex-col">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-3 text-sm ${pathname === to ? "bg-secondary" : "text-muted-foreground"}`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
            {user && (
              <button onClick={() => { setOpen(false); signOut(); }} className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm text-muted-foreground">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            )}
          </div>
        )}
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
