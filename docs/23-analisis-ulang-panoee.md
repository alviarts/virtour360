# 23 — Analisis ulang sistem Panoee (Nov 2026)

Analisis ini menggantikan status pada [10-panoee-asli-komparasi.md](10-panoee-asli-komparasi.md) dan
[00-DOKUMENTASI-FITUR-LENGKAP.md](00-DOKUMENTASI-FITUR-LENGKAP.md). Kedua dokumen itu masih berguna
sebagai arsip riset UI, tetapi tabel ✅/🟡/❌-nya sudah tidak cocok dengan kode `virtour360` saat ini.

## Sumber

1. Situs/dokumentasi Panoee live (diakses 2026-11-27): `panoee.com`, `/documents`, `/roadmap`, `/pricing`.
2. Arsip riset lokal: `docs/RESEARCH.md`, `docs/10-panoee-asli-komparasi.md`,
   `docs/11-panoee-paths.md`, `docs/00-DOKUMENTASI-FITUR-LENGKAP.md`, `FEATURE_DOCS/`.
   Salinan di `FEATURE_DOCS/` identik dengan salinan di `docs/` dan ditandai sebagai versi lama oleh `INDEX.md`.
3. Inventaris kode `virtour360` saat ini (commit `e5eae71`): viewer, Studio, publish, auth, Supabase.

Catatan metodologi: verifikasi UI Panoee lama bersifat **screen-level** (tombol/label terlihat), bukan
pengujian backend AI, pembayaran, DNS, atau hasil publish. Tidak ada bundle krpano asli di workspace,
jadi klaim reverse-engineering bersumber dari catatan riset, bukan file sumber.

## 1. Yang berubah di Panoee sejak riset lama

| Periode | Perubahan Panoee | Dampak pada perbandingan |
|---|---|---|
| Sep 2026 | **Studio di-build ulang** (UI + codebase baru), static hosting ~50% lebih cepat | Arsip screenshot/path lama bukan lagi acuan desain terkini |
| Sep 2026 | **Panoee Studio di HP** (proyek, media, profil, hotspot + settings) | Kita sudah responsif di portfolio/dashboard, tapi Studio bukan editor penuh di mobile |
| Sep 2026 | **Tour Graph** (link bidireksional, auto-link, auto-align), in-studio preview, leveling panorama, color correction on-device, mini-map sinkron 2D↔360°, drag-to-create hotspot, editable hotspot label | Ini bukan lagi "eksperimen UI" — sudah fitur inti |
| Sep 2026 | PayPal styles untuk Product hotspot (QR, payment link, single/stacked button); passwordless login (OTP/magic link) | Monetisasi & auth makin jauh dari scope kita |
| Agu 2026 | Patch, Nadir, Line Polygon, polygon draggable, hotspot reciprocal/chevron, SVG icon + zoom-range visibility; album tree media, GPS EXIF, video preview | Hotspot kita kuat di style, tapi lemah di geometri/media |
| Jul 2026 | Dollhouse workflow baru, Floor Plan Maker, logo per-device (8 posisi + offset) | Panel Dollhouse/Floorplan kita masih config-only |
| Jun 2026 | Google Street View publish, scene slug, scene-level behavior, control-bar order | Scene slug kita belum ada; GSV tidak ada |
| Mar–Mei 2026 | Leaflet map, multilingual runtime | Map/i18n kita masih config-only |

## 2. Posisi `virtour360` sekarang — ringkasan jujur

### Sudah setara atau lebih baik di scope kita
- Viewer PSV5 multi-scene + virtual tour + markers + compass + gyro + autorotate manual + settings + quality/zoom (`src/hooks/useTourViewer.ts`).
- 9 tipe hotspot **benar-benar berfungsi** (type union di `src/types/tour.ts`, editor `RightPanel.tsx`, render `HotspotPopup.tsx`), bukan cuma picker: size/effect/color/opacity/rotate/shape/icon/label + drag + undo (`AppContext.tsx:1024-1073`).
- Scene audio per scene + pemutaran di viewer publik (`AppContext.tsx:1162-1211`, `PublicViewerModal.tsx:164-184`).
- Publish: slug, Draft/Public/Password, QR, embed, link publik `#/p/<uid>`, **password gate server-side** dengan cookie httpOnly dan hash scrypt (`api/public.js`, `api/_auth.js`).
- Auth + state Supabase, Storage signed upload untuk **semua** aset (panorama/audio/gambar), ownership check, feed publik, Views/Likes nyata (`api/storage.js`, `api/public.js`, `publicStore.ts:81-193`).
- Dark/light theme, dashboard project status, grup scene, activity weblog, responsif desktop/mobile.

### Ada UI, tapi belum jalan (config-only) — ini gap terbesar
Panel di `DesignModal.tsx` sudah lengkap secara visual (Theme, Polygon, Popup, Floorplan, Googlemap,
Form, CTA, Control Bar, Dollhouse; CMS Posts/Products/Forms/Languages; Marketing Script Chats/CTA;
Setting Logo/Popup Intro/Collaboration/System), tetapi sebagian besar tidak dikonsumsi runtime:
- Polygon: `types/studio.ts:65-71` + panel `DesignModal.tsx:42`; tombol "Draw" di `App.tsx:251-258` hanya menempatkan hotspot biasa.
- Dollhouse: hanya field config (`types/studio.ts:118-122`), tidak ada plugin/runtime.
- Popup intro, Form, CTA, Chat script, Logo, Collaboration, Multi-Language: field tersimpan, tetapi tidak ada render/submission/terjemahan saat pakai.
- CMS Posts: hanya picker (`MediaPickerModal`), bukan CRUD; Products/Forms tidak ada datanya.
- Theme preset: baru terpakai sebagian di `PublicPortfolioView.tsx:574-599`; **viewer publik tidak memakai var theme** (`PublicViewerModal.tsx:57-93`).

### Benar-benar tidak ada
| Fitur Panoee | Bukti absen di kita |
|---|---|
| Polygon/Shape/Line hotspot + drawing area | `App.tsx:251-258,464` |
| Media hotspot (Video/Image/Text/Tourguide/Patch) + green screen | `TourViewer.tsx:281-284` memetakan Tourguide → Article teks |
| Dollhouse runtime, PSV Minimap/Floorplan/Gallery plugin | `package.json:17-30`, `useTourViewer.ts:165-195` |
| Multi-resolution/32K tiling, nadir AI, leveling otomatis, color correction | tidak ada pipeline gambar |
| Global background sound (tour-wide) + volume | hanya audio per scene |
| Custom domain, white-label, export ZIP/offline, Google Street View | `publicStore.ts:260-263` (origin + hash) |
| Team roles, permissions, comment threads, lead capture/CRM | `schema.sql:4-12` hanya user + state |
| i18n runtime | translation JSON hanya di editor (`DesignModal.tsx:361-393`) |
| VR mode | hanya string izin iframe di `PublishModal.tsx:43,47,215` |
| Analytics penuh (source/device/country/dwell/heatmap) | baru Views + Likes |

### Partial yang sering tertukar
- **Minimap** kita adalah strip yaw kustom (`MiniMap.tsx`), bukan overlay 2D dengan posisi hotspot, dan disembunyikan di mobile.
- **Floorplan** kita overlay di Studio saja (`TourViewer.tsx:196-230`), tidak tampil di tour publik.
- **Side menu / tour graph** ada di Studio (`TourViewer.tsx:336-372`), tapi pengunjung publik hanya dapat tombol prev/next (`PublicViewerModal.tsx:233-242`).
- **Nadir** kita hanya label/checkbox, bukan tripod removal.
- **Statistik** sudah nyata (Views/Likes dari data publish), tapi bukan analytics perilaku.

## 3. Rekomendasi prioritas (bukan "kejar 68 baris")

Produk kita adalah **portfolio pribadi bergaya Linear**, bukan SaaS berlangganan. Jadi yang perlu dikejar
adalah fitur yang mengubah pengalaman pengunjung, bukan daftar panel admin.

### P0 — murah, dampak langsung ke tour publik
1. **Sambungkan theme ke viewer publik** — pakai `studioConfig.theme` di `PublicViewerModal` seperti yang sudah dilakukan `PublicPortfolioView`. Ini membuat preset/warna/font yang sudah diedit benar-benar terlihat.
2. **CTA nyata** (Telepon/Email/Link/WhatsApp/Viber) dari panel yang sudah ada → tombol di viewer publik. Ini jalur konversi paling jelas untuk properti.
3. **Background sound global + volume** di Setting › Content, dengan audio per scene sebagai override.
4. **Popup intro** (gambar/video/teks) sebelum masuk tour — panel sudah ada, tinggal render.
5. **Scene slug + hide per scene + initial scene picker** — tiga hal ini sering dipakai Panoee dan murah.

### P1 — investasi menengah, membedakan kualitas
6. **Polygon hotspot sungguhan**: simpan `points[]`, gambar SVG overlay di atas canvas, hit-test klik; layer ini juga bisa dipakai untuk floorplan interaktif.
7. **Bawa floorplan/minimap ke publik** + sinkron marker (bukan hanya strip yaw).
8. **Lead form dengan penyimpanan** (tabel `virtour_leads`) + notifikasi ke owner. Ini mengubah tour dari portofolio jadi alat bisnis.
9. **Analytics ringan per scene**: scene view durations + hotspot clicks, ditampilkan di dashboard. Sudah ada counter global; tinggal per-event.

### P2 — hanya jika arah produk berubah jadi SaaS
10. Multi-resolution/32K + AI (nadir/leveling/color) — butuh pipeline gambar & biaya storage.
11. Tim/roles, komentar, white-label/custom domain, export ZIP, Street View, VR, i18n runtime.

## 4. Koreksi dokumen lama

Tabel 68 baris di `10-panoee-asli-komparasi.md` dan ringkasan di `00-DOKUMENTASI-FITUR-LENGKAP.md`
masih menyatakan slug, password enforcement, statistik, Storage, dan auth sebagai ❌/🟡. Itu sudah tidak
benar setelah commit `59b97f5`, `8f8176d`, dan fitur-fitur sebelumnya. Keduanya tetap disimpan sebagai
arsip riset UI, tapi statusnya harus dibaca bersama dokumen ini.

## Kesimpulan

Panoee 2026 sudah berkembang dari "editor 360°" menjadi **platform komersial lengkap** (monetisasi,
tim, white-label, AI, analytics). Kita tidak perlu meniru semuanya. Kesenjangan yang benar-benar terasa
bagi pengunjung bukanlah jumlah panel, melainkan: panel yang sudah ada belum nyambung ke viewer publik,
tooltip/CTA belum bisa dipakai, dan geometri (polygon/floorplan) belum ada. Lima poin P0 di atas
memberi kenaikan kualitas terbesar dengan risiko paling kecil.
