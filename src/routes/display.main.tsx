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
  const hhmm = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const ss = now.toLocaleTimeString("id-ID", { second: "2-digit" }).slice(-2);
  const weekday = now.toLocaleDateString("id-ID", { weekday: "long" }).toUpperCase();
  const dateStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
  const tickerItems = ticker.length > 0 ? ticker.map((t) => t.content) : [
    "Deposito mulai 2,25% p.a",
    "Tabungan Simpeda mudah & aman",
    "Buka rekening sekarang makin mudah",
    "Gunakan mobile banking Bankaltimtara",
  ];

  return (
    <div className="fixed inset-0 bg-tds text-[color:var(--tds-text)] overflow-hidden flex flex-col">
      {/* Ambient ethnic overlay */}
      <div className="pointer-events-none absolute inset-0 dayak-overlay opacity-100" />
      {/* Side dayak motif columns */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-10 md:w-14 dayak-side dayak-side-left opacity-70" />
      <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-10 md:w-14 dayak-side dayak-side-right opacity-70" />
      <div className="pointer-events-none absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-[#3B82F6]/15 blur-3xl float-slow" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-[#D4AF37]/10 blur-3xl float-slow" />

      {/* Header */}
      <header className="relative z-10 h-[88px] px-6 md:px-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logo} alt="TDS" className="h-12 w-auto drop-shadow-[0_4px_12px_rgba(212,175,55,0.35)]" />
          <div className="leading-tight">
            <p className="font-display font-extrabold text-2xl md:text-3xl tracking-wide">
              <span className="text-white">BANK</span><span className="text-tds-gold">ALTIMTARA</span>
            </p>
            <p className="text-sm font-display font-semibold text-white/90 -mt-0.5">Bank KCP Telihan</p>
            <p className="text-[10px] tracking-[0.45em] text-tds-gold font-display mt-0.5">INFORM • ENGAGE • INSPIRE</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-2">
            <span className="clock-glow text-[44px] md:text-[54px] font-bold leading-none tabular-nums">{hhmm}</span>
            <span className="text-tds-gold font-numeric text-2xl md:text-3xl font-bold tabular-nums leading-none">{ss}</span>
          </div>
          <div className="h-12 w-px bg-tds-gold/40" />
          <div className="leading-tight text-right">
            <p className="font-display font-extrabold text-tds-gold tracking-widest text-base md:text-lg">{weekday}</p>
            <p className="font-display font-semibold text-white text-sm md:text-base tracking-wider">{dateStr}</p>
          </div>
        </div>
      </header>

      {/* Main area */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-10 gap-4 px-4 md:px-10 pb-4 min-h-0">
        {/* LEFT 70% — media */}
        <section className="lg:col-span-65 relative rounded-3xl overflow-hidden glass-card pulse-glow flex items-center justify-center lg:col-span-6">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div key={current.id}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center bg-black/40">
                {current.media_type === "image" ? (
                  <img src={current.file_url} alt={current.title} className="w-full h-full object-cover" />
                ) : (
                  <video key={current.id} src={current.file_url} className="w-full h-full object-cover"
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
        <aside className="lg:col-span-4 flex flex-col gap-4 min-h-0">
          <Panel title="SUKU BUNGA TABUNGAN" icon="wallet">
            <div className="flex flex-col h-full justify-around">
              {savings.length === 0 && (
                <div className="text-[color:var(--tds-text-soft)] text-sm">Belum ada produk tabungan.</div>
              )}
              {savings.map((s, i) => (
                <div key={s.id} className={`flex items-center justify-between gap-3 py-2 ${i !== savings.length - 1 ? "border-b border-white/5" : ""}`}>
                  <span className="font-display text-base lg:text-lg text-white/95 truncate">{s.name}</span>
                  <span className="font-numeric text-xl lg:text-2xl font-extrabold text-tds-gold tabular-nums shrink-0">{fmtPct(s.interest_rate)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="SUKU BUNGA DEPOSITO" icon="vault">
            <div className="grid grid-cols-3 gap-2 h-full content-center">
              {depo.length === 0 && (
                <div className="col-span-full text-[color:var(--tds-text-soft)] text-sm">Belum ada rate deposito.</div>
              )}
              {depo.map((d) => (
                <div key={d.id} className="relative bg-white/[0.04] rounded-xl px-2 py-3 text-center border border-tds-gold/15">
                  {d.is_promo && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-[color:var(--tds-gold)] text-[#071229] font-bold px-1.5 py-0.5 rounded-full shadow">★</span>
                  )}
                  <p className="text-[11px] text-white/80 uppercase tracking-wider font-display font-semibold leading-tight">{d.tenor_months} BULAN</p>
                  <p className="font-numeric text-2xl lg:text-3xl font-extrabold text-tds-gold tabular-nums leading-tight mt-1">{fmtPct(d.interest_rate)}</p>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </main>

      {/* Ticker */}
      <footer className="relative z-10 h-[56px] flex items-center overflow-hidden border-t border-tds-gold/30"
        style={{ background: "linear-gradient(90deg, #071229 0%, #0D2A63 50%, #071229 100%)" }}>
        <div className="shrink-0 h-full px-4 flex items-center">
          <span className="text-tds-gold text-2xl">✦</span>
        </div>
        <div className="flex whitespace-nowrap animate-marquee">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center">
              {tickerItems.map((item, i) => (
                <span key={`${dup}-${i}`} className="flex items-center px-8">
                  <span className="text-tds-gold mr-3">◆</span>
                  <span className="text-[15px] font-medium text-white/95 font-display tracking-wide">{item}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </footer>
      {/* Center divider line over footer */}
      <div className="pointer-events-none absolute bottom-[56px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-tds-gold to-transparent" />
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon?: "wallet" | "vault"; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col min-h-0 overflow-hidden flex-1">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full border border-tds-gold/50 flex items-center justify-center text-tds-gold text-lg">
          {icon === "vault" ? "🏦" : "👛"}
        </div>
        <h3 className="font-display font-extrabold text-lg lg:text-xl text-tds-gold tracking-wider leading-tight">{title}</h3>
      </div>
      <div className="gold-divider mb-3" />
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}