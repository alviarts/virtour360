# Panoee Studio (Asli) vs Virtour360 (Replika Lokal) — Benchmark Fitur & Dokumentasi

> **Status arsip:** tabel perbandingan di bawah memakai data 2026-11-23 dan status replika sudah
> kedaluwarsa (slug, password gate, statistik, Storage, theme). Untuk analisis yang sudah diselaraskan
> dengan kode commit `e5eae71` dan Panoee live Nov 2026, baca [23-analisis-ulang-panoee.md](23-analisis-ulang-panoee.md).

> **Disusun:** 2026-11-23 · **Versi 2 — terintegrasi dengan verifikasi UI live pasca-login**  
> **Ruang lingkup:** Benchmark Panoee Studio asli + inventaris fitur + perbandingan dengan replika lokal `C:\Users\visual works\Documents\rea\virtour360` (live: https://virtour360real.vercel.app/#/p/1x2m270p3j).  
> **Metode (penting):** verifikasi **langsung** dilakukan oleh **parent session** memakai browser setelah **user login di Review pane**; agen penulis dokumen ini hanya mengintegrasikan temuan tersebut, membaca source replika, dan konten publik. **Tidak ada file source yang diubah.**

---

## 0. Ringkasan eksekutif

- **Login wall tetap menjadi konteks awal.** Sebelum login, editor redirect ke `/account/auth/login`; setelah user login (di sesi parent), editor terbuka normal dan UI-nya diverifikasi langsung. Jadi kini sebagian besar fitur yang sebelumnya hanya bersumber dari dokumentasi dinaikkan statusnya menjadi **✅ terverifikasi langsung (screen-level UI)**.
- **Pola rute terverifikasi:** `/editor/{tourId}/tour-editor/scene/{sceneId}/{section}/{subsection}` — contoh: `.../scene-info`, `.../design/theme`, `.../design/hotspot`, `.../cms/post`, `.../marketing/seo`, `.../setting/config`. `sceneId` berubah saat masuk menu Design (`6b004be9f65b1269ed2188c6`).
- **Editor Panoee jauh lebih luas dari yang diperkirakan sebelumnya**: selain Tour Editor ada menu **Design, Content (CMS), Dollhouse, Floorplan, Marketing, Setting**, plus 3 mode **Tour / Canvas / GSV**. Design saja punya 10 sub-panel: Theme, Hotspot, Polygon, Popup, Floorplan, Googlemap, Form, Call To Action, Control Bar, Dollhouse.
- **Replika sudah kuat di inti viewer** (multi-scene, hotspot drag + point style, mini-map, side menu, tour graph, efek, audio, publish/QR/embed, auth, dashboard, portofolio), tetapi **tetap kosong di hampir semua lapisan CMS, marketing, theme, floorplan, dan auto/AI pipeline**.
- Temuan paling mengejutkan: replika **sebenarnya sudah punya Side menu + Tour graph** (di `SettingsPopover`/`TourViewer`), jadi statusnya diperbaiki dari ❌ menjadi 🟡/✅ pada dokumen ini.
- Prioritas utama berubah: **slug + SEO Suggestion**, **7 preset theme + theme editor**, **floorplan & Google map**, **CMS (Posts/Products/Forms/i18n)**, **CTA/Form**, disamping password protection yang masih UI-only.

---

## 1. Akses, rute & verifikasi

### 1.1 Status akses

| Kondisi | Hasil | Sumber |
|---|---|---|
| Tanpa login → `https://studio.panoee.net/editor/6b004bb6f65b1269ed2183ca/tour-editor/scene/6b004be9366069782ad46600/scene-info` | Redirect ke `https://studio.panoee.net/account/auth/login` | Pengujian parent session (sebelum login) |
| Tanpa login → `https://studio.panoee.net/` | Landing/auth (`/account/auth/register`), tidak ada tour anonymous | webfetch + tautan publik |
| **Setelah user login** → URL editor tersebut | **Terbuka normal. Judul tab: "Tour Editor - Panoee \| The Smart Virtual Tour Software for everyone"** | ✅ Verifikasi live (parent session) |
| `https://panoee.com/demos` | Publik; demo Floorplan, Callout, Product, Virtual Staging, Lens Flare, Flat Scene, 360 Object Scene | webfetch |

Tidak ada pendaftaran baru, input kredensial oleh agen, atau klik "buy/subscribe". User yang melakukan login ada di luar agen penulis.

### 1.2 Pola rute (✅ terverifikasi langsung)

```
/editor/{tourId}/tour-editor/scene/{sceneId}/{section}/{subsection}

Contoh terverifikasi:
  .../scene/6b004be9366069782ad46600/scene-info      → Scene info inspector
  .../scene/6b004be9f65b1269ed2188c6/design/theme    → Design › Theme
  .../scene/6b004be9f65b1269ed2188c6/design/hotspot  → Design › Hotspot
  .../cms/post                                        → Content › Posts
  .../marketing/seo                                   → Marketing › SEO
  .../setting/config                                  → Setting › Config
```

Menu navigasi atas dengan `data-ai-id` terverifikasi:

```
tour.header.mode-tour | tour.header.mode-canvas | tour.header.mode-gsv
Design · Content · Dollhouse · Floorplan · Marketing · Setting
```

Rute historis/dokumentasi lain: `/dashboard/projects`, `/dashboard/media`, `/dashboard/enterprise`, `/profile/subscriptions`, `/editor/:project_id` (`docs/RESEARCH.md`). Publik: `tour.panoee.net/{tourId}/{sceneId}`, `portfolio.panoee.com/{username}`.

### 1.3 Legenda verifikasi (diperbarui)

| Tanda | Arti |
|---|---|
| **✅ Live** | Terlihat langsung di UI setelah login (parent session) |
| **[Dok]** | Halaman dokumentasi resmi |
| **[Home]** / **[FAQ]** / **[Blog]** / **[Demo]** | Sumber publik resmi lainnya |
| **[RE]** | Reverse engineering bundle (dari `docs/RESEARCH.md`) |
| **⚪** | **Masih tidak terverifikasi langsung** — hanya tersedia di balik alur berbayar/plan tertentu atau hanya klaim publik (mis. alur pembayaran export, DNS white-label, manajemen user) |

---

## 2. Inventaris fitur Panoee — versi terverifikasi

### 2.1 Header, kanvas & inspektor (✅ Live)

| Area | Elemen terverifikasi |
|---|---|
| **Header** | Tombol Back; avatar `aw` (bisa rename); **"3 Suggestion"**; **Preview**; **Published** (status publish) |
| **Panel kiri** | Tombol **Create**, **+ Group**, **Collapse**, **Info**, **Search**, **More**; grup **Uncategory** (rename/collapse); scene **layout_2** & **layout_1** (aktif, highlight oranye); tiap scene punya tombol **Hide** dan **More**; **Add Scene** |
| **Kanvas tengah** | Panorama 360; toolbar ikon atas: pencil/select, pin, target, pen line, teks, music, grid, plus, sliders (sebagian punya `data-ai-id`); **Mini-map** overlay bertuliskan "0 Hotspots"; HUD **"N / 90 / 0 / 0"**; **View settings**; **Resize tour graph panel** |
| **Toolbar bawah** | Tab **+ Hotspot**, **+ Media**, **+ Polygon**; **Default view** (`data-ai-id=tour.header.save-view`, teks "Click to Capture"); ikon kamera |
| **Inspector kanan** | Tab **Scene**, **Hotspot 0**, **Location** |

### 2.2 Scene Info Inspector — accordion (✅ Live)

| Accordion | Detail terverifikasi |
|---|---|
| Config | Input **Title** `layout_1` + tombol generate; input **Slug** + tombol generate |
| Thumbnail | **Make Screenshot**, **Upload Photo** |
| Replace | Ganti panorama + **Select post** |
| Background sound | **Upload file .mp3** |
| **AI Edit 360** | *"Remove objects, tripods or people, or change an area with a prompt, directly on this 360° image."* + tombol **AI Edit** |
| Leveling | *"Straighten a tilted panorama. North / yaw is left unchanged."* + **Level this scene** |
| Nadir | **Quick Fix** / **Custom Fix** |
| Staging Day To Dusk | tersedia |
| Filter Processing | tersedia |
| Sun light | tersedia |
| View | Limit view **-90 / 90 / -180 / 180**; Zoom limit **60 / 150** |

### 2.3 Tab +Hotspot / +Media / +Polygon (✅ Live)

- **+ Hotspot (9):** Point, Chevron, Image, Article, Video, Sound, Link, Compact, Product.
- **+ Media (5):** Video, Image, Text, Tourguide, Patch.
- **+ Polygon (2):** Shape, Line — dengan teks *"Select Polygon Type & Function to start drawing"*.
- **Tab Location:** *"No floorplans available"* + tombol **Create** (tour demo belum punya floorplan).

### 2.4 SEO Suggestion panel (✅ Live)

Tombol "3 Suggestion" membuka panel **SEO Preview**:
- **re-generate image**
- Kartu preview dengan domain `tour.panoee.net`, judul `aw`, tagline *"Start free to build high-quanlity & smart 360° Virtual Tour in minutes with beautiful themes & unlimited customization."*
- 3 saran: **"Update SEO Title & Description"**, **"Copyright need more customized"**, **"You might need better slug"**.

### 2.5 Menu Design — dialog dengan 10 sub-nav (✅ Live)

| Sub-panel | Pengaturan terverifikasi |
|---|---|
| **Theme** | 7 preset: **Default, Default 2.0, Solid, Wall, Base, Folio, Blank**; Primary color, Textcolor, Primary Font (**Roboto**), Secondary Font (**Open Sans**), Scene list position (**Left**), Hide Project Title, Hide Scene Title on Card Scene, Hide Scene Title, Auto open scene list, Show Scene Title in Scene List |
| **Hotspot → General** | Lock Hotspot; Keep hotspot position when zooming; Hide title on top; Hide Preview Box (When Hovering); Hide Title on Preview Box (When Hovering); Article Hotspot Popup Size (Custom/Fixed); Article Hotspot Popup Layout; Chevron navigation (Size slider, Floating arrow follows cursor, Chevron arrows on the floor, Navigation circles) |
| **Hotspot → Symbol** | Background `#E54D42`, Icon color `#FFFFFF`; ikon per tipe: Point=`Location01Icon`, Image=`Image01Icon`, Article=`NewspaperIcon`, Video=`Video01Icon`, Sound=`MusicNote01Icon`, Link=`Link01Icon`, Product=`CubeIcon` |
| **Hotspot → Label** | Font Type, Font Size, Letter Spacing, Spacing, Font Weight, Padding X/Y, Border Radius, Background, Text Color, Text Shadow, Uppercase, Italic, Only show on hover |
| **Hotspot → Distort** | Checkbox per tipe: Point, Chevron, Image, Article, Video, Sound, Link, Compact, Product |
| **Polygon** | Background color, Background hover, Border color, Border hover, Border width |
| **Popup** | Background color, Textcolor |
| **Floorplan** | Show on start; Layout **Box/Panel**; Position **Left/Right**; Background color; Radar Disabled; Marker Background `#007AFE`, Border `#FFFFFF` |
| **Googlemap** | Map Disabled; Radar Disabled; Marker Image (Change/Reset); Image When Active (Change/Reset); Width (px) |
| **Form** | Layout **Dialog/Panel**; Background color; Overlay color |
| **Call To Action** | Layout **Bubble/List**; Position **Left/Right**; Offset Left |
| **Control Bar** | *"Control bar when the tour opens"* = **Open**; **Auto-minimize after (seconds)** (0 = off) + penjelasan; tabel **ID / Category / Source / Hide** |
| **Dollhouse** | Disabled; Background color `#000000`; Hotspot color `#FFFFFF` |

### 2.6 Content/CMS, Marketing & Setting (✅ Live — level menu & field)

| Menu | Sub-nav / field terverifikasi |
|---|---|
| **Content (CMS)** | **Posts**, **Products**, **Floorplan**, **Forms**, **List Language**, **List Translation** |
| **Marketing** | **SEO**, **Forms**, **Script Chats**, **Call To Action**, **Snapshot** |
| **Setting** | **Content**, **Effect**, **View**, **Logo**, **Popup Intro**, **Collaboration**, **System**, **Multi-Language** |
| **Setting › Config** | Description, **Select post**, **Initial Scene**, **Background Sound**, **Location ("Set Location")**, **Nadir Disabled**, **Copyright Enabled** + Link + Author name + Description + **QRcode copyright** |
| **Upsell terverifikasi** | *"Want your own copyright branding? Replace the default Panoee attribution with your own branded copyright information. This is Enterprise feature, please upgrade the plan to use — Upgrade Now."* |

### 2.7 Fitur dari sumber publik (tetap tercatat, sebagian kini ✅ Live)

| Fitur | Status sumber | Catatan |
|---|---|---|
| Upload 32K, 2:1 flat image, multi-resolution, limit zoom, media management | [Home], [Dok] | Pipeline internal tidak terlihat di UI |
| Auto Nadir Fix AI 5–10 detik + Custom Fix | ✅ Live (tombol) + [Dok] | Tombol & label terverifikasi; hasil AI tidak diuji |
| Theme & skin | ✅ Live | 7 preset + warna/font/posisi scene list |
| Green screen / Tour Guide Video | ✅ Live (tab **+ Media › Tourguide**) + [Blog] | Detail chroma key dari blog |
| eCommerce / Product hotspot | ✅ Live (tipe **Product** + CMS **Products**) | — |
| Dollhouse | ✅ Live (menu + setup) | — |
| Little Planet / projection | [Blog] ⚪ | Tidak terlihat di menu yang dibuka |
| Auto rotate | ✅ Live (tab Setting › Effect tersedia) + [Dok] | Detail wait/speed/accelerate dari [Dok] |
| Side menu / Tour graph / Mini-map | ✅ Live (HUD + toggle) | Replika juga punya |
| Lead form | ✅ Live (CMS Forms + Marketing Forms + Design Form) + [Blog] | Google Sheet masih dari blog |
| CTA & live chat | ✅ Live (Marketing › Call To Action, Script Chats) | — |
| Multi-language | ✅ Live (CMS List Language/List Translation + Setting › Multi-Language) | 6 bahasa editor menurut [Blog] |
| SEO, slug, SEO image, GA | ✅ Live (SEO Suggestion + Marketing SEO) + [Dok] | — |
| Analytics | ✅ Live (Marketing › Snapshot) + [Dok] | Metrik detail dari [Dok] |
| Portfolio | [Dok] | `portfolio.panoee.com/{username}` |
| Publish: link/QR/domain/embed/access/cache | [Dok] + ✅ tombol **Published** | Panel publish tidak dibuka lebih jauh di sesi live |
| Export ZIP ($19/project), Street View, white-label DNS, team roles, collaboration detail | ⚪ | Namun tersedia sebagai menu/upsell; alur berbayar tidak dijalankan |
| Infrastruktur AWS/S3/CloudFront, API, SLA | [FAQ] | — |

---

## 3. Pricing tiers & batasan (snapshot 2026-11-23)

| Tier | Harga | Poin utama |
|---|---|---|
| **Free** | $0 selamanya | Project & tour unlimited, 3 GB, 7 hotspot types, 32K, sub-domain Panoee, bandwidth unlimited, analytics dasar, badge "Created with Panoee" |
| **PAYG** | $7–12/bulan | 1–3 Premium Project + unlimited Free, 3 GB, arsip project, hemat 45% vs Pro |
| **PRO** | $22/bulan | Premium unlimited, 2 custom domain/bulan, hapus branding, Street View, Professional Portfolio, 10+ hotspot, password, custom floorplan & map, detailed analytics |
| **PRO+** | $200/tahun | Semua Pro, billing tahunan (hemat 24%), priority email |
| **Enterprise** | $99/bulan | 1 user, 20 GB, white-label domain, user management, brand setting, dedicated support |
| **Enterprise+** | $950/tahun (5 user $1.548/tahun) | Enterprise dengan billing tahunan |
| **Storage tambahan** | $0,15/GB/bulan (Pricing) vs $0,12/GB (FAQ) | Inkonsistensi resmi; perlu konfirmasi |
| **Export activation** | $19/project sekali bayar | Unlimited re-export untuk project itu saja |

Upsell **copyright branding = Enterprise** terlihat langsung di Setting › Config, mengonfirmasi posisi branding di tier tertinggi.

---

## 4. Workflow & UI/UX editor (✅ Live + [Dok])

### 4.1 Alur resmi
1. **Upload** — New Project → Title/description/category → Advanced Setting → *Let's go* → Upload 360 (2:1) / pilih media → scene otomatis per panorama.
2. **Edit** — Tour Editor + Design/Content/Dollhouse/Floorplan/Marketing/Setting + 3 mode (Tour/Canvas/GSV).
3. **Publish** — tombol **Published** → link, QR, domain, embed, access level, cache.

### 4.2 Peta editor hasil verifikasi live

```
Header     [Back] [avatar aw·rename] [3 Suggestion] [Preview] [Published]
           Mode: tour.header.mode-tour | mode-canvas | mode-gsv
           Menu: Design · Content · Dollhouse · Floorplan · Marketing · Setting

Kiri       [Create] [+ Group] [Collapse] [Info] [Search] [More]
           Uncategory (rename/collapse) → layout_2, layout_1(aktif: Hide, More)
           [Add Scene]

Tengah     toolbar ikon: pencil/select · pin · target · pen · teks · music · grid · plus · sliders
           mini-map "0 Hotspots" · HUD "N / 90 / 0 / 0" · View settings · Resize tour graph panel
           bawah: + Hotspot | + Media | + Polygon | Default view (Click to Capture) | kamera

Kanan      Scene | Hotspot 0 | Location
           Scene: Config, Thumbnail, Replace, Sound, AI Edit 360, Leveling, Nadir,
                  Day To Dusk, Filter, Sun light, View
           + Hotspot: Point/Chevron/Image/Article/Video/Sound/Link/Compact/Product
           + Media: Video/Image/Text/Tourguide/Patch
           + Polygon: Shape/Line → "Select Polygon Type & Function to start drawing"
           Location: "No floorplans available" + Create

Dialog     Design: Theme · Hotspot · Polygon · Popup · Floorplan · Googlemap ·
                   Form · Call To Action · Control Bar · Dollhouse
           Content: Posts · Products · Floorplan · Forms · List Language · List Translation
           Marketing: SEO · Forms · Script Chats · Call To Action · Snapshot
           Setting: Content · Effect · View · Logo · Popup Intro · Collaboration · System · Multi-Language
```

### 4.3 Perbandingan UX ringkas

| Aspek | Panoee (live) | Virtour360 |
|---|---|---|
| Navigasi | 6 menu + 3 mode + path-based route | Top bar + popover "Pengaturan tampilan"; hash route `#/studio`; tanpa menu Design/CMS/Marketing/Setting |
| Toolbar kanvas | 9+ ikon termasuk teks, music, grid, plus | 6 ikon: select, cursor, pin, undo, draw, settings |
| Inspector | 3 tab + 11 accordion + 3 tab penambah konten | 3 tab (Scene/Hotspot/Location) + 10 accordion point setup |
| "3 Suggestion" | SEO Preview + re-generate image + 3 saran SEO | Panel dengan 3 aksi editor (tambah hotspot, reset view, scene berikutnya) |
| Theme | 7 preset + editor lengkap | `theme.ts` statis (1 tema gelap) |
| Panel publish | Tombol "Published" terverifikasi | Tombol "Published" + modal publish (link/QR/embed/access UI) |

---

## 5. TABEL PERBANDINGAN — Panoee (live-verified) vs Virtour360

**Status replika:** ✅ ada penuh · 🟡 ada sebagian/permukaan · ❌ tidak ada.  
**Kolom verifikasi:** `Live` = terverifikasi langsung pasca-login; selain itu memakai [Dok]/[Home]/[Blog]/[FAQ]/[RE]/⚪.

| # | Fitur | Panoee (verifikasi) | Status | Bukti / catatan di replika |
|---|---|---|---|---|
| | **A. Rute, mode & header** | | | |
| 1 | Rute path-based `{section}/{subsection}` | ✅ Live | ❌ | `Root.tsx` memakai hash `#/studio` dll., bukan path bertingkat |
| 2 | 3 mode: Tour / Canvas / GSV | ✅ Live (`mode-tour/canvas/gsv`) | ❌ | Tidak ada mode switcher |
| 3 | Header: Back, avatar rename, 3 Suggestion, Preview, Published | ✅ Live | 🟡 | `TopBar.tsx` punya avatar, "3 Suggestion", Preview, Published; **Back & rename tidak ada** |
| 4 | SEO Suggestion panel isi (SEO Preview, re-generate, 3 saran) | ✅ Live | 🟡 | Panel ada, tetapi isinya aksi editor generik, bukan SEO/copyright/slug |
| 5 | Panel scene kiri: Create, +Group, Collapse, Info, Search, More, Hide/More per scene, Add Scene | ✅ Live | 🟡 | `LeftSidebar.tsx` punya Create/Group/Collapse/Info/Search/More/Add Scene + rename/hapus grup + ↑↓; **Hide per scene tidak ada** |
| 6 | Toolbar kanvas ikon: pencil, pin, target, pen, teks, music, grid, plus, sliders | ✅ Live | 🟡 | `TopBar.tsx` tools = select, cursor, pin, undo, draw, settings (tanpa teks/music/grid/plus) |
| 7 | HUD "N / 90 / 0 / 0" + View settings + Resize tour graph panel | ✅ Live | 🟡 | HUD yaw/pitch/zoom ada di `BottomToolbar`; View settings ada; resize graph tidak |
| 8 | Toolbar bawah: +Hotspot, +Media, +Polygon, Default view "Click to Capture", kamera | ✅ Live | 🟡 | `BottomToolbar.tsx` punya +Hotspot, Media(=audio), Polygon(tersembunyi), Default view; tidak ada tab +Media/{Video,Image,Text,...} |
| 9 | Inspector tab Scene / Hotspot 0 / Location | ✅ Live | ✅ | `RightPanel.tsx` persis 3 tab ini |
| | **B. Scene inspector** | | | |
| 10 | Config: Title + generate, Slug + generate | ✅ Live | 🟡 | Title/ID scene read-only; **slug tidak ada** |
| 11 | Thumbnail: Make Screenshot + Upload Photo | ✅ Live | 🟡 | `captureThumbnail` + Lightbox; upload photo thumbnail tidak ada |
| 12 | Replace panorama + Select post | ✅ Live | ✅ | `RightPanel` Replace → `MediaPickerModal` |
| 13 | Background sound .mp3 per scene | ✅ Live | ✅ | `setSceneAudio`/`removeSceneAudio` |
| 14 | AI Edit 360 (remove objects/tripods/people via prompt) | ✅ Live (tombol) | ❌ | Tidak ada pipeline AI |
| 15 | Leveling + "Level this scene" | ✅ Live | 🟡 | Slider `roll` manual + tombol "Level this scene" |
| 16 | Nadir Quick Fix / Custom Fix | ✅ Live | 🟡 | Hanya checkbox penutup nadir (`effects.nadir`) |
| 17 | Staging Day To Dusk | ✅ Live | 🟡 | Preset `dusk` via CSS filter |
| 18 | Filter Processing | ✅ Live | 🟡 | Hue/grayscale/sepia via `effectsToCss` |
| 19 | Sun light | ✅ Live | 🟡 | Brightness + preset hangat/dingin |
| 20 | View: Limit -90/90/-180/180, Zoom 60/150 | ✅ Live | 🟡 | Angka ditampilkan statis; bukan editor interaktif |
| 21 | Initial Scene (Setting › Content) | ✅ Live | 🟡 | Scene awal dari `data/scenes.ts`, tanpa UI pemilih |
| 22 | Copyright: Enabled + Link + Author + Description + QRcode + upsell Enterprise | ✅ Live | ❌ | Tidak ada pengaturan copyright/atribusi |
| | **C. Hotspot, media & polygon** | | | |
| 23 | 9 tipe +Hotspot | ✅ Live | 🟡 | Picker 9 label di `BottomToolbar`, tapi dipetakan ke 4 tipe internal di `App.tsx` |
| 24 | 5 tipe +Media (Video/Image/Text/Tourguide/Patch) | ✅ Live | ❌ | Tidak ada konten media; ikon saja |
| 25 | 2 tipe +Polygon + "Select ... to start drawing" | ✅ Live | ❌ | Tombol Polygon tersembunyi; klik → `startPlacement("project")` |
| 26 | Symbol: bg `#E54D42`, icon `#FFF`, ikon per tipe (Location01Icon dll.) | ✅ Live | 🟡 | Ikon SVG kustom mirip; warna default `#facc15` |
| 27 | Label style: font, spacing, padding, radius, shadow, uppercase, italic, only-on-hover | ✅ Live | 🟡 | Baru `showLabel` + `labelOnHover` |
| 28 | Hotspot Distort per tipe | ✅ Live | ❌ | Tidak ada |
| 29 | Chevron navigation: size, floating arrow, arrows on floor, circles | ✅ Live | ❌ | Chevron hanya ikon untuk tipe `scene` |
| 30 | Article popup size (Custom/Fixed) & layout | ✅ Live | ❌ | Tidak ada popup artikel |
| 31 | Hotspot General: Lock, keep position on zoom, hide title/preview box | ✅ Live | ❌ | Tidak ada |
| | **D. Design panel** | | | |
| 32 | 7 preset theme: Default, Default 2.0, Solid, Wall, Base, Folio, Blank | ✅ Live | ❌ | `config/theme.ts` = 1 tema statis |
| 33 | Primary/Text color, Primary Font Roboto, Secondary Font Open Sans, scene list position, hide flags | ✅ Live | ❌ | Tidak ada theme editor |
| 34 | Polygon Setup: background/border colors & width | ✅ Live | ❌ | Tidak ada |
| 35 | Popup Setup: background & text color | ✅ Live | ❌ | Tidak ada popup intro |
| 36 | Floorplan Setup: show on start, Box/Panel, Left/Right, bg, Radar, marker `#007AFE` | ✅ Live | ❌ | Panel Location hanya teks; eksplisit "tidak ada geotagging" |
| 37 | Googlemap Setup: Map/Radar Disabled, Marker Image, Image When Active, Width | ✅ Live | ❌ | Tidak ada peta |
| 38 | Form Setup: Dialog/Panel, background, overlay | ✅ Live | ❌ | Tidak ada form |
| 39 | CTA Setup: Bubble/List, Left/Right, Offset Left | ✅ Live | ❌ | Tidak ada CTA panel |
| 40 | Control Bar: Open, Auto-minimize seconds, tabel ID/Category/Source/Hide | ✅ Live | 🟡 | Toolbar ada + `SettingsPopover`, tanpa konfigurasi auto-minimize/hide |
| 41 | Dollhouse Setup: Disabled, bg `#000000`, hotspot `#FFFFFF` | ✅ Live | ❌ | Tidak ada |
| | **E. CMS / Content** | | | |
| 42 | CMS Posts | ✅ Live (`/cms/post`) | 🟡 | `MediaPickerModal` + `data/examples.ts`, bukan CRUD CMS |
| 43 | CMS Products | ✅ Live | ❌ | Tidak ada |
| 44 | CMS Floorplan | ✅ Live | ❌ | Tidak ada |
| 45 | CMS Forms | ✅ Live | ❌ | Tidak ada |
| 46 | List Language + List Translation | ✅ Live | ❌ | UI Indonesia/English hardcoded; tanpa i18n |
| | **F. Marketing** | | | |
| 47 | Marketing › SEO | ✅ Live | 🟡 | Meta statis di `index.html`; tidak ada panel SEO per tour |
| 48 | Marketing › Forms | ✅ Live | ❌ | Tidak ada |
| 49 | Marketing › Script Chats (Tawk.to/Facebook) | ✅ Live | ❌ | Tidak ada injeksi script |
| 50 | Marketing › Call To Action | ✅ Live | ❌ | Hanya hotspot `link` + `mailto:` |
| 51 | Marketing › Snapshot / analytics | ✅ Live + [Dok] | 🟡 | KPI dashboard & "1313 Views" statis, bukan tracking |
| | **G. Setting** | | | |
| 52 | Setting › Content / Effect / View | ✅ Live | 🟡 | Fitur tersebar di inspector & `SettingsPopover`, bukan menu Setting |
| 53 | Setting › Logo | ✅ Live | ❌ | Branding Virtour360 tetap |
| 54 | Setting › Popup Intro | ✅ Live | ❌ | Tidak ada |
| 55 | Setting › Collaboration | ✅ Live (menu) | ❌ | Tidak ada komentar/tugas realtime |
| 56 | Setting › System | ✅ Live | ❌ | Tidak ada |
| 57 | Setting › Multi-Language | ✅ Live | ❌ | Tidak ada |
| 58 | Background Sound global + Location "Set Location" | ✅ Live | 🟡/❌ | Audio global ❌; lokasi hanya teks profil statis |
| | **H. Publish, distribusi & platform** | | | |
| 59 | Tombol Published + panel publish | ✅ Live (tombol), [Dok] (panel) | 🟡 | `PublishModal`: link/QR/embed/access UI |
| 60 | Password protection ditegakkan di viewer | [Dok], UI publish 🟡 | 🟡 | `access`/`password` tidak dikirim ke payload; viewer publik tidak memeriksa |
| 61 | Slug unik bisa diubah | ✅ Live (field Slug) + [Dok] | ❌ | `makePublicUid()` = 10 char acak |
| 62 | Custom domain + verifikasi DNS | ⚪ (alur berbayar) | ❌ | Tidak ada |
| 63 | Export ZIP self-host ($19/project) | ⚪ (dokumen; alur bayar tidak dijalankan) | ❌ | Hanya build statis Vercel |
| 64 | Google Street View publish | ⚪ | ❌ | Tidak ada |
| 65 | White-label penuh (Studio URL + Tour URL, DNS) | ⚪ (upsell copyright ✅ Live) | ❌ | Tidak ada |
| 66 | Team roles (5 user, view-only/editor/admin) | ⚪ | ❌ | Auth single-user |
| 67 | Multi-resolution / 32K / AI pipeline upload | ⚪ (klaim) | ❌ | Tidak ada pyramid tiling |
| 68 | Infrastruktur AWS/S3/CloudFront, API publik | [FAQ] | 🟡 | Supabase Storage + Vercel; policy demo permisif |

**Skor kasar (68 titik):** ✅ ±12 · 🟡 ±24 · ❌ ±32. Kesenjangan terbesar: **Design/CMS/Marketing/Setting** — tepat area yang baru terverifikasi langsung.

---

## 6. Rekomendasi fitur prioritas (≤15, urut dampak × kemudahan)

| # | Fitur (terinspirasi UI live) | Dampak | Kemudahan | Target / catatan |
|---|---|---|---|---|
| 1 | **Password protection fungsional** | Tinggi | Mudah | `PublishModal.tsx` kirim `access`+password ke payload; `publicStore.ts` simpan; `PublicViewerModal.tsx` gate. UI sudah ada. |
| 2 | **Slug + SEO Suggestion panel + SEO per-tour** | Tinggi | Mudah–Sedang | Field Slug + generate; panel "3 Suggestion" isi dengan SEO Title/Description, copyright, slug; metadata dinamis + og:image. |
| 3 | **7 preset theme + theme editor** | Tinggi | Sedang | Theme presets + primary/text color + font + scene list position + hide flags; simpan di `PublicPayload`, terapkan di viewer & portfolio (`config/theme.ts` saat ini statis). |
| 4 | **Floorplan 2D + Google Map** | Tinggi | Sedang | Design sub-panel Floorplan/Googlemap + tab Location "No floorplans available" → Create; marker klik untuk pindah scene; radar & gambar marker. |
| 5 | **CTA (Bubble/List) + Form (Dialog/Panel)** | Tinggi | Sedang | Panel Design + Marketing; CTA tel/email/WA/link; form field + kirim ke Supabase/Google Sheet; trigger project/scene/delay. |
| 6 | **CMS Posts / Products / Forms + "Select post"** | Tinggi | Sedang | CRUD ringan di `data/` + UI `/cms/*`; `MediaPickerModal` saat ini hanya picker statis, ubah jadi picker CMS. |
| 7 | **Wujudkan 9 hotspot + 5 media + 2 polygon** | Tinggi | Sedang–Sulit | Perluas `HotspotType`, konten Image/Article/Video/Sound/Compact/Product/Tourguide/Patch, dan gambar area Shape/Line (aktifkan tombol tersembunyi). |
| 8 | **Hotspot style editor lanjutan** | Sedang | Mudah–Sedang | Font size/weight/spacing, padding, radius, text shadow, uppercase/italic, only-on-hover, per-type icon & warna, distort; sebagian sudah ada di `RightPanel.tsx`. |
| 9 | **Multi-language (List Language + List Translation)** | Sedang | Sedang | i18n ringan untuk UI + teks hotspot; simpan terjemahan di `PublicPayload`. |
| 10 | **Analytics + Snapshot** | Sedang | Sedang | Endpoint `/api/track`, tabel events, ganti KPI statis; panel Snapshot meniru kartu ringkas. |
| 11 | **Popup Intro (Setting)** | Sedang | Mudah | Image/video desktop-mobile + auto close + teks tutup; tampil sebelum `PublicViewerModal`. |
| 12 | **Copyright branding / white-label mini** | Sedang | Sedang | Ganti "Virtour360" dengan nama akun + logo + link author + QR; jujur ditandai sebagai non-Enterprise di replika. |
| 13 | **Control Bar settings (Open, auto-minimize, hide ID)** | Sedang | Mudah | `SettingsPopover` + `BottomToolbar`: auto-minimize seconds dan hide per item. |
| 14 | **Upload pipeline 2:1 + optimasi + batas ukuran** | Sedang | Mudah–Sedang | `UploadModal.tsx`: validasi rasio, downscale canvas, tampilkan resolusi; pesan jelas bila bukan equirectangular. |
| 15 | **Export ZIP self-host** | Sedang | Sedang | Bundel `dist/` + payload + media → ZIP; tombol di PublishModal (tanpa pembayaran). |

**Backlog di luar 15:** AI Edit 360 & Nadir AI (butuh model/pipeline), Dollhouse 3D, Google Street View publish, white-label DNS penuh, team roles/kolaborasi realtime, Little Planet projection, export berbayar, API publik.

---

## 7. Referensi

### Verifikasi live (parent session, setelah user login)
- `https://studio.panoee.net/editor/6b004bb6f65b1269ed2183ca/tour-editor/scene/6b004be9366069782ad46600/scene-info`
- `.../scene/6b004be9f65b1269ed2188c6/design/theme`
- `.../scene/6b004be9f65b1269ed2188c6/design/hotspot`
- `.../cms/post` · `.../marketing/seo` · `.../setting/config`
- `https://studio.panoee.net/account/auth/login` (tujuan redirect sebelum login)

### Situs & dokumen publik
- https://panoee.com/ · https://panoee.com/pricing · https://panoee.com/ask · https://panoee.com/documents
- https://panoee.com/demos · https://tour.panoee.net/6788f583814ed687cea302df/68060adf12c8ae6247852d3f
- https://panoee.com/document/create-publish-a-basic-virtual-tour
- https://panoee.com/document/create-hotspot-basic
- https://panoee.com/document/add-and-customize-cta-buttons-in-a-panoee-tour
- https://panoee.com/document/embed-facebook-live-chat-or-tawkto-in-a-panoee-tour
- https://panoee.com/document/read-built-in-tour-analytics-and-improve-traffic-sources-and-ctas
- https://panoee.com/document/set-seo-metadata-and-preview-image-for-a-panoee-virtual-tour
- https://panoee.com/document/set-a-password-for-your-virtual-tour
- https://panoee.com/document/how-to-change-your-tour-url-slug
- https://panoee.com/document/export-project · https://panoee.com/document/set-up-panoee-hosting-project
- https://panoee.com/document/setup-white-label · https://panoee.com/document/create-public-portfolio
- https://panoee.com/document/enable-auto-rotate · https://panoee.com/document/popup-intro
- https://panoee.com/document/auto-nadir-fix · https://panoee.com/document/update-background-sound
- https://panoee.com/add-a-form-to-a-virtual-tour · https://panoee.com/add-a-tour-guide-to-a-virtual-tour
- https://panoee.com/panoee-updates-february-2024
- YouTube: `AF1ngOYwXHo`, `1WLWZNo7zbk`, `lNfyQBU6t0U`, `iybQKq9tT3I`, `6rHEq1iRRXc`, `FdnVW2izYDc`, `Zhdp3nOe0Mk`, `UbZ0XA0n5PQ`

### Sumber replika (dibaca, tidak diubah)
`README.md` · `docs/PLAN.md` · `docs/RESEARCH.md` · `src/Root.tsx` · `src/App.tsx` · `src/types/tour.ts` · `src/config/theme.ts` · `src/components/layout/{TopBar,LeftSidebar,RightPanel}.tsx` · `src/components/viewer/{TourViewer,MiniMap,BottomToolbar,PublicViewerModal}.tsx` · `src/components/auth/{PublishModal,EmbedModal,UploadModal,ProfileModal}.tsx` · `src/views/{DashboardView,PublicHomeView,PublicPortfolioView}.tsx` · `src/{context/AppContext,lib/publicStore,lib/effects}.ts` · `supabase/schema.sql`

---

## 8. Batasan & catatan metodologis

1. **Verifikasi live dilakukan oleh parent session** dengan browser setelah user login di Review pane; agen penulis hanya mengintegrasikan temuan, bukan menjalankan browser sendiri (pada sesi agen `tools.browser.*` sebelumnya mengembalikan `[browser.disconnected]`).
2. Status **✅ Live** berarti elemen terlihat di layar (label, field, tombol, tab). **Tidak berarti** perilaku backend, hasil AI, pembayaran, atau efek publish diuji.
3. Fitur di balik alur berbayar/plan Enterprise (export $19, DNS white-label, manajemen user, detail Collaboration, Street View) tetap bertanda **⚪** meski menu/upsell-nya terlihat.
4. Tidak ada kredensial yang dimasukkan akun, pendaftaran, atau transaksi oleh agen. User melakukan login di luar agen.
5. Harga/fitur dapat berubah; snapshot 2026-11-23. Selisih storage $0,15 (Pricing) vs $0,12 (FAQ) perlu konfirmasi terpisah.
6. **Tidak ada file source replika yang diubah** selama riset maupun penulisan dokumen ini.
