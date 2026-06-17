import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtPct } from "@/lib/format";
import logo from "@/assets/tds-logo.png";

export const Route = createFileRoute("/display/tv")({
  head: () => ({ meta: [
    { title: "Display TV — Telihan Digital Signage" },
    { name: "viewport", content: "width=device-width, initial-scale=1, user-scalable=no" },
  ] }),
  component: DisplayTvPage,
});

type Media = { id: string; title: string; file_url: string; media_type: "image" | "video"; duration_seconds: number };
type Saving = { id: string; name: string; interest_rate: number };
type Depo = { id: string; tenor_months: number; interest_rate: number; is_promo: boolean };
type Ticker = { id: string; content: string };

const TZ = "Asia/Makassar";
const STALL_TIMEOUT_MS = 3000;
// Browser TV sering reload/membuang cache; auto-reload terlalu sering = download ulang
// semua video → biaya cloud melonjak. Diperpanjang jadi 6 jam.
const AUTO_RELOAD_MS = 6 * 60 * 60 * 1000;

function DisplayTvPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [depo, setDepo] = useState<Depo[]>([]);
  const [ticker, setTicker] = useState<Ticker[]>([]);
  const [idx, setIdx] = useState(0);
  const [now, setNow] = useState(new Date());
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // URL hasil prefetch (blob) per media.id — di-cache di memori, jadi file
  // hanya di-download SEKALI per sesi, sisanya dipakai ulang dari RAM.
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});

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
    const reload = setTimeout(() => location.reload(), AUTO_RELOAD_MS);
    return () => { clearInterval(refresh); clearInterval(clock); clearTimeout(reload); };
  }, []);

  // Prefetch tiap file media ke blob URL — sekali per id selama sesi hidup.
  // Kalau daftar media berubah (item dihapus admin), revoke blob lama supaya RAM
  // tidak menumpuk.
  useEffect(() => {
    let cancelled = false;
    const activeIds = new Set(media.map((m) => m.id));
    media.forEach((m) => {
      if (blobUrls[m.id]) return;
      fetch(m.file_url, { cache: "force-cache" })
        .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
        .then((b) => {
          if (cancelled) return;
          const url = URL.createObjectURL(b);
          setBlobUrls((prev) => (prev[m.id] ? prev : { ...prev, [m.id]: url }));
        })
        .catch((e) => console.warn("[tv] prefetch gagal", m.title, e));
    });
    // bersihkan blob untuk media yang sudah dihapus
    setBlobUrls((prev) => {
      let changed = false;
      const next: Record<string, string> = {};
      for (const [id, url] of Object.entries(prev)) {
        if (activeIds.has(id)) next[id] = url;
        else { URL.revokeObjectURL(url); changed = true; }
      }
      return changed ? next : prev;
    });
    return () => { cancelled = true; };
  }, [media]);

  const next = () => setIdx((i) => (media.length ? (i + 1) % media.length : 0));

  useEffect(() => {
    if (media.length === 0) return;
    const cur = media[idx % media.length];
    if (cur.media_type === "image") {
      const t = setTimeout(next, Math.max(cur.duration_seconds, 5) * 1000);
      return () => clearTimeout(t);
    }
    // video — rewind & play elemen yang sudah dimount; fallback via event handler
    const v = videoRefs.current[cur.id];
    if (v) {
      try { v.currentTime = 0; v.play().catch(() => {}); } catch {}
    }
    const hardMax = setTimeout(next, Math.max(cur.duration_seconds, 8) * 1000 + 5000);
    return () => clearTimeout(hardMax);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, media]);

  // Pause video yang tidak aktif supaya tidak makan CPU/bandwidth saat di luar layar
  useEffect(() => {
    const cur = media[idx % Math.max(media.length, 1)];
    Object.entries(videoRefs.current).forEach(([id, el]) => {
      if (!el) return;
      if (cur && id === cur.id) return;
      try { el.pause(); } catch {}
    });
  }, [idx, media]);

  const armStallTimer = () => {
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    stallTimerRef.current = setTimeout(() => {
      console.warn("[tv] video stalled, skipping");
      next();
    }, STALL_TIMEOUT_MS);
  };
  const clearStallTimer = () => {
    if (stallTimerRef.current) { clearTimeout(stallTimerRef.current); stallTimerRef.current = null; }
  };

  const current = media[idx % Math.max(media.length, 1)];
  const hhmm = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  const ss = now.toLocaleTimeString("id-ID", { second: "2-digit", timeZone: TZ }).slice(-2);
  const weekday = now.toLocaleDateString("id-ID", { weekday: "long", timeZone: TZ }).toUpperCase();
  const dateStr = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: TZ }).toUpperCase();
  const tickerItems = ticker.length > 0 ? ticker.map((t) => t.content) : [
    "Deposito mulai 2,25% p.a",
    "Tabungan Simpeda mudah & aman",
    "Buka rekening sekarang makin mudah",
    "Gunakan mobile banking Bankaltimtara",
  ];

  return (
    <div className="tv-mode fixed inset-0 bg-tds text-[color:var(--tds-text)] overflow-hidden flex flex-col">
      {/* Header */}
      <header className="relative z-10 px-[clamp(16px,2vw,40px)] py-[clamp(10px,1.2vw,20px)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={logo} alt="TDS" className="h-[clamp(36px,4vw,64px)] w-auto" />
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

      {/* Main */}
      <main
        className="relative z-10 flex-1 gap-[clamp(8px,1vw,20px)] px-[clamp(12px,2vw,40px)] pb-[clamp(8px,1vw,20px)] min-h-0"
        style={{ display: "grid", gridTemplateColumns: "6fr 4fr" }}
      >
        {/* LEFT — media: SEMUA item dimount sekali, hanya opacity yang ditukar
            agar tidak ada re-fetch tiap rotasi. */}
        <section style={{ minWidth: 0, minHeight: 0 }} className="relative rounded-2xl overflow-hidden glass-card flex items-center justify-center bg-black">
          {media.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-[color:var(--tds-text-soft)] text-sm">
              Belum ada media aktif.
            </div>
          )}
          {media.map((m, i) => {
            const isActive = current?.id === m.id;
            const src = blobUrls[m.id] ?? m.file_url;
            return (
              <div
                key={m.id}
                className="absolute inset-0 flex items-center justify-center overflow-hidden tv-fade"
                style={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? "auto" : "none", zIndex: isActive ? 2 : 1 }}
                aria-hidden={!isActive}
              >
                {m.media_type === "image" ? (
                  <img
                    src={src}
                    alt={m.title}
                    className="relative max-w-full max-h-full w-auto h-auto object-contain"
                    onError={() => { if (isActive) next(); }}
                  />
                ) : (
                  <video
                    ref={(el) => { videoRefs.current[m.id] = el; }}
                    src={src}
                    className="relative max-w-full max-h-full w-auto h-auto object-contain"
                    muted
                    playsInline
                    preload="auto"
                    onLoadStart={() => { if (isActive) armStallTimer(); }}
                    onWaiting={() => { if (isActive) armStallTimer(); }}
                    onStalled={() => { if (isActive) armStallTimer(); }}
                    onCanPlay={clearStallTimer}
                    onPlaying={clearStallTimer}
                    onEnded={() => { if (isActive) { clearStallTimer(); next(); } }}
                    onError={() => { if (isActive) { clearStallTimer(); next(); } }}
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-[clamp(10px,1.4vw,24px)]">
                  <div className="h-px w-[clamp(40px,4vw,80px)] bg-[color:var(--tds-gold)] mb-2" />
                  <p className="font-display font-bold text-white truncate" style={{ fontSize: "clamp(16px,1.8vw,32px)" }}>{m.title}</p>
                </div>
              </div>
            );
          })}
        </section>

        {/* RIGHT — info */}
        <aside style={{ minWidth: 0, minHeight: 0 }} className="flex flex-col gap-[clamp(8px,1vw,20px)]">
          <Panel title="SUKU BUNGA TABUNGAN" icon="wallet">
            <div className="flex flex-col h-full justify-between gap-[clamp(2px,0.3vw,8px)]">
              {savings.length === 0 && (
                <div className="text-[color:var(--tds-text-soft)] text-sm">Belum ada produk tabungan.</div>
              )}
              {savings.map((s, i) => (
                <div key={s.id} className={`flex items-center justify-between gap-3 min-h-0 py-[clamp(2px,0.35vw,8px)] ${i !== savings.length - 1 ? "border-b border-white/10" : ""}`}>
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
                  <div className="relative flex flex-col items-center justify-center text-center rounded-2xl px-[clamp(6px,0.8vw,14px)] pt-[clamp(14px,1.6vw,22px)] pb-[clamp(8px,1vw,16px)] shrink-0 basis-[42%]"
                    style={{ background: "rgba(212,175,55,0.18)", border: "1.5px solid var(--tds-gold)" }}>
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[color:var(--tds-gold)] text-[#071229] font-display font-extrabold tracking-wider px-2 py-0.5 rounded-full"
                      style={{ fontSize: "clamp(8px,0.65vw,12px)" }}>★ TERTINGGI</span>
                    <p className="text-white/85 uppercase tracking-wider font-display font-semibold leading-tight mt-1" style={{ fontSize: "clamp(10px,0.85vw,16px)" }}>{top.tenor_months} BULAN</p>
                    <p className="font-numeric font-extrabold text-tds-gold tabular-nums leading-none mt-1" style={{ fontSize: "clamp(24px,2.8vw,52px)" }}>{fmtPct(top.interest_rate)}</p>
                    <p className="text-white/60 font-display tracking-wide mt-1" style={{ fontSize: "clamp(7px,0.55vw,11px)" }}>p.a</p>
                  </div>
                  <div className="flex-1 min-w-0 grid gap-[clamp(4px,0.5vw,10px)] content-center" style={{ gridTemplateColumns: rest.length <= 2 ? "1fr" : "1fr 1fr" }}>
                    {rest.map((d) => (
                      <div key={d.id} className="relative bg-white/[0.06] rounded-xl px-2 py-[clamp(4px,0.6vw,10px)] text-center border border-tds-gold/20 flex flex-col justify-center">
                        {d.is_promo && (
                          <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-[color:var(--tds-gold)] text-[#071229] font-bold px-1.5 py-0.5 rounded-full">★</span>
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
        style={{ height: "clamp(40px,4vw,72px)", background: "linear-gradient(90deg, #071229 0%, #0D2A63 50%, #071229 100%)" }}
      >
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
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon?: "wallet" | "vault"; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-[18px] p-[clamp(10px,1.2vw,24px)] flex flex-col min-h-0 overflow-hidden flex-1">
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