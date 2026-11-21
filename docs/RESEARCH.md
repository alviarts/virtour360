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

## Tidak diimplementasikan (alasan)
- krpano → tetap pakai Photo Sphere Viewer 5 (MIT, hasil setara).
- Pusher/PostHog/pembayaran/domain kustom/SEO — butuh infrastruktur berbayar &
  tidak relevan untuk portofolio pribadi untuk teman.
- AI Edit 360 — butuh model AI & pipeline gambar.

## Referensi internet
- krpano vtour docs & forum (scene groups, VR thumbnails, quality levels)
- Photo Sphere Viewer plugin docs
