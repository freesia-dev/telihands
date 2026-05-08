import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Monitor, ShieldCheck, Tv, Zap } from "lucide-react";
import logo from "@/assets/tds-logo.png";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/70 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <img src={logo} alt="Telihan Digital Signage" className="h-12 w-auto" />
          <div className="flex gap-2">
            <Button asChild variant="ghost"><Link to="/display/main">View Display</Link></Button>
            <Button asChild className="bg-gradient-brand text-primary-foreground shadow-brand"><Link to="/login">Admin Login</Link></Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-[0.08]" />
        <div className="container mx-auto px-6 py-24 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-accent-orange" /> Inform • Engage • Inspire
            </span>
            <h1 className="mt-6 text-5xl md:text-6xl font-extrabold leading-tight">
              <span className="text-gradient-brand">Telihan Digital Signage</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
              A modern, Android TV-ready signage platform for Bank KCP Telihan. Manage savings rates, deposito offers, promotional media, and announcements — from any device.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-brand text-primary-foreground shadow-brand">
                <Link to="/login">Open Admin Panel</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/display/main">Launch Display Mode</Link>
              </Button>
            </div>
          </motion.div>

          <div className="mt-20 grid gap-6 md:grid-cols-4">
            {[
              { icon: Tv, title: "Android TV Ready", desc: "Fullscreen kiosk-friendly display." },
              { icon: Monitor, title: "Live Content", desc: "Update rates and media instantly." },
              { icon: Zap, title: "Smooth Motion", desc: "Crafted micro-animations." },
              { icon: ShieldCheck, title: "Secure", desc: "Role-based admin access." },
            ].map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="rounded-2xl border bg-card p-6 shadow-card-soft">
                <div className="h-10 w-10 rounded-xl bg-gradient-brand text-primary-foreground flex items-center justify-center">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
