# Dokumentasi Fitur Lengkap — Virtour360 (Replika Panoee)

> **Status arsip:** ringkasan fitur di dokumen ini mencerminkan kondisi 2026-11-23. Status terkini
> ada di [23-analisis-ulang-panoee.md](23-analisis-ulang-panoee.md).

| | |
|---|---|
| **Target utama** | https://virtour360real.vercel.app/#/p/1x2m270p3j |
| **Benchmark** | https://studio.panoee.net/ · https://panoee.com |
| **Source lokal** | `C:\Users\visual works\Documents\rea\virtour360` |
| **Metode** | 10 agent riset paralel + verifikasi langsung browser pasca-login + endpoint API live |
| **Status** | **Lengkap — 10/10 agent selesai** |

---

## Daftar Isi & File Detail

| # | Topik | File |
|---|---|---|
| 1 | [Ringkasan Eksekutif](#1-ringkasan-eksekutif) | — |
| 2 | [Arsitektur & Routing](#2-arsitektur--routing) | [`01-routing-navigasi.md`](01-routing-navigasi.md) |
| 3 | [Halaman Publik & Profil Kreator](#3-halaman-publik--profil-kreator) | [`02-halaman-publik.md`](02-halaman-publik.md) |
| 4 | [Viewer 360° & Kontrol](#4-viewer-360--kontrol) | [`03-viewer-360.md`](03-viewer-360.md) |
| 5 | [Studio / Editor](#5-studio--editor) | [`04-studio-editor.md`](04-studio-editor.md) |
| 6 | [Autentikasi & Profil](#6-autentikasi--profil) | [`05-auth-profil.md`](05-auth-profil.md) |
| 7 | [Upload, Publish & Embed](#7-upload-publish--embed) | [`06-upload-publish-embed.md`](06-upload-publish-embed.md) |
| 8 | [Model Data & Konten](#8-model-data--konten) | [`07-model-data.md`](07-model-data.md) |
| 9 | [Tema, Styling & Efek](#9-tema-styling--efek) | [`08-tema-styling.md`](08-tema-styling.md) |
| 10 | [Audit Backend & Status](#10-audit-backend--status) | [`09-audit-backend-docs.md`](09-audit-backend-docs.md) |
| 11 | [Perbandingan Panoee Asli](#11-perbandingan-dengan-panoee-asli) | [`10-panoee-asli-komparasi.md`](10-panoee-asli-komparasi.md) |
| 12 | [Inventaris Fitur & Kesenjangan](#12-inventaris-fitur--kesenjangan) | — |
| 13 | [Analisis Semua Path Panoee (re-audit)] | [`11-panoee-paths.md`](11-panoee-paths.md) |

---

## 1. Ringkasan Eksekutif

Aplikasi **Virtour360** adalah replika browser-based dari platform Panoee untuk membuat dan mempublikasikan virtual tour 360°. Stack: **React 19 + Vite 8 + TypeScript + Tailwind CSS v4 + Photo Sphere Viewer 5**, deploy di Vercel, dengan opsi penyimpanan **Supabase/Postgres**.

**Apa yang sudah berfungsi dengan baik:**
- Router hash manual dengan 7 pola rute (`#/`, `#/home`, `#/portfolio`, `#/portfolio/:id`, `#/p/:uid`, `#/studio`, `#/dashboard`) + SPA rewrite.
- Halaman portfolio publik dengan profil kreator, statistik, folder project, grid 360° posts & virtual tours, pencarian, bottom nav.
- Viewer PSV5 dengan 4 tipe hotspot (`info|project|link|scene`), 9 bentuk, 9 ikon, 7 efek, navigasi scene via panah/minimap/sidebar, hotkey lengkap.
- Studio editor 3 kolom dengan manajemen scene, CRUD hotspot + drag, inspector, autosave Supabase (debounce 800 ms), undo 20 level.
- Upload panorama ke IndexedDB + Supabase Storage, publish ke `/#/p/<uid>`, generator embed iframe, QR code.

**Kesenjangan utama terhadap Panoee asli:**
- Tidak ada pemilih tema/skin (Panoee punya 7 preset + editor style yang sangat detail).
- 9 label hotspot di picker hanya alias kosmetik untuk 4 tipe internal; tidak ada media/video/audio/e-commerce/lead-form sebagai tipe data.
- Tidak ada floorplan asli, Google Maps, CMS, form, CTA, multi-language, dollhouse, AI Edit 360, green screen, little planet, multi-resolution, VR stereo, export ZIP.
- Analytics masih **dummy** (string statis), password protection & mode Draft bersifat kosmetik.
- Upload single-file tanpa drag-drop/multi-file/progress/validasi; SEO hanya meta statis.

**Temuan kritis:**
1. Mode Draft/Password di PublishModal tidak diteruskan ke payload → tour tetap publik.
2. Scene ke-4 di `/api/public` memuat URL `blob:` → rusak di device lain.
3. RLS Supabase permisif (`using(true)`), endpoint POST `/api/public` tanpa token, fallback secret HMAC `"virtour360-dev"`.
4. Nama "The Gallery" di halaman `#/p/1x2m270p3j` berasal dari `folders[0].name`, bukan `profile.name` (`"awe"`); Views `1313` adalah angka hardcode.

---

## 2. Arsitektur & Routing

**Detail:** [`01-routing-navigasi.md`](01-routing-navigasi.md)

- Router **hash-based manual** (tanpa react-router). `hashchange` → `Root.Shell` → 4 view: `PublicHomeView`, `PublicPortfolioView`, `DashboardView` (lazy + Suspense), `App`/Studio (eager).
- Tujuh pola rute: `#/`, `#/home`, `#/portfolio`, `#/portfolio/:id`, `#/p/:uid`, `#/studio`, `#/dashboard`. Fallback senyap ke Home; **tidak ada halaman 404**.
- Navigasi: header (Home/Portfolio/Dashboard), popover account → Studio, bottom nav (Home/Map/Author/Explore — sebagian murni scroll, bukan route), tombol "JELAJAHI", "View more"/"View less", "Browse more". Tidak ada breadcrumb.
- Hanya UID/creatorId yang masuk hash; query/filter/tab/ekspansi disimpan lokal. State global via `AppContext` + 12 kunci `localStorage`.
- Guard client-side di `Root.tsx:41-44`: `#/studio` & `#/dashboard` → `LoginRequired`. Setelah login selalu redirect ke Studio.
- Keterbatasan: pencocokan rute `startsWith` longgar; refresh Studio selalu membuka scene `"atrium"`; ganti UID `#/p/A→B` tanpa unmount tidak me-refetch payload.

---

## 3. Halaman Publik & Profil Kreator

**Detail:** [`02-halaman-publik.md`](02-halaman-publik.md) — 30 fitur (P1–P30) + 6 screenshot live di `FEATURE_DOCS/assets/`.

Halaman target `#/p/1x2m270p3j` menampilkan:

| Elemen | Isi / Perilaku |
|---|---|
| Header | Logo `virtour360`, search "Cari karya", tombol Create, Studio, Masuk |
| Hero profil | Avatar inisial `TH`, nama **The Gallery**, badge `by Project · /p/1x2m270p3j` |
| Statistik | **8 Posts · 6 Tours · 1313 Views · 0 Likes** (views hardcode, likes dari `favorites.length`) |
| Project & folder | 3 folder: **The Gallery** (360°, Photography, WebGL), **Creative Room** (Tour, Storytelling, UI), **Sunset Terrace** (360°, Grading, Hospitality) — masing-masing "1 scene", accordion expand |
| 360° posts | Grid kartu dengan heart/like, tombol "View more", tombol "JELAJAHI →", lightbox |
| Virtual tours | Daftar tour + "View more" |
| Lokasi & kontak | Blok info kontak |
| CTA | "Share your world in 360" → "Upload your own 360 →" |
| Bottom nav | Home, Map, Author, Explore |

Data berasal dari `GET /api/public?id=1x2m270p3j` (200): 3 scene (`atrium`, `studio`, `terrace`), 3 folder, 5 kreator demo. Nama profil aktual = `"awe"`.

**Perilaku terverifikasi (Edge headless + CDP):**
- Alur data: `hash → /api/public → Supabase → fallback lokal`.
- Statistik: Posts 8, Tours 6, **Views 1313 hardcode**, Likes = `favorites.length` (klik heart: 0→1, tersimpan di `localStorage`).
- Accordion folder menampilkan 1 kartu scene; klik kartu → DetailModal → viewer (canvas + hint; tour multi-scene menampilkan "1 / 3 scene").
- Search `"studio"` → 1 post / 0 tour + empty state; filter terjadi **setelah** kartu dipotong.
- "View more" posts 4↔8, tours 3↔6.
- Bottom nav adalah **scroll**, bukan route: Home 0, Author 64, Explore 1063, Map 1559 px; tombol "Map" hanya scroll ke kartu kontak.
- CTA "Upload your own 360" membutuhkan auth; banner JELAJAHI → `#/home`.
- Limitasi: konten grid demo statis, header tombol terpotong di mobile, Lightbox/ProfileModal tidak dipakai di halaman ini.

---

## 4. Viewer 360° & Kontrol

**Detail:** [`03-viewer-360.md`](03-viewer-360.md)

- **Engine**: Photo Sphere Viewer 5 + 6 plugin. Dua inisialisasi: Studio (`renderMode:"3d"`, 6 plugin) vs Public modal (`renderMode:"2d"`, 0–2 plugin). `navbar:false` di keduanya.
- **Kontrol**: drag/wheel/two-finger, zoom ±, Default view, Fullscreen, autorotate. Hotkey: `←/→` ganti scene, `R` reset, `+`/`=` zoom in, `-` zoom out, `F` fullscreen (diabaikan saat fokus input). Public hanya `Esc/←/→`.
- **Hotspot**: 4 tipe nyata (`info|project|link|scene`), 9 ikon, 7 bentuk, 7 efek. Picker 9 label Panoee hanya alias kosmetik. Polygon hanya menaruh 1 titik `project`; link hotspot tidak membuka URL di public viewer.
- **Navigasi scene**: panah 3D/2D via `VirtualTourPlugin`, sidebar/side-menu/graph, prev/next, transisi fade + rotasi (18 rpm studio / 16 rpm publik). `initialView` hanya dipakai saat load awal & reset.
- **MiniMap**: bukan peta — proyeksi linear yaw/pitch pada thumbnail; klik/drag mengubah **yaw saja**, bukan pindah scene. Tersembunyi di <640 px, studio-only.
- **Media**: `MediaPickerModal` sebenarnya "ganti panorama dari scene lain"; `Lightbox` hanya preview thumbnail; audio per-scene via `<audio>` (studio only).
- **Efek**: leveling roll, 6 CSS filter + 5 preset, badge nadir, transisi fade, animasi marker — **semua studio-only**. Tidak ada little planet, green screen, multi-resolusi, VR stereo.
- **Gyroskop** ada via plugin + checkbox (butuh HTTPS/sensor). `imageQuality` Standard/High/Original adalah **dead setting**.
- Scene `atrium` kini **jalan buntu** (tanpa hotspot scene); alur panah: studio⇄terrace + studio→atrium.

---

## 5. Studio / Editor

**Detail:** [`04-studio-editor.md`](04-studio-editor.md)

- Layout 3 kolom: top bar, left sidebar (scene list), canvas viewer, right panel inspector + overlay.
- Scene management: tambah/hapus/grup/urutan/thumbnail, klik untuk pindah scene. **Tidak ada** rename/duplikat/breadcrumb.
- Inspector 11 accordion + editor hotspot: placement/drag, yaw/pitch, style. CRUD hotspot + styling + drag **sudah persisten**.
- Toolbar bawah + hotkey + mode preview. Undo hanya untuk hotspot (20 level, **tanpa redo**).
- Autosave Supabase debounce 800 ms. Matriks lokal/placeholder vs backend: `initialView`/FOV, polygon, rename/duplicate scene, tema, status Draft/Archived **belum diimplementasikan**; badge "Published" & mode akses bersifat kosmetik.

---

## 6. Autentikasi & Profil

**Detail:** [`05-auth-profil.md`](05-auth-profil.md)

- **Bukan Supabase Auth**: akun di tabel `virtour_users` via `/api/auth` (email + password, hash **scrypt**), token custom **HMAC-SHA256 30 hari** di `localStorage`.
- Tanpa OAuth, magic link, reset password, role, invite, atau team.
- `LoginRequired` hanya guard client-side; setelah login selalu ke Studio (bukan balik ke Dashboard).
- `ProfileModal` hanya nama + email + ganti password. Profil "lengkap" di halaman publik berasal dari data demo statis `src/data/profile.ts`.
- Kepemilikan memakai key `user:<email>` vs `guest:<id>` di `virtour_state`, bukan `owner_id`.
- `/api/auth` tanpa token → **401**; `/api/public?id=...` → 200. POST `/api/public` tidak butuh token → catatan keamanan prioritas.

---

## 7. Upload, Publish & Embed

**Detail:** [`06-upload-publish-embed.md`](06-upload-publish-embed.md)

| Fitur | Status |
|---|---|
| Upload | Single-file klik, `accept="image/*"`. **Tanpa** drag-drop, multi-file, validasi 2:1/ukuran, progress bar, resize |
| Penyimpanan | IndexedDB + opsional Supabase Storage bucket `panoramas` |
| Publish | UID acak 10 char → `/#/p/<uid>`, copy link + QR + embed. Draft/Public/Password **hanya UI** |
| Embed | Dua generator: `EmbedModal` (generik) & bagian Embed di PublishModal (fullscreen/VR/lazy). Fixed `height=600` |
| Export/ZIP/self-hosting | **Tidak ada** |
| Optimasi | "Kualitas" hanya batas zoom/minFov; roll & warna = koreksi viewer-level (CSS filter + `sphereCorrection`), bukan image bake |
| SEO | Meta statis di `index.html`; tanpa OG/canonical/JSON-LD; routing hash kurang crawler-friendly |

Tanpa server mode, Publish mengembalikan `ok:false` tetapi UI tetap menampilkan link seolah sukses. Klik ulang selalu membuat project baru.

---

## 8. Model Data & Konten

**Detail:** [`07-model-data.md`](07-model-data.md)

- Tiga lapisan data: **statis** (hardcoded), **lokal** (localStorage/IndexedDB), **remote** (Supabase).
- Data dictionary lengkap: `Hotspot`, `HotspotStyle`, `Scene`, `ProjectMeta`, `Profile`, `PublicProfile/Folder/Creator/Post/Payload`, `RemoteState`, `StoredPanorama/Asset`, `User`, `SceneEffects`, `Example360`.
- Hotspot: 4 tipe (`info|project|link|scene`), 9 bentuk, 9 ikon, 7 efek; pemetaan 9 picker Panoee di `App.tsx:160-176`. Polygon/audio/video/image **bukan** tipe hotspot.
- Graph scene: node dari `Scene`, edge dari hotspot `scene` + `targetSceneId`, prev/next sirkular dari urutan array.
- Seed: 3 scene, 7 hotspot, 5 kreator, 5 user dummy, 3 folder live. Payload live aktual: `atrium` berisi 5 hotspot "Info baru"; `profile.name = "awe"`.
- Supabase: 2 tabel (`virtour_users`, `virtour_state`), RLS permisif, bucket `panoramas`, 3 API function, tanpa index/FK.

---

## 9. Tema, Styling & Efek

**Detail:** [`08-tema-styling.md`](08-tema-styling.md)

- Token tersebar di `src/config/theme.ts` (hanya `size` yang benar-benar dipakai) dan `src/styles/theme.css` (`@theme` Tailwind v4). Tanpa `tailwind.config.*`; font Inter, spacing 4px, radius 8/12/16px.
- Komponen UI: `Button` (5 varian, 2 size — ternyata tidak dipakai), `Badge`, `AccordionSection`, `Lightbox`, `Logo360`. Ikon `lucide-react`.
- **Tidak ada** pemilih skin/tema, field branding/logo/credit, atau dark/light toggle. Dua skin implisit: gelap (Studio/Dashboard/viewer) vs terang (Home/Portfolio), semuanya hardcode.
- Override PSV 90 baris, tetapi marker aktif memakai kelas `.hs-*` (potensi mismatch). Navbar PSV dimatikan, bukan di-style.
- Efek nyata: roll `sphereCorrection`, 6 CSS filter + 5 preset, badge nadir, autorotate, fade, animasi + reduced-motion. Filter Studio **tidak ikut** ke viewer publik.
- Responsivitas: Studio fixed 240/260px (tidak adaptif sempit); toolbar mobile scroll horizontal. Lokalisasi: Bahasa Indonesia dominan + sisa string Inggris, **tanpa i18n**.
- Aksesibilitas: `lang="id"`, beberapa `aria-label`, hotkey, focus ring; tapi accordion tanpa `aria-expanded`, modal tanpa `role="dialog"`/focus trap, toast tanpa `aria-live`.

---

## 10. Audit Backend & Status

**Detail:** [`09-audit-backend-docs.md`](09-audit-backend-docs.md)

- Arsitektur: Vite 8 + React 19 + TS 7 + Tailwind v4 + PSV5, Vercel (SPA rewrite, cache `/media`). Tiga mode data: lokal, **server** (`VITE_USE_SERVER_DB=1`, secret Supabase hanya di `/api/*`), klien (anon key + Storage).
- Auth: scrypt + token HMAC 30 hari; state per identitas `user:<email>`/`guest:<id>`; publish ke `virtour:pub:<uid>`.
- **Analitik tidak ada** — views string statis, likes `favorites.length` + hardcode. Tidak ada PostHog, heatmap, click-path.
- Inkonsistensi: domain produksi bertentangan (`virtour360real` vs `virtour360-lemon`); `.env.example` salah komentar; Opsi B tidak melayani halaman publish publik; RLS permisif + fallback secret `"virtour360-dev"`; `PLAN.md` memuat file/plugin yang tidak ada.
- Bug nyata: `GET /api/public` mengembalikan scene `"kamar kos"` dengan URL `blob:` (rusak di device lain).

---

## 11. Perbandingan dengan Panoee Asli

**Detail (Versi 2, 68 baris tabel):** [`10-panoee-asli-komparasi.md`](10-panoee-asli-komparasi.md)

Verifikasi langsung pasca-login di `studio.panoee.net`: pola rute `/editor/{tourId}/tour-editor/scene/{sceneId}/{section}/{subsection}`; 3 mode (Tour Editor / Canvas / GSV); 6 menu utama (Design, Content/CMS, Dollhouse, Floorplan, Marketing, Setting).

**Fitur Panoee asli yang terverifikasi langsung:**

| Grup | Fitur |
|---|---|
| Scene inspector | Title/Slug + generator, Thumbnail (screenshot/upload), Replace, background sound `.mp3`, **AI Edit 360**, **Leveling**, **Nadir Quick/Custom Fix**, Staging Day To Dusk, Filter Processing, Sun light, Limit view, Zoom limit |
| Konten | Hotspot 9 tipe (Point, Chevron, Image, Article, Video, Sound, Link, Compact, Product), Media 5 (Video, Image, Text, Tourguide, Patch), Polygon (Shape/Line), SEO Suggestion panel |
| Design | 7 preset theme (Default, Default 2.0, Solid, Wall, Base, Folio, Blank), warna/font, hotspot Symbol/Label/Distort/Chevron, Polygon, Popup, Floorplan, Googlemap, Form, CTA, Control Bar, Dollhouse |
| CMS | Posts, Products, Floorplan, Forms, List Language, List Translation |
| Marketing | SEO, Forms, Script Chats, Call To Action, Snapshot |
| Setting | Content, Effect, View, Logo, Popup Intro, Collaboration, System, Multi-Language, copyright + upsell Enterprise |

**Ringkasan status:** ±8 ada penuh, ±17 ada sebagian, ±26 tidak ada (dari 52 baris awal); setelah verifikasi langsung diperluas jadi **68 baris** di Versi 2. Side menu & Tour graph ternyata sudah ada di replika → dikoreksi dari ❌ jadi 🟡.

**15 rekomendasi prioritas** (Versi 2): (1) password fungsional, (2) slug + SEO Suggestion, (3) 7 preset theme, (4) floorplan/Google map, (5) CTA/Form, (6) CMS, (7) realisasi hotspot/media/polygon, (8) style editor lanjutan, (9) multi-language, (10) analytics/Snapshot, (11) popup intro, (12) copyright mini, (13) control bar, (14) upload pipeline, (15) export ZIP.

---

## 12. Inventaris Fitur & Kesenjangan

### Sudah ada (penuh/sebagian)
Router & 7 rute · halaman publik + profil + stats + folder + posts/tours · viewer PSV5 · 4 tipe hotspot + 9 ikon + drag · panah scene + minimap + graph · hotkey · fullscreen · gyroskop · studio CRUD scene & hotspot · inspector 11 accordion · autosave + undo · login/register + profil · upload panorama · publish + UID + QR + embed · 3 lapisan data + Supabase · tema hardcode + filter CSS + nadir badge + fade.

### Belum ada / kosmetik
Tema/skin preset · floorplan asli & Google Maps · CMS (posts/products/forms/i18n) · form/CTA/lead capture · multi-language · dollhouse · AI Edit 360 / leveling / nadir fix / day-to-dusk · green screen · little planet · multi-resolution · VR stereo · export ZIP/self-hosting · Google Street View · white-label/team roles · analytics asli · password & Draft sungguhan · SEO dinamis/OG/JSON-LD · drag-drop & multi-file upload · validasi & progress upload · redo · rename/duplicate scene · breadcrumb · 404.

### Prioritas perbaikan teratas
1. **Password/Draft fungsional** — saat ini tour "private" tetap bisa diakses.
2. **Sanitasi `blob:`** saat publish — scene rusak di device lain.
3. **KRLS & endpoint** — `using(true)`, POST `/api/public` tanpa token, secret fallback.
4. **Slug + SEO dinamis** — SEO Suggestion ala Panoee, canonical, OG.
5. **Preset tema + editor style hotspot** — selisih terbesar di UI.
6. **Realisasi 9 tipe hotspot + media + polygon** — saat ini alias kosmetik.
7. **Floorplan/Google map + CMS + Form/CTA** — fitur inti Panoee.
8. **Upload pipeline** — drag-drop, multi-file, progress, validasi 2:1.
