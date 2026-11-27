# Penerapan `linear-refren` ke Virtour360

Sumber: `virtour360/linear-refren/linear-refrence/*.md` (12 dokumen analisis UI/UX linear.app, 27 Nov 2026). Analisis token asli juga ada di [LINEAR-REFERENCE.md](LINEAR-REFERENCE.md) dan [12-visual-linear.md](12-visual-linear.md).

## Yang sudah ada sebelumnya
- Palet `#08090a` / `#0f1011` / `#23252a`, teks `#f7f8f8` / `#d0d6e0` / `#8a8f98` / `#62666d`.
- Inter Variable + Berkeley Mono di-host lokal, `font-feature-settings: cv01, ss03`.
- Header 72px sticky + blur, dropdown Product/Resources, weight 510, tracking `-0.022em`.
- Stage produk = UI Studio asli (bukan screenshot), fade kanan, shadow, scene bisa diklik.
- `Reveal` saat scroll, dot grid, marquee, agent dots, reduced-motion.
- Changelog, testimoni singkat, login full-page.

## Yang baru diterapkan dari referensi
| Poin referensi | Implementasi |
|---|---|
| Weight 700 tidak dipakai | `@theme` menimpa `--font-weight-bold: 590`, `--font-weight-semibold: 510` |
| Skip-to-content link | `<a href="#main-content">` di Home + `id="main-content"` pada `<main>` |
| "Fig 0.1 / 0.2 / 0.3" | Label mono di atas tiga judul pilar |
| Chip fitur "+" | `Scene +`, `Hotspot +`, `Media +`, `Group +`, `Weblog +`, `Undo +`, `Publish +`, `QR +`, `Embed +` |
| Status tur berwarna | `Project.status`: draft / review / published, badge + `<select>` di Dashboard, warna `#27a644` / `#f2c14e` / abu |
| Command palette `⌘K` | Global keydown di `App.tsx`, panel aksi: upload scene, hotspot, Design, Publish, Dashboard, Home |
| Sidebar personal-first | Blok **Pulse · Scene saya · Favorit** di `LeftSidebar`, menyaring daftar scene |
| Satu ide per section + tautan | Seksi fitur tetap satu paragraf + satu tautan |
| Testimoni pendek | Tiga kutipan 1 kalimat + nama di customer strip |

## Catatan
- Referensi menyarankan mode terang untuk presentasi; belum diterapkan karena tema dark-first sesuai permintaan.
- Loading progress viewer sengaja dihapus sebelumnya demi transisi instan.
- Bisnis produk tetap Virtour360 (Tur, Scene, Hotspot), bukan istilah Linear (Issue, Cycle, Initiative).

## Verifikasi
`npm run typecheck`, `npm test` (46/46), `npm run build` lolos. Verifikasi browser: skip-link + `main-content` + `Fig 0.1` + chip `Scene +` + testimoni tampil; Studio menampilkan `Pulse · Scene saya · Favorit` dan `⌘K · perintah` merespons.
