import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { fmtIDR, fmtPct } from "@/lib/format";
import logo from "@/assets/tds-logo.png";

export const Route = createFileRoute("/display/main")({
  head: () => ({ meta: [
    { title: "Display — Telihan Digital Signage" },
    { name: "viewport", content: "width=device-width, initial-scale=1, user-scalable=no" },
  ] }),
  component: DisplayPage,
});

type Media = { id: string; title: string; file_url: string; media_type: "image" | "video"; duration_seconds: number };
type Saving = { id: string; name: string; interest_rate: number };
type Depo = { id: string; tenor_months: number; interest_rate: number; is_promo: boolean };
type Ticker = { id: string; content: string };

function DisplayPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [depo, setDepo] = useState<Depo[]>([]);
  const [ticker, setTicker] = useState<Ticker[]>([]);
  const [idx, setIdx] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      const [m, s, d, t] = await Promise.all([
        supabase.from("media").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("savings_products").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("deposito_rates").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("running_text").select("*").eq("is_active", true).order("sort_order"),
      ]);
      setMedia((m.data ?? []) as Media[]);
      setSavings((s.data ?? []) as Saving[]);
      setDepo((d.data ?? []) as Depo[]);
      setTicker((t.data ?? []) as Ticker[]);
    };
    load();
    const refresh = setInterval(load, 60_000);
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(refresh); clearInterval(clock); };
  }, []);

  useEffect(() => {
    if (media.length === 0) return;
    const cur = media[idx % media.length];
    const ms = (cur.media_type === "image" ? cur.duration_seconds : Math.max(cur.duration_seconds, 8)) * 1000;
    const t = setTimeout(() => setIdx((i) => (i + 1) % media.length), ms);
    return () => clearTimeout(t);
  }, [idx, media]);

  const current = media[idx % Math.max(media.length, 1)];
  const tickerText = ticker.map((t) => t.content).join("   •   ") || "Selamat datang di Bank KCP Telihan";

  return (
    <div className="fixed inset-0 bg-[#0a0f1f] text-white overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="bg-gradient-brand px-6 py-3 flex items-center justify-between shadow-brand">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-1.5"><img src={logo} alt="TDS" className="h-9 w-auto" /></div>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70">Bank KCP Telihan</p>
            <p className="text-sm font-semibold">Inform • Engage • Inspire</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums">{now.toLocaleTimeString("id-ID")}</p>
          <p className="text-xs text-white/70">{now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {/* Main area: media + side panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 p-3 min-h-0">
        {/* Media slider */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-black/40 border border-white/10">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div key={current.id}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0">
                {current.media_type === "image" ? (
                  <img src={current.file_url} alt={current.title} className="w-full h-full object-cover" />
                ) : (
                  <video key={current.id} src={current.file_url} className="w-full h-full object-cover"
                    autoPlay muted playsInline
                    onEnded={() => setIdx((i) => (i + 1) % media.length)} />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <p className="text-2xl font-bold">{current.title}</p>
                </div>
              </motion.div>
            )}
            {!current && (
              <div className="absolute inset-0 flex items-center justify-center text-white/40">
                Upload media in the admin panel to display promotions here.
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column: savings + deposito */}
        <div className="grid grid-rows-2 gap-3 min-h-0">
          <Panel title="Suku Bunga Tabungan" accent="from-blue-500 to-indigo-600">
            <div className="space-y-2 overflow-auto">
              {savings.map((s) => (
                <div key={s.id} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2.5">
                  <span className="font-medium text-sm">{s.name}</span>
                  <span className="text-xl font-bold text-amber-300">{fmtPct(s.interest_rate)}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Suku Bunga Deposito" accent="from-orange-500 to-amber-500">
            <div className="grid grid-cols-2 gap-2">
              {depo.map((d) => (
                <div key={d.id} className="bg-white/5 rounded-lg px-3 py-2 text-center">
                  <p className="text-xs text-white/60">{d.tenor_months} bulan {d.is_promo && "★"}</p>
                  <p className="text-2xl font-extrabold text-amber-300">{fmtPct(d.interest_rate)}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Ticker */}
      <div className="bg-gradient-brand h-12 flex items-center overflow-hidden border-t border-white/10">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-base font-medium px-8">{tickerText}</span>
          <span className="text-base font-medium px-8">{tickerText}</span>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-4 flex flex-col min-h-0">
      <div className={`inline-block self-start text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r ${accent} mb-3`}>
        {title}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}