import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { fmtPct } from "@/lib/format";
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
    <div className="fixed inset-0 bg-[#fbf7ef] text-slate-900 overflow-hidden flex flex-col">
      <DayakBand className="absolute top-0 left-0 right-0 h-3 z-20" id="top" />

      {/* Top bar */}
      <div className="relative bg-white/90 backdrop-blur border-b border-amber-200 px-6 py-3 flex items-center justify-between shadow-sm mt-3">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-brand rounded-xl p-1.5 shadow-brand"><img src={logo} alt="TDS" className="h-9 w-auto" /></div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#b8530a] font-bold">Bank KCP Telihan</p>
            <p className="text-sm font-bold text-slate-800">Inform • Engage • Inspire</p>
          </div>
        </div>
        <div className="hidden md:block flex-1 mx-6 h-7">
          <DayakPattern className="w-full h-full opacity-80" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold tabular-nums text-[#0e4d72]">{now.toLocaleTimeString("id-ID")}</p>
          <p className="text-[11px] text-slate-500">{now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 min-h-0">
        {/* Media slider — proporsional, contain biar gak kepotong */}
        <div className="lg:col-span-3 relative rounded-3xl overflow-hidden bg-slate-900 border-2 border-amber-300 shadow-[0_20px_60px_-20px_rgba(184,83,10,0.4)]">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div key={current.id}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 flex items-center justify-center">
                {current.media_type === "image" ? (
                  <img src={current.file_url} alt={current.title} className="max-w-full max-h-full w-auto h-auto object-contain" />
                ) : (
                  <video key={current.id} src={current.file_url} className="max-w-full max-h-full w-auto h-auto object-contain"
                    autoPlay muted playsInline
                    onEnded={() => setIdx((i) => (i + 1) % media.length)} />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                  <p className="text-2xl font-bold text-white drop-shadow">{current.title}</p>
                </div>
              </motion.div>
            )}
            {!current && (
              <div className="absolute inset-0 flex items-center justify-center text-white/50 text-center px-6">
                Upload media in the admin panel to display promotions here.
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 grid grid-rows-[1fr_1fr] gap-4 min-h-0">
          <Panel title="Suku Bunga Tabungan" accent="from-[#0e4d72] to-[#1e88c2]">
            <div className="space-y-1.5 overflow-auto h-full pr-1">
              {savings.map((s) => (
                <div key={s.id} className="flex items-center justify-between bg-[#fbf7ef] rounded-xl px-4 py-2.5 border border-amber-100">
                  <span className="font-semibold text-sm text-slate-700 truncate">{s.name}</span>
                  <span className="text-lg font-extrabold text-[#b8530a] tabular-nums">{fmtPct(s.interest_rate)}</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Suku Bunga Deposito" accent="from-[#b8530a] to-[#e0a52c]">
            <div className="grid grid-cols-2 gap-2 overflow-auto h-full content-start pr-1">
              {depo.map((d) => (
                <div key={d.id} className="bg-[#fbf7ef] rounded-xl px-3 py-2 text-center border border-amber-100 relative overflow-hidden">
                  {d.is_promo && <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white">PROMO</span>}
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{d.tenor_months} bulan</p>
                  <p className="text-2xl font-extrabold text-[#0e4d72] tabular-nums">{fmtPct(d.interest_rate)}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Ticker */}
      <div className="relative bg-gradient-to-r from-[#0e4d72] via-[#1e88c2] to-[#0e4d72] h-12 flex items-center overflow-hidden border-t-2 border-amber-400">
        <div className="flex whitespace-nowrap animate-marquee text-white">
          <span className="text-base font-medium px-8">{tickerText}</span>
          <span className="text-base font-medium px-8">{tickerText}</span>
        </div>
      </div>
      <DayakBand className="absolute bottom-0 left-0 right-0 h-3 z-20" id="bot" flip />
    </div>
  );
}

function Panel({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-3xl bg-white border border-amber-200 p-4 flex flex-col min-h-0 shadow-[0_10px_30px_-15px_rgba(14,77,114,0.25)] overflow-hidden">
      <DayakCorner className="absolute -top-3 -right-3 w-20 h-20 opacity-10 text-[#b8530a] pointer-events-none" />
      <div className={`inline-block self-start text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-gradient-to-r ${accent} text-white mb-3 shadow`}>
        {title}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

/* ===== Dayak motif SVGs ===== */
function DayakPattern({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 24" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dayak-p" x="0" y="0" width="40" height="24" patternUnits="userSpaceOnUse">
          <path d="M0 12 L8 4 L16 12 L24 4 L32 12 L40 4" stroke="#b8530a" strokeWidth="1.5" fill="none" />
          <path d="M0 12 L8 20 L16 12 L24 20 L32 12 L40 20" stroke="#0e4d72" strokeWidth="1.5" fill="none" />
          <circle cx="8" cy="12" r="1.5" fill="#e0a52c" />
          <circle cx="24" cy="12" r="1.5" fill="#e0a52c" />
        </pattern>
      </defs>
      <rect width="200" height="24" fill="url(#dayak-p)" />
    </svg>
  );
}

function DayakBand({ className, id, flip }: { className?: string; id: string; flip?: boolean }) {
  const pid = `dayak-band-${id}`;
  return (
    <svg className={className} viewBox="0 0 400 12" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={flip ? { transform: "scaleY(-1)" } : undefined}>
      <defs>
        <pattern id={pid} x="0" y="0" width="20" height="12" patternUnits="userSpaceOnUse">
          <rect width="20" height="12" fill="#0e4d72" />
          <path d="M0 6 L5 0 L10 6 L15 0 L20 6 Z" fill="#e0a52c" />
          <path d="M0 12 L5 6 L10 12 L15 6 L20 12 Z" fill="#b8530a" />
        </pattern>
      </defs>
      <rect width="400" height="12" fill={`url(#${pid})`} />
    </svg>
  );
}

function DayakCorner({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 5 C 50 20, 60 20, 75 40 C 60 50, 60 60, 40 75 C 30 60, 20 60, 5 40 C 20 30, 30 20, 40 5 Z" stroke="currentColor" strokeWidth="2" />
      <path d="M40 20 C 46 30, 52 30, 60 40 C 52 46, 52 52, 40 60 C 34 52, 28 52, 20 40 C 28 34, 34 28, 40 20 Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="3" fill="currentColor" />
    </svg>
  );
}
