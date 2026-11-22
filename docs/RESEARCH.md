# Reverse Engineering — Panoee (2026-11-22)

Sumber: bundle JS publik `studio.panoee.net/assets/index-CW7_RMMO.js` (~1 MB),
`core/tour.js` (krpano 1.21.2 build 2023-12-11), CSS bundle, dan fiddler statis halaman.

## Stack yang terdeteksi
| Lapisan | Teknologi |
|---|---|
| UI | React + Redux, React Router, Tailwind CSS, Radix, react-i18next |
| HTTP | axios (base `https://studio-api.panoee.com/api/`, timeout 120s) |
| Viewer | **krpano 1.21.2** (2D/3D, VR, gyro, transisi) + three.js |
| Peta | Google Maps JS API + Leaflet |
| Realtime | Pusher (`/pusher/auth`, `/pusher/user-auth`) |
| Analytics | PostHog (`https://us.i.posthog.com`) |
| Storage | AWS S3 (`app/getAws`), upload media, quality Standard/High/Original |
| SEO/domain | custom domain, verify-domain, seo/reindex-url |
| Lain | dayjs, websocket, Cloudflare |

## API (dari string bundle)
- Auth: `auth/login`, `auth/register`, `auth/v2/login-social`, `auth/v2/send-magic-code`,
  `auth/v2/login-magic-code`, `auth/forgot-password`, `auth/change-forgot-password`
- Project: `dashboard/getListProject`, `createProject`, `updateProject`, `deleteProject`,
  `project/duplicate-project`, `project/export`, `project/create-domain`, `project/verify-domain`
- Scene: `scene/CreateScene(s)`, `UpdateScene`, `DeleteScene`, `SortScenes`
- Group: `editors/GetListGroup`, `createGroup`, `sortGroup`, `updateGroup`, `deleteGroup`
- Hotspot: `hotspot/GetListHotspot`, `UpdateHotspot`, `DeleteHotspot`
- Media: `media/upload`, `gets`, `update`, `delete`, `createFolder`, `remake-path`,
  `media/leveling/estimate`
- Lain: `app/getMe`, `getUserStats`, `getSubscription`, `getAws`, `getListMediaBuiltIn`

## Teknik yang diimplementasikan ke Virtour360
1. **Grup scene** penuh (buat/ganti nama/hapus/pindah scene) + **SortScenes** (↑/↓).
2. **Kualitas gambar** Standard/High/Original (seperti konstanta `Kbe` di bundle).
3. **Embed widget** — generator kode iframe, mirip `panoee.com/embed/widget.js`.
4. Sudah ada sebelumnya: hotspot CRUD, tur multi-scene, mini-map, leveling (roll),
   nadir, quick/custom fix, filter, day-to-dusk, sun light, publish, akun.

## Pendalaman hotspot & point setup
Dari bundle (`vme`, `IAe`, `NAe`, `DAe`) model hotspot Panoee:
```
id, ath (yaw), atv (pitch), title, type,
config.style: { type:"icon", effect, rotate, opacity, size, icon{icon_type,svg,icon,bg_color},
                lottie, marker, callout, zoomRange, label },
polygon_config
```
- `ath/atv` = yaw/pitch (krpano), sama dengan model yaw/pitch kita.
- Nilai `effect`: `normal`, `pulse`, `blink`, `spin`, `bounce`, `rotate`, `none`.
- Tipe point: `info`, `scene`, `link`, `url`, `image`, `video`, `audio`, `text`, `html`,
  `map`, `product`; ada juga polygon (`polygon_config`) dan `isDrawingHotspot`.
- Style default: `size: 3`, `opacity: 100`, `effect: normal`, warna dari `bgColor`.
- `defaultPointStyle` bisa dipakai untuk semua point baru.

### Pendalaman ikon, ukuran & transisi
- Field style: `size` slider **1–15**, `opacity` **10–100**, `rotate` **−360…360**,
  `effect` select (`normal/pulse/blink/spin/bounce/rotate/none`).
- Bentuk marker: `square`, `diamond`, `star`, `hexagon`, `triangle`, `heart`
  (+ circle/default). Dibuat dengan `clip-path` CSS.
- Tipe point: `point`, `image`, `article`, `video`, `link`, `product` (beberapa premium),
  ikon default via HugeIcons: `Location01Icon`, `Navigation03Icon`, `Video01Icon`,
  `Camera01Icon`, `Link01Icon`, `MusicNote01Icon`, `Image01Icon`, `CubeIcon`, …
- `icon_type`: `hugeicon` | `svg` | `fontawesome`; warna dari `bg_color`.
- Label: `fontSize 14`, `fontWeight 600`, `paddingX 12`, `paddingY 4`,
  `borderRadius 4`, bg `rgba(0,0,0,.35)`, `onlyShowOnHover`, `hideTitle`, text shadow.
- `callout: { type:"image", degrees:45 }`, `zoomRange: { min:1, max:179 }`.
- Mode viewer: `classic` | `graph3d` (disimpan di localStorage `panoee:tour-viewer-mode`).

### Diimplementasikan
- `Hotspot.style` (size 1–5, effect, color, opacity, showLabel) di `src/types/tour.ts`.
- Marker viewer Studio & publik dirender dengan kelas efek + warna + label.
- Panel **Point setup** di editor hotspot: ukuran (1–15), opacity (10–100),
  rotasi (−360…360), efek, bentuk, ikon, warna, label & label-on-hover.
- CSS animasi `hs-pulse`, `hs-blink`, `hs-spin`, `hs-bounce`, `hs-rotate`
  (mati dengan reduced-motion) + bentuk via `clip-path` (diamond/star/hexagon/triangle/heart).
- Ikon SVG custom untuk point/info/image/video/sound/link/product/star/heart.
- **Hotspot picker 9 jenis** ala Panoee (Point, Chevron, Image, Article, Video,
  Sound, Link, Compact, Product) di toolbar bawah; tiap jenis memetakan ke tipe +
  ikon internal, lalu masuk mode penempatan klik-di-gambar.

### Belum (butuh engine/pipeline)
- Polygon hotspots (`polygon_config` + mode gambar area) baru sebatas tombol "Gambar area".
- Lottie/callout/zoomRange penuh.

## Alur lengkap dari UI (login, 2026-11-22)
Route: `/dashboard/projects`, `/dashboard/media`, `/editor/:project_id`, `/profile`.

**Dashboard**
- Projects: tab Live / Studio, filter, kartu project + badge Published.
- Media: Add Album, tab Pano/Asset, folder Root, Sort Media, "Drop 360 images here"
  atau **Upload 360**, tiap gambar punya **Edit with AI**. Peringatan rasio 2:1
  ("These images are not 2:1 panoramas" → Skip / Upload as flat photos).
- Tools menu — IN STUDIO: Static Hosting, Floorplan Generator, AI Edit 360.
  ON THE WEB: 360 Panorama Viewer, Optimizer, Nadir Fixer, Level 360 Panorama,
  Dual Fisheye → Equirectangular, 360 Photo Color Correction, 360 EXIF Fixer,
  360 Agency Directory, 360 Camera Comparison.
- Promotion, Enterprise; trial banner, Changelog, New Project.

**Onboarding editor (6 langkah, teks asli)**
1. **Add scenes** — klik Create untuk menambah 360 photos, flat images, atau Object 360 scenes.
2. **Add hotspots** — *hover + Hotspot, lalu drag hotspot ke panorama* untuk menghubungkan scene atau menampilkan info.
3. **Set the default view** — putar panorama ke sudut yang diinginkan, klik **Default view** untuk menyimpan sebagai tampilan awal & thumbnail.
4. **View options** — aktifkan **tour graph, minimap, atau side menu** untuk melihat koneksi antar scene.
5. **Preview** — lihat tur seperti yang dilihat pengunjung.
6. **Publish and share** — publish untuk mendapat **share link, QR code, dan embed code**.

**Hotspot picker** (klik + Hotspot): `Point, Chevron, Image, Article, Video, Sound, Link, Compact, Product`.

**View options** (`data-ai-id=tour.view.settings`): `Mini-map`, `Side menu`, `Tour graph`.

**Publish modal** — "Set who can view the tour, then copy the link or embed code":
- Who has access: **Draft / Public / Password access** (Anyone with the link)
- Tour Domain: **Copy Link, Open Link, QR Code, Change Slug**, Custom Domain / Connect Domain
- Cache: "The public tour is outdated / Updated … / Cached / Refresh Cache"
- Embed: **Allow Fullscreen, Allow VR, Loading lazy, Copy Code**
- Integrate: download base .zip → tempel ke `static/static/data.js` → upload ke hosting
- Export: berbayar, unlimited re-export

## Alur kerja editor Panoee (deep dive)
State Redux `tourEditor`: `editorMode:"tour"`, `tourViewerMode` (`classic`/`graph3d`,
tersimpan di localStorage `panoee:tour-viewer-mode`), `sceneSelected`,
`hotspotSelected`, `listHotspot`, `isDrawingHotspot`, `pendingHotspotUpdates`,
`idHotspotDeleted`.

Alur:
1. Pilih scene (`sceneSelected`) → `editors/GetListScene`.
2. Group scene: `editors/GetListGroup`, `createGroup`, `sortGroup`, `updateGroup`, `deleteGroup`.
3. Tambah hotspot: aktifkan mode gambar (`isDrawingHotspot`) → klik panorama →
   `eventToSpherical(clientX, clientY, rect)` mengubah klik menjadi `ath/atv`
   (yaw/pitch) → hotspot sementara ber-id `fake-…` masuk `pendingHotspotUpdates`
   → `hotspot/UpdateHotspot` → `replaceHotspotId(temp, real)`.
4. Edit hotspot: `hotspot/UpdateHotspot` (optimistic lewat `pendingHotspotUpdates`).
5. Hapus: `hotspot/DeleteHotspot` + `idHotspotDeleted`.
6. Scene: `scene/CreateScene(s)`, `UpdateScene`, `DeleteScene`, `SortScenes`.
7. Publish: `project/export`, `duplicate-project`, domain & `seo/reindex-url`.

Koordinat klik: `pointFromClient` → `{x,y,ath,atv}` dengan normalisasi
`(clientX-left)/width` dan `(clientY-top)/height` lalu `ath = x*360-180`,
`atv = y*180-90`.

### Diimplementasikan
- Tombol **+ Hotspot** sekarang masuk mode penempatan: klik di gambar untuk memilih
  posisi hotspot (bukan lagi ditaruh di tengah otomatis).
- Tombol hapus grup selalu terlihat; grup default hanya memberi info.

## Tidak diimplementasikan (alasan)
- krpano → tetap pakai Photo Sphere Viewer 5 (MIT, hasil setara).
- Pusher/PostHog/pembayaran/domain kustom/SEO — butuh infrastruktur berbayar &
  tidak relevan untuk portofolio pribadi untuk teman.
- AI Edit 360 — butuh model AI & pipeline gambar.

## Referensi internet
- krpano vtour docs & forum (scene groups, VR thumbnails, quality levels)
- Photo Sphere Viewer plugin docs
