import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, PiggyBank, Landmark, Image as ImageIcon, Type, LogOut, Tv, Menu, X } from "lucide-react";
import logo from "@/assets/tds-logo.png";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Savings Products", icon: PiggyBank },
  { to: "/deposito", label: "Deposito Rates", icon: Landmark },
  { to: "/media", label: "Media Library", icon: ImageIcon },
  { to: "/running-text", label: "Running Text", icon: Type },
];

export function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex bg-secondary/40">
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn("fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r flex flex-col transition-transform", open ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="p-4 border-b flex items-center gap-3">
          <img src={logo} alt="TDS" className="h-10 w-auto" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = loc.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active ? "bg-gradient-brand text-primary-foreground shadow-brand" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-2">
          <Button asChild variant="outline" className="w-full justify-start">
            <Link to="/display/main" target="_blank"><Tv className="h-4 w-4 mr-2" />Open Display</Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => signOut().then(() => navigate({ to: "/login" }))}>
            <LogOut className="h-4 w-4 mr-2" />Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-card border-b p-3 flex items-center justify-between">
          <img src={logo} alt="TDS" className="h-9" />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}