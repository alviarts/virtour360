# Analisis Menyeluruh — Semua Path / Rute di Panoee

> Dibuat ulang 2026-11-23 dengan **browser sesi login aktif** (bukan hanya riset statis).
> Metode: klik setiap menu/navigasi, catat perubahan `location.href`, kumpulkan `a[href]` dan `data-ai-id`.
> Tidak ada data yang diubah: hanya navigasi, tanpa create/publish/delete/logout.

---

## 1. Domain & origin

| Origin | Fungsi |
|---|---|
| `https://studio.panoee.net` | Studio/editor + dashboard (SPA, login required) |
| `https://studio.panoee.com` | Alias Studio (dari riset sebelumnya) |
| `https://studio-api.panoee.com/api/` | API backend Studio (axios base URL) |
| `https://tour.panoee.net` | Tampilan tour publik hasil publish |
| `https://panoee.com` | Situs pemasaran, dokumentasi, tools web |
| `https://panoee.live` | Komunitas 360° |
| `https://api.panoee.com/wp-content/...` | WordPress CMS untuk blog/gambar |
| `https://discuss.panoee.com` | Forum |

Catatan: SPA **tidak memakai `<a href>` untuk navigasi internal** — hampir semuanya `<button>` + `router.push`. Karena itu daftar path diperoleh dari perilaku klik, bukan dari DOM link.

---

## 2. Path autentikasi

| Path | Keterangan |
|---|---|
| `/account/auth/login` | Halaman masuk; URL editor saat belum login di-redirect ke sini |
| `/account/auth/register` | Halaman daftar (dari riset situs) |
| `/account/auth/logout` | Log out (inferensi dari menu "Log Out", tidak diklik) |

---

## 3. Dashboard

| Path | Menu / akses | Observasi |
|---|---|---|
| `/` | Root | Redirect ke area dashboard saat sudah login |
| `/dashboard/projects` | **Project** | Daftar project; tab `Live` / `Studio`, grid/list, filter, search |
| `/dashboard/media` | **Media** | Add Album, Pano, Asset, Root, Sort Media, drop 360 images, Upload 360 |
| `/dashboard/promotions` | **Promotion** (badge `3`) | Kupon & promosi (survey, Facebook, Capterra) |
| `/dashboard/enterprise` | **Enterprise** | Halaman paket enterprise |
| `/dashboard/tools/hosting` | Tools → **Static Hosting** | Static hosting |
| `/dashboard/tools/floorplan-maker` | Tools → **Floorplan Generator** | Pembuat floorplan |
| `/dashboard/tools/pano-edit` | Tools → **AI Edit 360** | AI edit panorama |

**Catatan penting:** menu **Tools** adalah *dropdown*, bukan rute. Menu **Changelog** juga *drawer/modal* (`changelog.drawer.open`), bukan rute. **New Project** adalah aksi create, bukan rute.

Dari halaman project, `data-ai-id` yang teramati:
`project.list.create`, `project.list.source-live`, `project.list.source-studio`, `project.list.layout-grid`, `project.list.layout-list`, `project.list.filter`, `project.list.search`, `project.item.open`, `project.item.preview`, `project.item.duplicate`, `project.item.unpublish`, `project.item.delete`, `subscription.policy-announcement.dismiss`.

- `project.item.open` → `/editor/{tourId}/tour-editor/scene/{sceneId}/scene-info`
- `project.item.preview` → tour publik `https://tour.panoee.net/{tourId}/{sceneId}`

---

## 4. Account / Profile

Menu **Account** (8 item) dan rute hasil klik:

| Menu item | Path |
|---|---|
| Profile | `/profile/edit` |
| Portfolio | `/profile/portfolio/dashboard` |
| Subscriptions | `/profile/subscriptions` |
| My Card | `/profile/my-card` |
| Invoices | `/profile/payments` |
| Affiliate | `/profile/affiliate/dashboard` |
| Change Password | `/profile/setting` |
| Log Out | (tidak diklik — mengakhiri sesi) |

Rute lain yang pernah terlihat: `/profile/subscriptions` dipakai juga sebagai tujuan tombol upgrade di situs.

---

## 5. Editor — pola utama

### 5.1 Pattern dasar

```
/editor/{tourId}/tour-editor/scene/{sceneId}/{bagian}/{subbagian}
```

Contoh teramati:

```
/editor/6b004bb6f65b1269ed2183ca/tour-editor/scene/6b004be9366069782ad46600/scene-info
/editor/6b004bb6f65b1269ed2183ca/tour-editor/scene/6b004be9f65b1269ed2188c6/design/theme
```

- `tourId` = ObjectId 24-hex (contoh `6b004bb6f65b1269ed2183ca`)
- `sceneId` = ObjectId 24-hex (contoh `6b004be9366069782ad46600`)
- Catatan: beberapa aksi (mode tour/canvas/gsv, klik scene) mengganti `sceneId` aktif ke scene lain, mis. `6b004be9f65b1269ed2188c6`.

### 5.2 scene-level

| Sub-path | Keterangan |
|---|---|
| `.../scene/{sceneId}/scene-info` | Inspector scene: Title/Slug + generator, Thumbnail (screenshot/upload), Replace, Select post, Upload `.mp3`, AI Edit 360, Leveling, Nadir Quick/Custom Fix, Staging Day To Dusk, Filter Processing, Sun light, Limit view, Zoom limit |
| `.../scene/{sceneId}/hotspot` | Daftar/kelola hotspot scene |
| `.../scene/{sceneId}/location` | Floorplan/lokasi (tour demo: "No floorplans available") |
| `.../scene/{sceneId}/hotspot/{hotspotId}` | Detail satu hotspot (teramati: `hotspot/6b03266079be4fbb6f1aac86`) |

`data-ai-id` di scene-info:
`scene.info.title`, `scene.info.title-generate`, `scene.info.slug`, `scene.info.slug-generate`, `scene.info.featured-screenshot`, `scene.info.featured-upload`, `scene.info.replace-pano`, `scene.info.post`, `scene.info.background-sound`, `pano-edit-panel`, `pano-edit-open`, `scene.info.nadir-quick-fix`, `scene.info.nadir-custom-fix`, `scene.info.view-limit`, `scene.info.view-zoom`, `tour.header.save-view`, `tour.view.settings`.

`data-ai-id` toolbar: `hotspot.create.tab-hotspot`, `hotspot.create.tab-media`, `hotspot.create.tab-polygon`.

### 5.3 Menu utama editor → rute

| Menu header | Rute tujuan |
|---|---|
| **Design** | `.../design/theme` |
| **Content** | `.../cms/post` |
| **Marketing** | `.../marketing/seo` |
| **Setting** | `.../setting/config` |
| **Dollhouse** | `/editor/{tourId}/dollhouse?scene={sceneId}` |
| **Floorplan** (dalam Dollhouse) | `/editor/{tourId}/dollhouse/floor-plan-maker` |

Tombol `tour.header.mode-tour`, `mode-canvas`, `mode-gsv` **tidak mengubah URL** — hanya state UI (mode tampilan).

### 5.4 Design — 10 sub-path

| Sub-menu | Path |
|---|---|
| Theme | `.../design/theme` |
| Hotspot | `.../design/hotspot` |
| Polygon | `.../design/polygon` |
| Popup | `.../design/popup` |
| Floorplan | `.../design/floorplan` |
| Googlemap | `.../design/map` ← **URL memakai `map`, bukan `googlemap`** |
| Form | `.../design/form` |
| Call To Action | `.../design/call-to-action` |
| Control Bar | `.../design/controlbar` ← **tanpa tanda hubung** |
| Dollhouse | `.../design/dollhouse` |

Isi ringkas:
- **Theme**: 7 preset (Default, Default 2.0, Solid, Wall, Base, Folio, Blank), Primary color, Text color, Primary/Secondary Font, Scene list position, Hide Project Title, Hide Scene Title on Card Scene, Hide Scene Title, Auto open scene list, Show Scene Title in Scene List.
- **Hotspot**: General (Lock Hotspot, Keep hotspot position when zooming, Hide title on top, Hide Preview Box, Hide Title on Preview Box, Article popup Size/Layout, Chevron navigation: Size, Floating arrow, Chevron arrows, Navigation circles), Symbol (Background, Icon color, ikon per tipe), Label (Font, Size, Letter Spacing, Spacing, Weight, Padding X/Y, Radius, Background, Text Color, Text Shadow, Uppercase, Italic, Only show on hover), Hotspot Distort (checkbox per tipe).
- **Polygon**: Background color, Background hover, Border color, Border hover, Border width.
- **Popup**: Background color, Text color.
- **Floorplan**: Show on start, Layout Box/Panel, Position Left/Right, Background color, Radar, Marker background/border.
- **Map**: Map Disabled, Radar Disabled, Marker Image (Change/Reset), Image When Active, Width (px).
- **Form**: Layout Dialog/Panel, Background color, Overlay color.
- **CTA**: Layout Bubble/List, Position Left/Right, Offset Left.
- **Control Bar**: Open, Auto-minimize after seconds, tabel ID/Category/Source/Hide.
- **Dollhouse**: Disabled, Background color, Hotspot color.

### 5.5 CMS — 6 sub-path

| Sub-menu | Path |
|---|---|
| Posts | `.../cms/post` |
| Products | `.../cms/product` |
| Floorplan | `.../cms/floorplan` |
| Forms | `.../cms/form/create` ← **bukan `/cms/form`** |
| List Language | `.../cms/languages` |
| List Translation | `.../cms/translations` ← **bukan `/cms/translation`** |

### 5.6 Marketing — 5 sub-path

| Sub-menu | Path |
|---|---|
| SEO | `.../marketing/seo` |
| Forms | `.../marketing/form` |
| Script Chats | `.../marketing/script-chats` |
| Call To Action | `.../marketing/call-to-actions` ← **jamak** |
| Snapshot | `.../marketing/screenshot-capture` ← **bukan `/marketing/snapshot`** |

Panel SEO memuat：SEO Preview, "re-generate image", domain `tour.panoee.net`, judul, deskripsi, dan "3 Optimize suggestion" (Update SEO Title & Description, Copyright need more customized, You might need better slug).

### 5.7 Setting — 8 sub-menu

| Sub-menu | Path | Catatan |
|---|---|---|
| Content | `.../setting/config` | Sama dengan halaman default |
| Effect | `.../setting/effect` | |
| View | `.../setting/view` | |
| Logo | `.../setting/logo` | |
| Popup Intro | `.../setting/popupIntro` | **CamelCase** |
| Collaboration | `.../setting/collaboration` | |
| System | `.../setting/system` | |
| Multi-Language | `.../setting/config` | Tidak punya path sendiri; mengarah ke config (tab Multi-Language) |

Isi `setting/config`: Description, Select post, Initial Scene, Select Scene, Background Sound, Location ("Set Location"), Nadir Disabled, Copyright, Link/Author name/Description/QRcode copyright, dan upsell Enterprise branding.

---

## 6. Path publik & result publish

| Path | Keterangan |
|---|---|
| `https://tour.panoee.net/{tourId}/{sceneId}` | Tour publik (contoh: `/6788f583814ed687cea302df/68060adf12c8ae6247852d3f`) |
| `https://panoee.live?welcome` | Komunitas 360° |
| `https://panoee.live/{...}` | Profil/portofolio kreator di komunitas |

---

## 7. Path situs panoee.com (publik, tanpa login)

| Grup | Path |
|---|---|
| Produk | `/pricing`, `/roadmap`, `/demos`, `/gallery` |
| Support | `/ask` (FAQ), `/documents`, `/blog` |
| Industri | `/virtual-tour-real-estate`, `/virtual-museum-tours`, `/virtual-campus-tours`, `/hotel-virtual-tours`, `/virtual-tourism`, `/virtual-tours-for-industrial-parks` |
| Affiliate | `/affiliate` |
| Legal | `/privacy-policy`, `/terms-of-use` |
| Tools web | `/360-panorama-viewer-online`, `/360-panorama-optimization`, `/3d-floorplan-maker`, `/nadir-fixer`, `/level-360-panorama`, `/dual-fisheye-to-equirectangular`, `/panorama-to-360-converter`, `/google-maps-360-photo-checker`, `/360-embed-code-generator`, `/360-photo-color-correction`, `/360-exif-fixer`, `/360-agency-directory`, `/best-360-cameras-for-virtual-tours`, `/best-virtual-tour-software` |
| Artikel/blog (contoh) | `/cubicasa-alternative`, `/matterport-alternative`, `/iguide-alternative`, `/what-is-a-virtual-tour`, `/virtual-tour-vs-3d-tour`, `/best-virtual-tour-software` |
| Endpoint internal | `/api/auth/studio?to=...`, `/api/auth/studio` |

---

## 8. Pola parameter & ID

| Jenis | Contoh | Keterangan |
|---|---|---|
| `tourId` | `6b004bb6f65b1269ed2183ca` | MongoDB ObjectId, 24 hex |
| `sceneId` | `6b004be9366069782ad46600` | MongoDB ObjectId, 24 hex |
| `hotspotId` | `6b03266079be4fbb6f1aac86` | MongoDB ObjectId, 24 hex |
| `scene` (query) | `?scene=6b004be9f65b1269ed2188c6` | Dipakai rute Dollhouse |
| `id` (query) | `?id=...` | Dipakai endpoint publik replika (`/api/public?id=`) |
| `uid` | 10 char | UID publish replika (bukan Panoee) |

---

## 9. Hal yang **bukan** path

- Dropdown **Tools** (sub-menu langsung berupa rute saat diklik, tapi induknya tidak).
- Drawer **Changelog** (`changelog.drawer.open`).
- Panel **promotions** di kanan (`View promotions`).
- Mode **Tour / Canvas / GSV** — state UI, URL tidak berubah.
- Checkbox/tab di inspector — sebagian berubah path (`hotspot`, `location`), sebagian tidak.

---

## 10. Implikasi untuk replika lokal `virtour360`

Replika memakai **hash router** dengan 7 pola: `#/`, `#/home`, `#/portfolio`, `#/portfolio/:id`, `#/p/:uid`, `#/studio`, `#/dashboard`. Panoee memakai **path router** penuh.

| Panoee | Replika saat ini | Status |
|---|---|---|
| `/dashboard/projects`, `/dashboard/media`, `/dashboard/tools/*`, `/dashboard/promotions`, `/dashboard/enterprise` | `#/dashboard` (satu view) | Sebagian |
| `/profile/edit`, `/profile/subscriptions`, `/profile/my-card`, `/profile/payments`, `/profile/affiliate/dashboard`, `/profile/setting` | Tidak ada | Belum |
| `/editor/{tourId}/tour-editor/scene/{sceneId}/scene-info` | `#/studio` (scene aktif disimpan di state) | Sebagian |
| `.../design/*` (10), `.../cms/*` (6), `.../marketing/*` (5), `.../setting/*` (8) | Modal Design/CMS/Marketing/Setting (state, bukan URL) | Sebagian |
| `/editor/{tourId}/dollhouse?scene=...` | Tidak ada | Belum |
| `https://tour.panoee.net/{tourId}/{sceneId}` | `#/p/{uid}` | Ada (model berbeda) |

Rekomendasi: jika ingin URL shareable per panel, pertimbangkan memetakan modal Design ke hash seperti `#/studio/design/theme` tanpa mengubah arsitektur router yang sudah ada.
