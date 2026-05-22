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
      <header className="relative z-10 px-[clamp(16px,2vw,40px)] py-[clamp(10px,1.2vw,20px)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={logo} alt="TDS" className="h-[clamp(36px,4vw,64px)] w-auto drop-shadow-[0_4px_12px_rgba(212,175,55,0.35)]" />
          <div className="leading-tight">
            <p className="font-display font-extrabold tracking-wide" style={{ fontSize: "clamp(18px,2vw,32px)" }}>
              <span className="text-white">BANK</span><span className="text-tds-gold">ALTIMTARA</span>
            </p>
            <p className="font-display font-semibold text-white/90 -mt-0.5" style={{ fontSize: "clamp(11px,0.95vw,16px)" }}>Bank KCP Telihan</p>
            <p className="tracking-[0.45em] text-tds-gold font-display mt-0.5" style={{ fontSize: "clamp(8px,0.6vw,12px)" }}>INFORM • ENGAGE • INSPIRE</p>
          </div>
        </div>
        <div className="flex items-center gap-[clamp(8px,1vw,16px)]">
          <div className="flex items-baseline gap-2">
            <span className="clock-glow font-bold leading-none tabular-nums" style={{ fontSize: "clamp(32px,4vw,64px)" }}>{hhmm}</span>
            <span className="text-tds-gold font-numeric font-bold tabular-nums leading-none" style={{ fontSize: "clamp(18px,2vw,32px)" }}>{ss}</span>
          </div>
          <div className="w-px bg-tds-gold/40" style={{ height: "clamp(32px,3.5vw,56px)" }} />
          <div className="leading-tight text-right">
            <p className="font-display font-extrabold text-tds-gold tracking-widest" style={{ fontSize: "clamp(12px,1.1vw,20px)" }}>{weekday}</p>
            <p className="font-display font-semibold text-white tracking-wider" style={{ fontSize: "clamp(11px,0.95vw,16px)" }}>{dateStr}</p>
          </div>
        </div>
      </header>

      {/* Main area */}
      <main
        className="relative z-10 flex-1 gap-[clamp(8px,1vw,20px)] px-[clamp(12px,2vw,40px)] pb-[clamp(8px,1vw,20px)] min-h-0"
        style={{ display: "grid", gridTemplateColumns: "6fr 4fr" }}
      >
        {/* LEFT 60% — media */}
        <section style={{ minWidth: 0, minHeight: 0 }} className="relative rounded-3xl overflow-hidden glass-card pulse-glow flex items-center justify-center">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div key={current.id}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center bg-black/60 overflow-hidden">
                {/* Blurred background for non-cropping fit */}
                {current.media_type === "image" ? (
                  <img src={current.file_url} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50" />
                ) : null}
                {current.media_type === "image" ? (
                  <img src={current.file_url} alt={current.title} className="relative max-w-full max-h-full w-auto h-auto object-contain" />
                ) : (
                  <video key={current.id} src={current.file_url} className="relative max-w-full max-h-full w-auto h-auto object-contain"
                    autoPlay muted playsInline
                    onEnded={() => setIdx((i) => (i + 1) % media.length)} />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#071229] via-[#071229]/70 to-transparent p-[clamp(12px,1.5vw,28px)]">
                  <div className="h-px w-[clamp(40px,4vw,80px)] bg-[color:var(--tds-gold)] mb-2" />
                  <p className="font-display font-bold text-white drop-shadow truncate" style={{ fontSize: "clamp(16px,1.8vw,32px)" }}>{current.title}</p>
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

        {/* RIGHT 40% — info panels */}
        <aside style={{ minWidth: 0, minHeight: 0 }} className="flex flex-col gap-[clamp(8px,1vw,20px)]">
          <Panel title="SUKU BUNGA TABUNGAN" icon="wallet">
            <div className="flex flex-col h-full justify-between gap-[clamp(2px,0.3vw,8px)]">
              {savings.length === 0 && (
                <div className="text-[color:var(--tds-text-soft)] text-sm">Belum ada produk tabungan.</div>
              )}
              {savings.map((s, i) => (
                <div key={s.id} className={`flex items-center justify-between gap-3 min-h-0 py-[clamp(2px,0.35vw,8px)] ${i !== savings.length - 1 ? "border-b border-white/5" : ""}`}>
                  <span className="font-display text-white/95 truncate" style={{ fontSize: `clamp(11px, ${Math.max(1.4 - savings.length * 0.05, 0.7)}vw, 20px)` }}>{s.name}</span>
                  <span className="font-numeric font-extrabold text-tds-gold tabular-nums shrink-0" style={{ fontSize: `clamp(13px, ${Math.max(1.8 - savings.length * 0.06, 0.95)}vw, 26px)` }}>{fmtPct(s.interest_rate)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="SUKU BUNGA DEPOSITO" icon="vault">
            {(() => {
              if (depo.length === 0) {
                return <div className="text-[color:var(--tds-text-soft)] text-sm">Belum ada rate deposito.</div>;
              }
              const topIdx = depo.reduce((best, d, i, arr) => (d.interest_rate > arr[best].interest_rate ? i : best), 0);
              const top = depo[topIdx];
              const rest = depo.filter((_, i) => i !== topIdx);
              return (
                <div className="flex h-full gap-[clamp(6px,0.8vw,12px)] min-h-0 pt-[clamp(8px,1vw,16px)]">
                  {/* Featured highest */}
                  <div className="relative flex flex-col items-center justify-center text-center rounded-2xl px-[clamp(6px,0.8vw,14px)] pt-[clamp(14px,1.6vw,22px)] pb-[clamp(8px,1vw,16px)] shrink-0 basis-[42%]"
                    style={{
                      background: "linear-gradient(145deg, rgba(212,175,55,0.22), rgba(247,215,116,0.08))",
                      border: "1.5px solid var(--tds-gold)",
                      boxShadow: "0 0 24px rgba(212,175,55,0.35), inset 0 0 16px rgba(212,175,55,0.12)",
                    }}>
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[color:var(--tds-gold)] text-[#071229] font-display font-extrabold tracking-wider px-2 py-0.5 rounded-full shadow"
                      style={{ fontSize: "clamp(8px,0.65vw,12px)" }}>★ TERTINGGI</span>
                    <p className="text-white/85 uppercase tracking-wider font-display font-semibold leading-tight mt-1" style={{ fontSize: "clamp(10px,0.85vw,16px)" }}>{top.tenor_months} BULAN</p>
                    <p className="font-numeric font-extrabold text-tds-gold tabular-nums leading-none mt-1" style={{ fontSize: "clamp(24px,2.8vw,52px)", textShadow: "0 0 16px rgba(247,215,116,0.5)" }}>{fmtPct(top.interest_rate)}</p>
                    <p className="text-white/60 font-display tracking-wide mt-1" style={{ fontSize: "clamp(7px,0.55vw,11px)" }}>p.a</p>
                  </div>
                  {/* Others */}
                  <div className="flex-1 min-w-0 grid gap-[clamp(4px,0.5vw,10px)] content-center" style={{ gridTemplateColumns: rest.length <= 2 ? "1fr" : "1fr 1fr" }}>
                    {rest.map((d) => (
                      <div key={d.id} className="relative bg-white/[0.04] rounded-xl px-2 py-[clamp(4px,0.6vw,10px)] text-center border border-tds-gold/15 flex flex-col justify-center">
                        {d.is_promo && (
                          <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-[color:var(--tds-gold)] text-[#071229] font-bold px-1.5 py-0.5 rounded-full shadow">★</span>
                        )}
                        <p className="text-white/80 uppercase tracking-wider font-display font-semibold leading-tight" style={{ fontSize: "clamp(8px,0.65vw,12px)" }}>{d.tenor_months} BULAN</p>
                        <p className="font-numeric font-extrabold text-tds-gold tabular-nums leading-tight mt-0.5" style={{ fontSize: "clamp(13px,1.3vw,24px)" }}>{fmtPct(d.interest_rate)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </Panel>
        </aside>
      </main>

      {/* Ticker */}
      <footer className="relative z-10 flex items-center overflow-hidden border-t border-tds-gold/30"
        style={{ height: "clamp(40px,4vw,72px)", maskImage: "linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 5%, #000 95%, transparent)" }}
      >
        <div className="absolute inset-0 -z-10"
        style={{ background: "linear-gradient(90deg, #071229 0%, #0D2A63 50%, #071229 100%)" }}>
        </div>
        <div className="shrink-0 h-full px-4 flex items-center">
          <span className="text-tds-gold" style={{ fontSize: "clamp(16px,1.5vw,28px)" }}>✦</span>
        </div>
        <div className="flex whitespace-nowrap animate-marquee">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center">
              {tickerItems.map((item, i) => (
                <span key={`${dup}-${i}`} className="flex items-center px-[clamp(16px,2vw,40px)]">
                  <span className="text-tds-gold mr-3">◆</span>
                  <span className="font-medium text-white/95 font-display tracking-wide" style={{ fontSize: "clamp(12px,1.1vw,20px)" }}>{item}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </footer>
      {/* Divider line above footer */}
      <div className="pointer-events-none absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-tds-gold to-transparent" style={{ bottom: "clamp(40px,4vw,72px)" }} />
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon?: "wallet" | "vault"; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-[20px] p-[clamp(10px,1.2vw,24px)] flex flex-col min-h-0 overflow-hidden flex-1">
      <div className="flex items-center gap-3 mb-2">
        <div className="rounded-full border border-tds-gold/50 flex items-center justify-center text-tds-gold shrink-0"
          style={{ width: "clamp(28px,2.4vw,42px)", height: "clamp(28px,2.4vw,42px)", fontSize: "clamp(14px,1.2vw,20px)" }}>
          {icon === "vault" ? "🏦" : "👛"}
        </div>
        <h3 className="font-display font-extrabold text-tds-gold tracking-wider leading-tight" style={{ fontSize: "clamp(13px,1.2vw,22px)" }}>{title}</h3>
      </div>
      <div className="gold-divider mb-3" />
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}