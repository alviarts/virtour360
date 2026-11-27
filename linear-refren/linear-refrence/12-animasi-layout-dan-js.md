# 12. Animasi, Layout Halaman, dan JavaScript

## Batasan Jujur
Saya **tidak bisa mengunduh bundel JS/CSS Linear** dan tidak punya data durasi atau easing animasinya dari sumber terverifikasi. Bagian "Teramati" di bawah berasal dari halaman yang saya buka; bagian "Rekomendasi" adalah kode **saya** untuk meniru efeknya, bukan kode Linear.

## A. Animasi yang Teramati
| Efek | Lokasi | Bukti |
|---|---|---|
| Video hero berloop | Section Plan, Quality | File `PLANNING-MONITORING.output.av1.crf24.mp4`, `teaser-bg.*.mp4` (poster JPG disediakan) |
| Demo UI yang "hidup" | Hero, tiap section fitur | Counter "1 / 84", waktu "just now", baris berubah status |
| Indikator "Working…" | Daftar PR | Teks dan avatar agen pada baris yang sedang diproses |
| Aktivitas berurutan | Panel issue | Event muncul berurutan: dibuat → label → komentar → PR |
| Tooltip/panel hover | Daftar issue | Aksi muncul saat baris disorot |
| Perubahan status project | Section Plan | Off Track / At Risk / On Track berganti |
| Tombol putar | Halaman Quality | Pintasan keyboard `P` untuk Play teaser |

**Karakter gerak** (dari analisis pihak ketiga dan kesan halaman): halus, pendek, tidak mencolok; fokusnya pada transisi opasitas, posisi kecil, glow dan gradasi lembut, bukan gerak besar.

## B. Layout Halaman Utama
```
┌──────────────────────────────────────────────┐
│ Header sticky: logo | nav | Docs Login Signup│
├──────────────────────────────────────────────┤
│ HERO   judul besar (tengah)                  │
│        sub-copy + badge "New Loops →"        │
│        screenshot aplikasi lebar penuh       │
├──────────────────────────────────────────────┤
│ "A new species of product tool"              │
│  [Purpose-built] [Powered by agents] [Speed] │ ← 3 kolom, Fig 0.1–0.3
├──────────────────────────────────────────────┤
│ Section fitur ×4:                            │
│   judul H2 + paragraf + "Learn more →"       │
│   demo UI lebar (bingkai bergaris tipis)     │
│   chip fitur "Triage +" "Asks +" ...         │
├──────────────────────────────────────────────┤
│ Changelog (daftar vertikal 4 entri)          │
│ Testimoni (kutipan + nama + jabatan)         │
│ CTA: Get started | Contact sales | Download  │
├──────────────────────────────────────────────┤
│ Footer 6 kolom                               │
└──────────────────────────────────────────────┘
```
Ciri: satu kolom terpusat, section dipisah ruang kosong (bukan garis), demo UI jadi elemen terbesar tiap section.

### Layout Aplikasi (dari hero)
```
┌─────────┬───────────────────────┬──────────┐
│ Sidebar │ Judul + deskripsi     │Properties│
│ (panel) │ Aktivitas (timeline)  │ Status   │
│         │ Komentar              │ Priority │
│         │                       │ Assignee │
└─────────┴───────────────────────┴──────────┘
```
Tiga zona: navigasi · konten · metadata.

## C. JavaScript dan Teknologi yang Terdeteksi
| Hal | Temuan | Status |
|---|---|---|
| Hosting gambar | Cloudflare Images (`/cdn-cgi/imagedelivery/...`, parameter `f=auto,fit=scale-down,width=2560`) | teramati |
| Video | MP4 AV1 (kompresi tinggi) + poster | teramati |
| Pemantauan error | Sentry (`sentry-release=linear-web@...`) | teramati di metadata |
| Komponen | Radix UI primitives | [ekstraksi] |
| Aksesibilitas | Link "Skip to content", `theme-color`, `viewport-fit=cover` | teramati |
| Pencarian/command | Pemicu `/` atau `Cmd+K` | [ekstraksi] |
| Sync aplikasi | Linear punya artikel "Scaling the Linear Sync" (arsitektur sync lokal-first) | judul artikel terlihat, isi belum saya baca |
| Framework marketing | Tidak terkonfirmasi | [verifikasi] |

## D. Rekomendasi Implementasi untuk Virtour360 (kode saya)
### Reveal saat scroll (ringan, tanpa library)
```css
.reveal { opacity: 0; transform: translateY(12px);
  transition: opacity .5s cubic-bezier(.2,.7,.2,1), transform .5s cubic-bezier(.2,.7,.2,1); }
.reveal.in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
}
```
```js
const io = new IntersectionObserver((es) => {
  es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
```
### Video latar hemat bandwidth
```html
<video autoplay muted loop playsinline preload="metadata" poster="hero.jpg">
  <source src="hero.av1.mp4" type='video/mp4; codecs="av01.0.05M.08"'>
  <source src="hero.h264.mp4" type="video/mp4">
</video>
```
### Command palette (Cmd/Ctrl+K)
```js
addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault(); openPalette();
  }
});
```
### Header sticky dengan blur
```css
.header { position: sticky; top: 0; backdrop-filter: blur(12px);
  background: rgba(8,9,10,.7); border-bottom: 1px solid rgba(255,255,255,.05); }
```

## E. Cara Mengambil Nilai Asli dengan DevTools
1. Buka linear.app → F12 → tab **Network** → filter `CSS`, `Font`, `JS`, `Media`.
2. **Font**: filter `Font` → catat file `.woff2` dan nama keluarganya.
3. **Token CSS**: tab Elements → pilih `<html>` → Styles → salin semua `--variable`. Atau jalankan di Console:
```js
const cs = getComputedStyle(document.documentElement);
[...document.styleSheets].flatMap(s => { try { return [...s.cssRules]; } catch { return []; } })
  .filter(r => r.selectorText === ':root' || r.selectorText === 'html')
  .flatMap(r => [...r.style]).filter(p => p.startsWith('--'))
  .forEach(p => console.log(p, cs.getPropertyValue(p).trim()));
```
4. **Animasi**: tab **Animations** (More tools) → putar ulang → klik animasi untuk lihat durasi dan easing. Di Console: `document.getAnimations().map(a => a.effect.getTiming())`.
5. **Easing/transition per elemen**: pilih elemen → Computed → cari `transition-*` dan `animation-*`.
6. **Framework**: ketik di Console `window.__NEXT_DATA__`, `window.__NUXT__`, `window.React`; atau pakai ekstensi Wappalyzer.
7. **Aksesibilitas**: Lighthouse (tab Lighthouse) dan emulasi `prefers-reduced-motion` di tab Rendering.

Hasilnya bisa Anda tempel ke percakapan ini; saya bantu menyusunnya menjadi token dan komponen Virtour360.
