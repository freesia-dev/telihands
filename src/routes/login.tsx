import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/tds-logo.png";
import { motion } from "framer-motion";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Admin Login — Telihan Digital Signage" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Account created. You're signed in.");
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative bg-gradient-hero text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-accent-orange/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />
        <Link to="/" className="relative inline-block bg-white rounded-xl p-3 w-fit shadow-brand">
          <img src={logo} alt="TDS" className="h-12 w-auto" />
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative">
          <h2 className="text-4xl font-bold leading-tight">Manage your branch displays from anywhere.</h2>
          <p className="mt-4 text-white/80 max-w-md">Update interest rates, swap promotional media, and broadcast announcements in real time.</p>
        </motion.div>
        <p className="relative text-sm text-white/60">Inform • Engage • Inspire</p>
      </div>

      <div className="flex items-center justify-center p-6 bg-background">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex justify-center">
            <img src={logo} alt="TDS" className="h-16 w-auto" />
          </div>
          <h1 className="text-3xl font-bold">{mode === "login" ? "Welcome back" : "Create admin account"}</h1>
          <p className="text-muted-foreground mt-1">{mode === "login" ? "Sign in to your TDS admin panel." : "First user becomes admin automatically."}</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-primary-foreground shadow-brand h-11">
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-6 text-sm text-muted-foreground hover:text-foreground">
            {mode === "login" ? "No account yet? Create one →" : "Already have an account? Sign in →"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}