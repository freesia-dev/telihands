# Solusi Tampilan Smooth di Sharp Aquos 4K (Android TV)

TV ini chipset-nya lemah untuk efek berat (blur, glass, animasi besar, gradient besar). Browser kiosk seperti Fully/TV Bro pakai WebView bawaan TV yang lebih lambat dari Chrome HP. Solusi dikerjakan 2 tahap.

---

## Tahap 1 — Mode Display khusus TV (web, langsung dipakai)

Buat route baru `/display/tv` yang isinya sama dengan `/display/main` tapi versi ringan:

- **Matikan efek berat**: hapus `blur-3xl`, `glass-card` (backdrop-filter), `dayak-overlay`, `float-slow`, `pulse-glow`, `clock-glow textShadow`, `drop-shadow` besar, gradient lingkaran ambient. Diganti warna solid.
- **Animasi minimum**: Framer Motion `AnimatePresence` diganti fade CSS sederhana (opacity transition 400ms), tanpa scale.
- **Marquee ticker**: pakai `transform: translate3d` + `will-change: transform` dan durasi lebih panjang biar smooth di GPU TV.
- **Media campur (sesuai pilihan)**:
  - Gambar: tetap tampil normal.
  - Video: dimuat ringan — `preload="auto"`, `playsInline`, `muted` default (autoplay TV browser sering blok kalau ada audio), 1 video diputar pada satu waktu, video berikutnya baru di-load saat dibutuhkan (bukan semuanya sekaligus).
  - Kalau video gagal play / error / stalled > 3 detik → otomatis skip ke media berikutnya (fallback ke gambar). Ini mengatasi "video gak keputar" di TV Bro.
- **Resolusi render**: paksa layout 1920x1080 (bukan 4K) lalu CSS `zoom`/scale ke layar. TV-nya panel 4K tapi GPU-nya tidak kuat render canvas 4K untuk efek — render 1080p lebih lancar dan tetap tajam.
- **Auto-reload tiap 30 menit** biar memori WebView tidak menumpuk (penyebab utama patah-patah setelah lama nyala).
- Detection sederhana: kalau dibuka dari `/display/main` dan user-agent mengandung "TV"/"AFT"/"BRAVIA"/"AQUOS", redirect ke `/display/tv`.

Hasil: animasi & video di Fully/TV Bro jauh lebih lancar tanpa ganti aplikasi.

## Tahap 2 — Native Android TV (APK wrapper)

Kalau Tahap 1 masih belum cukup smooth, bungkus jadi APK Android TV:

- **Pendekatan**: Android WebView app sederhana (Kotlin) yang membuka `https://telihands.my.id/display/tv` fullscreen, hardware acceleration on, auto-start saat TV nyala (boot receiver), keep-screen-on, hilangkan status bar.
- **Kenapa lebih lancar dari Fully/TV Bro**: kontrol penuh atas flag WebView (`setLayerType`, `MediaPlaybackRequiresUserGesture=false` → video autoplay dengan suara bisa jalan, cache besar, GPU rasterization).
- **Distribusi**: sideload via USB stick / `adb install` ke TV. Tidak perlu Play Store.
- **Yang saya siapkan**: source project Android Studio + APK build siap install + panduan sideload langkah demi langkah ke Sharp Aquos.

Catatan: Tahap 2 dibuat **di luar codebase web ini** (project Android terpisah), saya sediakan file-nya untuk diunduh. Build APK pertama biasanya cukup, update isi display tetap lewat web (WebView auto-load versi terbaru).

---

## Detail teknis

- File baru: `src/routes/display.tv.tsx` (varian ringan dari `display.main.tsx`).
- File baru: `src/styles.css` tambah block `.tv-mode { ... }` yang reset blur/backdrop/shadow.
- `display.main.tsx` tambah redirect ke `/display/tv` bila UA TV terdeteksi.
- Video element: tambah handler `onError`, `onStalled`, timeout 3s → next item.
- Auto-reload: `setTimeout(() => location.reload(), 30*60*1000)`.
- Android wrapper: project Kotlin minimal (1 Activity + WebView), `targetSdk 34`, `LEANBACK_LAUNCHER` intent filter untuk muncul di home Android TV.

Konfirmasi dulu sebelum saya implement Tahap 1 dan siapkan Tahap 2.
