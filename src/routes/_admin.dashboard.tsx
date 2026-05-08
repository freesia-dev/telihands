import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { PiggyBank, Landmark, Image as ImageIcon, Type } from "lucide-react";

export const Route = createFileRoute("/_admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — TDS Admin" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [sp, dp, md, rt] = await Promise.all([
        supabase.from("savings_products").select("id", { count: "exact", head: true }),
        supabase.from("deposito_rates").select("id", { count: "exact", head: true }),
        supabase.from("media").select("id", { count: "exact", head: true }),
        supabase.from("running_text").select("id", { count: "exact", head: true }),
      ]);
      return { sp: sp.count ?? 0, dp: dp.count ?? 0, md: md.count ?? 0, rt: rt.count ?? 0 };
    },
  });

  const stats = [
    { label: "Savings Products", value: data?.sp ?? 0, icon: PiggyBank, accent: "from-blue-500 to-indigo-600" },
    { label: "Deposito Rates", value: data?.dp ?? 0, icon: Landmark, accent: "from-indigo-500 to-violet-600" },
    { label: "Media Items", value: data?.md ?? 0, icon: ImageIcon, accent: "from-orange-500 to-amber-500" },
    { label: "Running Texts", value: data?.rt ?? 0, icon: Type, accent: "from-amber-500 to-yellow-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your digital signage content.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-card p-6 shadow-card-soft border">
            <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${s.accent} text-white flex items-center justify-center`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">{s.label}</p>
            <p className="text-3xl font-bold mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border bg-gradient-hero text-primary-foreground p-8 shadow-brand">
        <h2 className="text-2xl font-bold">Display Screen ready</h2>
        <p className="mt-2 text-white/80">Open the display in fullscreen on your Android TV / kiosk browser.</p>
        <a href="/display/main" target="_blank" rel="noreferrer"
          className="inline-block mt-4 rounded-lg bg-white/15 hover:bg-white/25 px-4 py-2 text-sm font-medium backdrop-blur">
          Open /display/main →
        </a>
      </div>
    </div>
  );
}