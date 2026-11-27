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
- Polygon: sudah ada drawing mode dan overlay publik (lihat §7); Dollhouse dan several panel lain masih config-only.
- Dollhouse: hanya field config (`types/studio.ts:118-122`), tidak ada plugin/runtime.
- Popup intro, Form, Chat script, Logo, Collaboration, Multi-Language: field tersimpan, tetapi tidak ada render/submission/terjemahan saat pakai. CTA sudah punya render publik (lihat §7).
- CMS Posts: hanya picker (`MediaPickerModal`), bukan CRUD; Products/Forms tidak ada datanya.
- Theme preset: `studioThemeStyle()` memakai warna/font tema di portfolio **dan** viewer publik (lihat §7).

### Benar-benar tidak ada
| Fitur Panoee | Bukti absen di kita |
|---|---|
| Polygon/Shape/Line hotspot + drawing area | sudah diimplementasikan (lihat §7); untuk saat ini masih polygon/line, belum kurva/bezier |
| Media hotspot (Video/Image/Text/Tourguide/Patch) + green screen | `TourViewer.tsx:281-284` memetakan Tourguide → Article teks |
| Dollhouse runtime, PSV Minimap/Floorplan/Gallery plugin asli | plugin asli tidak ada; overlay Mini-map/Floorplan kustom sudah dipakai di publik (lihat §7) |
| Multi-resolution/32K tiling, nadir AI, leveling otomatis, color correction | tidak ada pipeline gambar |
| Global background sound (tour-wide) + volume | hanya audio per scene |
| Custom domain, white-label, export ZIP/offline, Google Street View | `publicStore.ts:260-263` (origin + hash) |
| Team roles, permissions, comment threads, lead capture/CRM | `schema.sql:4-12` hanya user + state |
| i18n runtime | translation JSON hanya di editor (`DesignModal.tsx:361-393`) |
| VR mode | hanya string izin iframe di `PublishModal.tsx:43,47,215` |
| Analytics penuh (source/device/country/dwell/heatmap) | baru Views + Likes |

### Partial yang sering tertukar
- **Minimap** kita adalah strip/overlay yaw kustom (`MiniMap.tsx`, `PublicViewerModal.tsx`), bukan plugin PSV; sekarang tampil juga di publik dan mobile.
- **Floorplan** kini overlay kustom di Studio dan tour publik, dengan titik scene yang bisa diklik (lihat §7).
- **Side menu / tour graph** ada di Studio (`TourViewer.tsx:336-372`), tapi pengunjung publik mendapat floorplan + tombol prev/next, bukan daftar scene penuh.
- **Nadir** kita hanya label/checkbox, bukan tripod removal.
- **Statistik** sudah nyata (Views/Likes dari data publish), tapi bukan analytics perilaku.

## 3. Rekomendasi prioritas (bukan "kejar 68 baris")

Produk kita adalah **portfolio pribadi bergaya Linear**, bukan SaaS berlangganan. Jadi yang perlu dikejar
adalah fitur yang mengubah pengalaman pengunjung, bukan daftar panel admin.

### P0 — murah, dampak langsung ke tour publik
1. **Sambungkan theme ke viewer publik** ✅ — `studioConfig.theme` dipakai `PublicViewerModal` lewat `studioThemeStyle()` (lihat §7).
2. **CTA nyata** (Telepon/Email/Link/WhatsApp/Viber) ✅ — tombol publik hanya tampil jika `cta.enabled` dan URL aman (lihat §7).
3. **Background sound global + volume** ✅ — audio tour dipakai bila scene tidak punya audio override.
4. **Popup intro** (gambar/video/teks) sebelum masuk tour — panel sudah ada, tinggal render.
5. **Scene slug + hide per scene + initial scene picker** — tiga hal ini sering dipakai Panoee dan murah.

### P1 — investasi menengah, membedakan kualitas
6. **Polygon hotspot sungguhan** ✅ — `points[]`, overlay SVG, hit-test klik, dan drawing mode Studio (lihat §7).
7. **Bawa floorplan/minimap ke publik** ✅ — overlay kustom + titik scene yang bisa diklik; plugin PSV asli tetap P2.
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

## 5. Verifikasi live via browser (2026-11-27)

Selain webfetch, halaman Panoee juga dibuka langsung di browser (tanpa login untuk tour publik).
Ini mengonfirmasi beberapa klaim dan menambah detail yang tidak terlihat dari dokumentasi.

| Observasi live | Bukti | Arti untuk perbandingan |
|---|---|---|
| Halaman `/demos` saat ini hanya menampilkan satu demo aktif: **360 Object Scene** | `https://panoee.com/demos` → `https://tour.panoee.net/6788f583814ed687cea302df/68060adf12c8ae6247852d3f` | Halaman demo bukan lagi katalog fitur lengkap seperti di arsip |
| Gallery berisi **60 tour**, 24 ditampilkan, kategori: Hospitality 15, Education 9, Real Estate 8, Exhibition 7, Factory/Office 5, Restaurants/Retail 5, Tourism 4, Architecture 3, Healthcare 3, Venues 1 | `panoee.com/gallery`, link contoh `tour.panoee.net/uplife`, `/kraburi-public-library`, `/university-vr-tour` | Tour publik memakai **slug**, bukan hanya `/{tourId}/{sceneId}` |
| Studio tetap di balik login | `studio.panoee.net/` | Verifikasi editor lama tetap tidak bisa diulang tanpa akun |
| Tour **Masterise Lakeside** memuat **83 scene** dengan grup (Tầng 1 – Nội khu, The Liberty L1, The Harmony L2, The Majesty L3, Tổng quan, Studio, 1BR/2BR/2BR+/3BR, Tầng 1, Tầng 20, Flycam, Uncategory) dan indikator `1/83 (1%)` | Snapshot DOM tour | Scene grouping + progress indicator benar-benar dipakai di tour publik, bukan hanya editor |
| Tour **UP Life Residence** (7 scene: Sala, Cozinha, Varanda, Dormitório, Banheiro, Suíte, Suíte Banheiro) punya: keyboard `WASD`/arrow, **VR Setup / Exit VR**, fullscreen, prompt bagikan screenshot, prompt `Enable sound? OK/No`, dan `1/7 (14%)` | Snapshot DOM + `document.body.innerText` | Ini gap nyata di kita: VR, navigasi WASD, prompt suara global, dan share-shot belum ada |
| Runtime bukan Photo Sphere Viewer. Script: Next.js chunks di `assets.panoee.com/tour/_next/...`, `static/static/data.js`, `static/core/tour.js`, jQuery 2.1.3; DOM hotspot ber-ID `hotspot-...-krpanoViewSnapshot-typepoint-unpolygon` / `typemedia-unpolygon`, plus `themeControlbar`, `themeListScene`, `themeCopyRight` | `document.scripts`, daftar `[id]` | Jeak krpano masih terlihat pada nama core/id DOM meski `window.krpano` tidak terekspos; pendekatan mereka berbeda dari PSV5 kita |
| Panorama dimuat sebagai **tile multi-resolusi**: `.../media/pano/vtour/1763650291-6944/[l|u|d|r]/l1/<n>/...jpg` dengan status 200 | Network request gambar | Klaim 32K/tiling bukan sekadar marketing — setidaknya tour ini benar-benar memakai pyramid tile, bukan satu file equirectangular |
| `window.__NEXT_DATA__.props` berisi `listProjectGuardOpenedCookie`, `passwordTourCookie`, `listFormCaptureOpenedCookie`; `initialState.app` berisi `configSoundProject`, `configAutoRotate`, `configAutoChangeScene`, `languageProjectSelected`, `isVisibleFormCapture`, `formCaptureConfigSelected`, `listPost`, `listCommentSceneSelected`, `isAllowToAccessOnCollaborationMode`, `ownerPlan` | Evaluasi `__NEXT_DATA__` | Password gate, form capture, komentar, kolaborasi, i18n, auto-rotate dan **auto-change-scene** adalah konsep runtime, bukan sekadar panel config |

### Koreksi terhadap doc 23 bagian 1–4

- Tidak ada perubahan pada daftar P0/P1/P2. Observasi live justru **memperkuat** P0 nomor 3 (background
  sound global) dan menambah kandidat P0 baru: **indikator progres `1/N`** dan **prompt suara awal**
  (murah, langsung terasa).
- Status "VR hanya string iframe" di doc 23 tetap benar untuk kita; di Panoee live VR benar-benar
  punya UI masuk/keluar.
- Status "multi-resolution tidak ada" di doc 23 tetap benar untuk kita; Panoee live terbukti memakai tile.
- Password gate kita sudah server-side (`22-publish-security.md`); live Panoee juga memakai cookie
  (`passwordTourCookie`), jadi ini bukan gap lagi — hanya perbedaan implementasi.

## 6. Studio live setelah login (2026-11-28)

Dengan sesi login (akun `vwrks.id`, trial ~7 jam) saya buka dashboard dan editor. Tidak ada aksi
destruktif: hanya navigasi, membuka panel/modal, dan membaca DOM. Project yang ada bernama **2**,
status **Published**, 2 scene (`layout_2`, `layout_1`), panorama 2.8 MB / 3.0 MB di Media.

| Observasi live | Bukti / detail | Status di `virtour360` |
|---|---|---|
| Rute editor `.../tour-editor/scene/{sceneId}/scene-info`, lalu `design/theme`, `cms/post`, `marketing/seo`, `setting/config`, plus `/dollhouse?scene=...` dan `/dollhouse/floor-plan-maker` | URL aktif setelah klik nav | Kita masih satu halaman Studio + modal, tanpa rute per bagian ✅ (lebih sederhana, bukan gap fungsional) |
| Header: rename, preview, publish, mode **Tour/Canvas/GSV**, nav **Design / Content / Dollhouse / Floorplan / Marketing / Setting** | `data-ai-id="tour.header.*"` | Kita punya publish/preview; mode GSV dan nav Dollhouse/Floorplan tidak ada |
| Design sub-nav persis: **Theme, Hotspot, Polygon, Popup, Floorplan, Googlemap, Form, Call To Action, Control Bar, Dollhouse** | Klik nav Design | Panel kita sama secara visual, tapi sebagian besar config-only (lihat §2) |
| CMS sub-nav: **Posts, Products, Floorplan, Forms, List Language, List Translation**; Marketing: **SEO, Forms, Script Chats, Call To Action, Snapshot**; Setting: **Content, Effect, View, Logo, Popup Intro, Collaboration, System, Multi-Language** | Klik masing-masing nav | Panel kita sama; runtime/i18n/komentar/kolaborasi belum ada |
| Setting › Config berisi **Description, Select post, Initial Scene, Background Sound (.mp3), Set Location, Nadir Disabled, Copyright Enabled + QRcode copyright**. Copyright ditandai *Enterprise feature, please upgrade* | Teks panel | Initial scene ✅; **background sound global ✅** (lihat §7); copyright branding ❌ |
| Inspector scene: Title + **Slug** (dengan generator), Thumbnail, Replace, Select post, Upload file .mp3, **AI Edit 360** (prompt hapus objek/tripod/orang), **Leveling — "Straighten a tilted panorama. North / yaw is left unchanged"**, Nadir Quick/Custom Fix, Staging Day To Dusk, Filter Processing, Sun light, Limit view `-90/90/-180/180`, Zoom `60/150` | Input + tombol `data-ai-id="scene.info.*"` | Slug, leveling, nadir AI, filter, sun light kita belum ada / baru label (lihat §2) |
| Picker: **9 hotspot** (Point, Chevron, Image, Article, Video, Sound, Link, Compact, Product); **5 media** (Video, Image, Text, Tourguide, Patch); **2 polygon** (Shape, Line) + "Select Polygon Type & Function to start drawing" | Klik tab `+ Hotspot`, `+ Media`, `+ Polygon` | 9 hotspot kita ✅; media/Tourguide/Patch 🟡; polygon shape/line ✅ (lihat §7) |
| Publish modal: **Draft / Public / Password access**, "Anyone with the link", Tour Domain, Copy Link, Open Link, QR Code, Change Slug, Custom Domain/Connect Domain, **Refresh Cache**, Embed (Fullscreen/**VR**/lazy/Copy Code), Integrate, **Export**, Preview | `data-ai-id="publish.modal.*"` | Draft/Public/Password + QR + embed ✅; password gate server-side ✅; custom domain/cache/export/VR ❌ |
| **Dollhouse** benar-benar workspace: "No model saved for this scene", langkah Set vertical point → Draw → Preview Model → Model Saved, "3D Ready scenes (0)", Finalize | URL `/dollhouse?scene=...` | Kita hanya field config ❌ |
| **Floor Plan Maker** benar-benar editor: Draw/Edit/Assist/History/View/Clear/Export, trace room, walls, doors/windows, calibrate meters, ekspor PNG/JSON | URL `/dollhouse/floor-plan-maker` | Kita pakai gambar floorplan + editor titik scene di Studio, plus viewer publik interaktif; bukan editor geometri penuh 🟡 |
| Media library: Add Album, tab **Pano / Asset**, Root, Sort Media, drop 360 images / **Upload 360**, kontrol image quality, tombol AI edit | `/dashboard/media` | Upload kita ✅ (signed URL ke Storage), tapi tanpa album tree/quality variants ❌ |
| New Project mensyaratkan **"At least one 2:1 image is required"**, drag/drop, Browse files, Use samples, Create Tour, Advanced settings | Modal New Project | Kita tidak memaksa rasio 2:1; lebih longgar |
| Konsol editor hanya 404 untuk resource opsional + pesan "Prompt dismissed" dari AI prompt; tidak ada error fatal | `browser.console` | — |

### Koreksi tambahan dari sesi login

- Arsip `10-panoee-asli-komparasi.md` ternyata **akurat secara screen-level** untuk editor; yang
  kedaluwarsa adalah status sisi `virtour360`, bukan deskripsi UI Panoee.
- Kesenjangan paling mengejutkan bukan lagi "panel belum ada", melainkan **Dollhouse dan Floor Plan
  Maker adalah workspace penuh** di Panoee, sementara kita hanya menyimpan config. Ini naikkan ke P1.
- **Background sound global** (Setting › Config) dan **Initial Scene** sudah dikonfirmasi live; keduanya
  masuk P0 karena murah dan langsung terasa (sound sudah diimplementasikan, lihat §7).
- AI Edit, leveling, nadir fix, dan filter benar-benar ada sebagai UI. Saya tidak menekan tombolnya
  karena akan mengubah project milik user, jadi **hasil backendnya belum diuji**.
- Custom domain, cache refresh, Export, dan VR di modal publish juga baru diverifikasi sebagai UI;
  tidak saya jalankan karena berdampak nyata (DNS/publish/biaya).

## 7. Implementasi item 1 & 2 (2026-11-28)

| Item | Status | Bukti di kode |
|---|---|---|
| Theme → viewer publik | ✅ | `src/lib/viewerTheme.ts`, `PublicViewerModal.tsx` memakai `studioThemeStyle(config)`; warna/font tema juga dipakai CTA, mini-map, dan floorplan. |
| CTA nyata | ✅ | `DesignModal.tsx` punya toggle "Tampilkan di viewer publik"; `cta.enabled` + `safeExternalHref()` menentukan render. Icon mengikuti `tel:`, `mailto:`, WhatsApp, atau link umum. |
| Background sound global | ✅ | `config.setting.backgroundSound` dipakai bila scene aktif tanpa audio; kontrol play/pause tampil di viewer. |
| Polygon shape/line | ✅ | `Hotspot.polygon` menyimpan `points[]` derajat; `viewerPolygons.ts` memproyeksikan SVG per render, hit-test klik, dan abaikan koordinat non-finite. Polygon dikecualikan dari marker PSV oleh `sceneGraph.ts`. Studio punya mode "Gambar area"/"Gambar garis", selesai/batal, dan warna dari panel Design. |
| Floorplan + mini-map publik | ✅ | `PublicViewerModal.tsx` merender panel floorplan dari `config.floorplan` dan mini-map yaw dengan titik hotspot. Titik scene pada floorplan memanggil `goToNode()`, dengan antrean bila viewer belum `ready`. |

Data `studioConfig` ikut saat publish lewat `PublishModal → publishPublicPayload`, jadi pembaca
`#/p/<uid>` menerima konfigurasi yang sama dengan Studio. QA manual memakai payload sintetis
`virtour360.published:qa-geom` di layar 1280×900 dan 390×844: kanvas penuh, tanpa scroll horizontal,
polygon/CTA/floorplan/mini-map tampil, klik polygon membuka popup, klik titik scene dan tombol
prev/next mengganti scene, serta tidak ada console error.

Yang **belum** masuk cakupan implementasi ini: popup intro, form/lead capture, analytics per scene,
scene slug/hide, VR, multi-resolution, Dollhouse/Floor Plan Maker penuh, dan fitur komersial P2.

## Kesimpulan

Panoee 2026 sudah berkembang dari "editor 360°" menjadi **platform komersial lengkap** (monetisasi,
tim, white-label, AI, analytics). Kita tidak perlu meniru semuanya. Setelah item 1 & 2, panel yang
paling terasa bagi pengunjung sudah nyambung ke viewer publik: tema, CTA, suara latar, geometri,
floorplan, dan mini-map. Sisa prioritas yang paling murah adalah popup intro, scene slug/hide, lead
form, dan analytics ringan per scene.
