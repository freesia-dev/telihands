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
    <div className="fixed inset-0 bg-tds text-[color:var(--tds-text)] overflow-hidden flex flex-col">
      {/* Ambient ethnic overlay */}
      <div className="pointer-events-none absolute inset-0 dayak-overlay opacity-100" />
      <div className="pointer-events-none absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-[#3B82F6]/15 blur-3xl float-slow" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-[#D4AF37]/10 blur-3xl float-slow" />

      {/* Header */}
      <header className="relative z-10 bg-tds-header h-[72px] px-6 flex items-center justify-between border-b border-[color:var(--tds-glass-border)]">
        <div className="flex items-center gap-4">
          <div className="glass-card rounded-2xl px-4 py-2 flex items-center">
            <img src={logo} alt="TDS" className="h-9 w-auto" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-tds-gold font-display">Bank KCP Telihan</p>
            <p className="text-base font-display font-semibold text-[color:var(--tds-text)]">Digital Signage • Inform · Engage · Inspire</p>
          </div>
        </div>
        <div className="text-right">
          <p className="clock-glow text-[34px] font-bold leading-none tabular-nums">
            {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <p className="text-[11px] tracking-widest uppercase mt-1 text-[color:var(--tds-text-soft)]">
            {now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </header>

      {/* Main area */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-10 gap-4 p-4 min-h-0">
        {/* LEFT 70% — media */}
        <section className="lg:col-span-7 relative rounded-3xl overflow-hidden glass-card pulse-glow flex items-center justify-center">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div key={current.id}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center bg-black/40">
                {current.media_type === "image" ? (
                  <img src={current.file_url} alt={current.title} className="w-full h-full object-contain" />
                ) : (
                  <video key={current.id} src={current.file_url} className="w-full h-full object-contain"
                    autoPlay muted playsInline
                    onEnded={() => setIdx((i) => (i + 1) % media.length)} />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#071229] via-[#071229]/70 to-transparent p-7">
                  <div className="h-px w-20 bg-[color:var(--tds-gold)] mb-3" />
                  <p className="text-2xl lg:text-3xl font-display font-bold text-white drop-shadow">{current.title}</p>
                </div>
              </motion.div>
            )}
            {!current && (
              <div className="absolute inset-0 flex items-center justify-center text-[color:var(--tds-text-soft)] text-sm">
                Upload media in the admin panel to display promotions here.
              </div>
            )}
          </AnimatePresence>

          {/* corner ornament */}
          <div className="pointer-events-none absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-[color:var(--tds-gold)]/60 rounded-tl-xl" />
          <div className="pointer-events-none absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-[color:var(--tds-gold)]/60 rounded-tr-xl" />
          <div className="pointer-events-none absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-[color:var(--tds-gold)]/60 rounded-bl-xl" />
          <div className="pointer-events-none absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-[color:var(--tds-gold)]/60 rounded-br-xl" />
        </section>

        {/* RIGHT 30% — info panels */}
        <aside className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          <Panel title="Suku Bunga Tabungan" subtitle="Saving Rates">
            <div className="flex flex-col gap-1.5 h-full">
              {savings.length === 0 && (
                <div className="text-[color:var(--tds-text-soft)] text-sm">Belum ada produk tabungan.</div>
              )}
              {savings.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 bg-white/[0.03] rounded-xl px-3 py-2 border border-white/5 hover:border-[color:var(--tds-gold)]/30 transition">
                  <span className="font-display text-sm truncate">{s.name}</span>
                  <span className="font-numeric text-lg font-bold text-tds-glow tabular-nums shrink-0">{fmtPct(s.interest_rate)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <div className="shrink-0">
            <Panel title="Suku Bunga Deposito" subtitle="Deposit Rates">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {depo.length === 0 && (
                  <div className="col-span-full text-[color:var(--tds-text-soft)] text-sm">Belum ada rate deposito.</div>
                )}
                {depo.map((d) => (
                  <div key={d.id} className="relative bg-white/[0.03] rounded-xl px-1.5 py-2 text-center border border-white/5">
                    {d.is_promo && (
                      <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-[color:var(--tds-gold)] text-[#071229] font-bold px-1.5 py-0.5 rounded-full shadow">★</span>
                    )}
                    <p className="text-[10px] text-[color:var(--tds-text-soft)] uppercase tracking-wide leading-tight">{d.tenor_months} bln</p>
                    <p className="font-numeric text-base sm:text-lg font-extrabold text-tds-glow tabular-nums leading-tight mt-0.5">{fmtPct(d.interest_rate)}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </aside>
      </main>

      {/* Ticker */}
      <footer className="relative z-10 h-[50px] flex items-center overflow-hidden border-t border-[color:var(--tds-gold)]/15"
        style={{ background: "rgba(13,42,99,0.95)" }}>
        <div className="shrink-0 h-full px-5 flex items-center bg-gradient-to-r from-[#0D2A63] to-transparent">
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-tds-gold font-display">INFO ▸</span>
        </div>
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-base font-medium px-8 text-[color:var(--tds-text)]">{tickerText}</span>
          <span className="text-base font-medium px-8 text-[color:var(--tds-text)]">{tickerText}</span>
        </div>
      </footer>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden flex-1">
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-tds-gold font-display">{subtitle}</p>
          <h3 className="font-display font-bold text-base text-[color:var(--tds-text)] leading-tight">{title}</h3>
        </div>
        <div className="w-2 h-2 rounded-full bg-[color:var(--tds-gold)] shadow-[0_0_12px_rgba(212,175,55,0.8)]" />
      </div>
      <div className="gold-divider mb-3" />
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}