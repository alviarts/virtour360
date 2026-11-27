# 07. Upload, Publish, Embed & Export — Virtour360 (Replika Panoee)

> **Sumber:** `C:\Users\visual works\Documents\rea\virtour360`
> **Live:** https://virtour360real.vercel.app/#/p/1x2m270p3j
> **Benchmark:** `studio.panoee.net` / `panoee.com` (lihat `docs/RESEARCH.md`)
> **Metode:** baca source + verifikasi bundle produksi & endpoint publik lewat HTTP.
> **Catatan metode:** tool browser desktop tidak terhubung pada sesi riset ini
> (`[browser.disconnected]` saat `tabs.open`/`tabs.list`). Observasi live dilakukan dengan
> mengambil `index.html`, bundle `/assets/index-B1Wh7yo8.js`, dan
> `GET /api/public?id=1x2m270p3j` — bukan dengan klik UI. Tidak ada source yang diubah,
> tidak ada tour yang benar-benar dipublish saat riset.

---

## Ringkasan eksekutif

| Fitur | Status di kode | Keterangan singkat |
|---|---|---|
| Upload panorama (1 file, klik) | ✅ ada | `UploadModal.tsx` + IndexedDB / Storage Supabase |
| Drag & drop, multi-file | ❌ tidak ada | input `type="file"` biasa, tanpa `multiple`/`onDrop` |
| Validasi 2:1, ukuran, resolusi | ❌ tidak ada | hanya teks panduan; tanpa pengecekan programmatically |
| Progress bar, thumbnail asli, resize/optimasi | ❌ tidak ada | preview = `URL.createObjectURL(file)` penuh |
| Upload audio | ✅ ada | per-scene, Blob di IndexedDB (`accept="audio/*"`) |
| Upload video / flat image / aset 360 | ❌ tidak ada | hanya ikon hotspot "Video" |
| Publish link `/#/p/<uid>` | ✅ ada | butuh server mode Supabase agar benar-benar tersimpan |
| Opsi Draft / Public / Password | ⚠️ **cosmetic** | UI ada, tetapi tidak dipakai saat publish & tidak dicegat di API |
| Custom domain / ganti slug / Google Street View | ❌ tidak ada | — |
| QR code, copy link, copy iframe | ✅ ada | `qrcode` + Clipboard API |
| Embed (2 modal: portofolio & project) | ✅ ada | fixed `height=600`, `width=100%`, tanpa preview |
| Export / download ZIP / self-hosting | ❌ tidak ada | tidak ada string `zip`/`export`/`download` di bundle |
| Multi-resolution / image pyramid | ❌ tidak ada | "Kualitas" hanya mengubah batas zoom/minFov |
| Leveling (roll) & nadir | ✅ ada (viewer-level) | CSS filter + `sphereCorrection.roll`, bukan image bake |
| Dual fisheye → equirectangular | ❌ tidak ada | — |
| Cache/revalidation publik | ⚠️ `no-store` | tanpa ISR/CDN revalidate; setiap GET selalu ke Supabase |
| SEO per-tour / OG image | ❌ tidak ada | meta statis di `index.html` |

---

## 1. Upload panorama 360°

### 1.1 Entry point & alur UI

- Tombol **Create** dan **Studio** di header Public Home sama-sama membuka Studio jika sudah login,
  atau memunculkan modal auth jika belum: `src/views/PublicHomeView.tsx:121-135`.
  Studio sendiri digate oleh `LoginRequired`: `src/Root.tsx:28-43`.
- Di Studio, upload dibuka dari:
  - menu avatar → "Unggah panorama 360°": `src/App.tsx:258-271`,
  - sidebar kiri `onAddScene`/`onCreate`: `src/App.tsx:314-321`,
  - panel kanan tombol **Replace** → mode ganti gambar scene: `src/App.tsx:400`.
- Modal dirender global di `src/Root.tsx:56-57` (`<UploadModal />`), tetapi `submit` tetap
  memaksa login: `src/components/auth/UploadModal.tsx:47-52` (tutup modal → buka auth →
  toast "Masuk dulu untuk mengunggah panorama 360°."). Banner peringatan untuk publik:
  `UploadModal.tsx:96-105`.
- Alur submit: `UploadModal.tsx:45-72` → `addPanorama(name, file)` atau
  `replaceSceneImage(sceneId, file)` → tutup modal → toast.

### 1.2 Apa yang benar-benar ada

| Aspek | Implementasi | Referensi |
|---|---|---|
| Drag & drop | **Tidak ada.** Label bergaya drop-zone tetapi hanya wrapper `<label>`; tidak ada `onDragOver`/`onDrop`. Bundle produksi juga tidak mengandung `onDrop`/`onDragOver`. | `UploadModal.tsx:120-136` |
| Multi-file | **Tidak ada.** `e.target.files?.[0]` — satu file saja; atribut `multiple` tidak ada (diverifikasi juga di bundle). | `UploadModal.tsx:130-135` |
| Format didukung | Teks UI: **JPG / PNG / WebP** (`UploadModal.tsx:127`). Input sebenarnya `accept="image/*"` jadi browser menerima MIME gambar lain (GIF, AVIF, dll.) tanpa validasi aplikasi. | `UploadModal.tsx:127,132` |
| Batas ukuran/resolusi | **Tidak ada konstanta/validasi.** Hanya copy: "Gambar equirectangular rasio 2:1 (mis. 4096×2048)" (`UploadModal.tsx:85-89`). Tidak ada pengecekan rasio 2:1, dimensions, atau byte size. Pesan gagal menyarankan "file lebih kecil" (`UploadModal.tsx:67-69`), jadi batas praktis berasal dari browser/IndexedDB/Supabase, bukan dari kode. | `UploadModal.tsx:67-69,85-89` |
| Progress | **Tidak ada progress bar/percentage.** Hanya state `busy` dan label "Menyimpan…" (`busy ? "Menyimpan⬦"`). | `UploadModal.tsx:23,138-144` |
| Thumbnail | Preview `URL.createObjectURL(file)` dari file utuh, dipakai sebagai `<img>` pratinjau (`:26-34`, `:121-123`). Scene upload memakai **URL panorama yang sama** sebagai `thumbnail` (tidak ada thumbnail terpisah): `AppContext.tsx:875-892`. Tombol panel kanan "Capture thumbnail" juga hanya menyalin URL panorama aktif: `App.tsx:394-397`. | `UploadModal.tsx:26-34`; `AppContext.tsx:881-882`; `App.tsx:394-397` |
| Optimasi / resize | **Tidak ada.** Tidak ada `FileReader`, `createImageBitmap`, canvas downscale, atau library image processing di source maupun bundle. File asli disimpan apa adanya. | `db.ts:59-67`; verifikasi bundle |
| Nama scene | Field opsional; fallback ke nama file tanpa ekstensi. | `UploadModal.tsx:109-117`; `AppContext.tsx:549-556` |
| Daftar & hapus | Modal menampilkan "Panorama Anda (n)" dengan tombol trash per item, plus total scene. | `UploadModal.tsx:147-163` |

### 1.3 Penyimpanan (lokal vs cloud)

`addPanorama` (`src/context/AppContext.tsx:549-569`):

1. Buat `StoredPanorama` = `{ id: uid("pano"), name, blob: file, createdAt }`
   (`uid()` di `AppContext.tsx:200` menghasilkan `pano-<timestamp>-<random>`).
2. Jika `isRemote` (`isServerMode || supabase !== null`, `src/lib/supabase.ts:30-32`),
   coba `uploadPanoramaFile(id, file)`.
3. **Selalu** `savePanorama(item)` ke IndexedDB. Jika upload cloud gagal, hanya muncul toast
   "Upload cloud gagal — panorama tetap tersimpan di browser ini" (`AppContext.tsx:557-564`).
4. `setPanoramas([item, ...prev])`.

Detail storage:

- **IndexedDB**: database `virtour360`, version 2, store `panoramas` dan `assets`
  (`src/lib/db.ts:21-41`). Blob disimpan utuh; `blob:` URL dibuat/dicache lewat
  `objectUrl()` (`AppContext.tsx:214-222`) dan di-`revokeObjectURL` saat unmount (`:394-399`).
- **Supabase Storage (opsi klien)**: bucket publik `panoramas`, path `<id>.<ext>`,
  `upsert: true`, `contentType` dari file, lalu `getPublicUrl()`
  (`src/lib/remoteStore.ts:87-96`). RLS policy bucket di `supabase/schema.sql:39-53`
  sengaja permisif ("demo 2–5 orang").
- **Mode server** (`VITE_USE_SERVER_DB=1`): klien Supabase di browser **tidak dibuat**
  (hanya env `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` yang dibaca,
  `supabase.ts:3-27`), sehingga upload cloud tidak jalan. Metadata panorama juga sengaja
  **tidak disinkron** ke state server agar device lain tidak menampilkan gambar rusak
  (`AppContext.tsx:379-388`).lihat README `README.md:63-106`.
- **Penghapusan**: `removePanorama` (`AppContext.tsx:571-607`) menghapus file Storage
  (jika ada `url`), hapus IndexedDB, aset terkait scene, `blob:` URL, audio, media override,
  dan state React.

### 1.4 Mode "Ganti panorama scene"

Modal yang sama dipakai untuk mengganti gambar scene yang sudah ada
(`UploadModal.tsx:24,59-61,83-89`). `replaceSceneImage` (`AppContext.tsx:705-735`):

- menyimpan file sebagai `StoredAsset` dengan `kind: "image"` di IndexedDB,
- membuat `blob:` URL baru untuk `panorama` **dan** `thumbnail`,
- menghapus aset image lama scene itu,
- **tidak** meng-upload ke Supabase Storage (berbeda dengan `addPanorama`).

Jadi panorama hasil "Replace" bersifat lokal per-browser dan tidak ikut tersedia di device lain.

---

## 2. Upload gambar/media pendukung & manajemen aset

### 2.1 Audio

- Input global tersembunyi `accept="audio/*"` di `src/App.tsx:421-433`, dipicu dari
  toolbar viewer (`onUploadAudio`) dan panel kanan "Upload file .mp3"
  (`src/components/layout/RightPanel.tsx:222-235`).
- `setSceneAudio(sceneId, file)` (`AppContext.tsx:737-759`): hapus audio lama scene,
  simpan Blob sebagai `StoredAsset` `kind: "audio"` di IndexedDB, buat `blob:` URL,
  simpan di `audioByScene`. URL ini ditempel ke `Scene.audio` (`AppContext.tsx:899`).
- `removeSceneAudio` (`AppContext.tsx:761-775`) membersihkan aset, URL, dan state.
- **Batasan penting:** `PublicViewerModal` tidak membaca/memaparkan field `audio`
  (`src/components/viewer/PublicViewerModal.tsx:45-81`), jadi audio tersimpan & masuk payload
  publish tetapi **tidak diputar di halaman publik/embed**.

### 2.2 Gambar pengganti / media scene

- `MediaPickerModal` (`src/components/viewer/MediaPickerModal.tsx:1-69`): pilih scene lain
  untuk menyalin `panorama` + `thumbnail`-nya (`setMediaFromScene`, `AppContext.tsx:679-682`)
  atau tombol "Pulihkan asli" (`removeSceneMediaOverride`, `AppContext.tsx:684-703`).
- `captureThumbnail` (`AppContext.tsx:674-677`) hanya menyimpan URL sumber ke `mediaOverrides`;
  tidak ada frame capture dari orientasi kamera tertentu.

### 2.3 Video & manajemen aset

- **Tidak ada upload video.** Tidak ada input `accept="video/*"`. Yang ada hanyalah
  ikon hotspot "Video" di picker (`App.tsx:160-176`, `src/types/tour.ts:5`) dan opsi
  `<option value="video">` di editor hotspot (`RightPanel.tsx:464`) — itu tipe marker,
  bukan file media.
- Tidak ada "Media library"/album/folder seperti Panoee (`media/createFolder`).
  Yang ada hanya daftar panorama di modal upload dan aset implisit per-scene di IndexedDB.
- Aset (audio/image) **tidak** naik ke Supabase Storage; bucket hanya `panoramas`.

---

## 3. Publish

### 3.1 Alur klik

1. TopBar Studio memanggil `onPublish` → `setPublishOpen(true)` (`src/App.tsx:225-237`).
2. `PublishModal` dirender dengan `scenes`, `userName`, `userInitials`, `onPublished`
   (`src/App.tsx:437-449`).
3. Tombol "Publish sekarang" / "Publish ulang" memanggil `publish()`
   (`src/components/auth/PublishModal.tsx:44-67`):
   - susun `PublicProfile` dari user login + `data/profile.ts` sebagai fallback (`:46-53`),
   - `publishPublicPayload({ profile, scenes, folders: buildPublicFolders(scenes), creators: [], updatedAt })` (`:54-60`),
   - sukses → `setUid`, `onPublished(uid)` (simpan `localStorage["virtour360.publishedUid"]`,
     toast "Link, QR, dan embed siap dibagikan": `App.tsx:443-447`),
   - otomatis salin link ke clipboard (dibungkus `try/catch`, gagal diabaikan: `PublishModal.tsx:65`).

### 3.2 Opsi yang terlihat vs realita

| Opsi UI | Kode | Realita |
|---|---|---|
| Draft / Public / Password | state `Access`, 3 tombol, teks penjelas: `PublishModal.tsx:21,24,91-124` | **Tidak dikirim ke publish payload** (`:54-60`). Tidak ada pengecekan `access` atau `password` di `publishPublicPayload`, `/api/public`, maupun publik viewer. Semua tour yang dipublish selalu bisa diakses siapa pun dengan link. |
| Field password | `PublishModal.tsx:113-121` | Hanya tersimpan di state lokal modal; tidak dipakai. |
| Custom domain / Change slug / Google Street View | — | Tidak ada. |
| Status project | badge "Published" di Dashboard (`src/views/DashboardView.tsx:54,84`) | Statis, bukan status hasil publish per-UID. Tidak ada endpoint status/refresh cache. |

Setiap klik "Publish" membuat **UID baru** (`publishPublicPayload` dipanggil tanpa argumen
uid; `publicStore.ts:125-130`), jadi label "Publish ulang" sebenarnya menghasilkan project
baru; project lama tetap ada di database sebagai baris `virtour:pub:<uid>` yang ter-orphan.
Hanya UID terakhir yang disimpan di `localStorage`.

### 3.3 URL, copy link, QR

- `makePublicUid()`: 6 byte acak `crypto.getRandomValues`, base36 `padStart(2,"0")`,
  dipotong 10 karakter → contoh live `1x2m270p3j` (`src/lib/publicStore.ts:63-68`).
- `publicShareUrl(uid)` = `${location.origin}/#/p/<uid>`
  (`publicStore.ts:70-74`). Hash dibaca oleh `publicUidFromHash()` (`:76-80`) dan
  diarahkan ke portfolio oleh `currentView()` (`src/lib/navigation.ts:3-9`: `p/` → `portfolio`).
- Link tampil di input read-only, tombol **Copy**, dan tombol **buka tab baru**:
  `PublishModal.tsx:134-146`.
- QR: `QRCode.toDataURL(shareUrl, { width:180, margin:1, dark:"#09090b", light:"#ffffff" })`
  (`PublishModal.tsx:37-42`) ditampilkan 96×96 px (`:148-154`).
- Menu Studio "Salin link publish" menggunakan UID terakhir di localStorage
  (`App.tsx:281-292`).

### 3.4 Kode embed di modal Publish

`PublishModal.tsx:35`:

```html
<iframe src="https://…/#/p/<uid>" width="100%" height="600" frameborder="0"
        allowfullscreen allow="vr" loading="lazy" title="Virtour360 Virtual Tour"></iframe>
```

Opsi checkbox `Allow Fullscreen`, `Allow VR`, `Loading lazy` (`PublishModal.tsx:30-32,157-163`)
hanya menambah/menghapus atribut; default semua **aktif**. Tidak ada pengaturan tinggi,
lebar, radius, warna, atau responsive breakpoint. Preview iframe **tidak ada** — kode
hanya ditampilkan dalam `<pre>` dan tombol "Copy Code" (`:164-167`).

---

## 4. Embed

Ada **dua** generator embed yang berbeda:

| | `EmbedModal.tsx` (Studio → menu akun) | `PublishModal.tsx` (setelah publish) |
|---|---|---|
| Sumber | `src/components/auth/EmbedModal.tsx:4-8` | `src/components/auth/PublishModal.tsx:35` |
| URL | `${origin}/#/portfolio` (portofolio umum, **bukan project yang dipublish**) | `${origin}/#/p/<uid>` (project spesifik) |
| Atribut | `width="100%" height="600" frameborder="0" allow="fullscreen; gyroscope; accelerometer"` | `width="100%" height="600" frameborder="0"` + opsional `allowfullscreen`, `allow="vr"`, `loading="lazy"` |
| Opsi | tidak ada | 3 checkbox |
| Preview | tidak ada | tidak ada |
| Copy | satu tombol "Salin kode" + feedback "Tersalin" (`:10-18,30-33`) | tombol "Copy Code" + feedback (`:69-73,165-167`) |

Catatan:

- `EmbedModal` memakai `window.location.origin` statis saat modul dimuat; BASE kosong pada SSR,
  tetapi aplikasi adalah SPA Vite murni sehingga tidak adaSSR issue nyata.
- `vercel.json` tidak menetapkan `X-Frame-Options`/CSP frame-ancestors, jadi iframe ke host lain
  secara teknis diizinkan (tidak ada header pemblokir).
- Keduanya tidak punya fallback copy (mis. `document.execCommand`) — jika Clipboard API ditolak,
  status "Tersalin" tidak muncul di `EmbedModal` (`EmbedModal.tsx:10-18`); di `PublishModal`
  status masih berubah walaupun copy gagal (`PublishModal.tsx:69-73`).
- Responsivitas hanya berasal dari `width="100%"`; tinggi tetap 600 px (tidak ada opsi
  `aspect-ratio`/auto-resize/postMessage).

---

## 5. Export / self-hosting / download ZIP

**Tidak ada.** Bukti:

- Tidak ada tombol, state, atau handler export di source. `project/export` hanya disebut sebagai
  milik Panoee di `docs/RESEARCH.md:23,114-115,133`.
- Bundle produksi tidak mengandung string `Download`, `download`, `.zip`, `Export`, atau `export`
  (hasil pencarian string pada `/assets/index-B1Wh7yo8.js`: 0 kecocokan).
- Tidak ada endpoint `/api/export`, tidak ada generator `data.js` statis, tidak ada scaffolding
  hosting mandiri.
- `vercel.json:1-15` hanya mengatur framework Vite, SPA rewrite `/(.*) → /index.html`, dan
  header cache untuk `/media/(.*)` (`public, max-age=31536000, immutable`); ini bukan export.

Jadi satu-satunya cara "menyalin" tour keluar aplikasi adalah menyalin kode iframe — tetap
bergantung pada deployment Virtour360 ini.

---

## 6. Multi-resolution, optimasi, nadir fix, leveling, dual fisheye

### 6.1 Kualitas gambar (bukan multi-resolution)

- `src/hooks/useTourViewer.ts:16-22` mendefinisikan `Quality = "hemat"|"standar"|"tinggi"`
  dengan `{ minFov: 65/30/15, zoom: 45/70/100 }`. UI-nya ada di `SettingsPopover`
  (`src/App.tsx:54-71`) dengan tooltip "mengubah zoom & batas detail".
  **Efeknya hanya batas zoom/minFov viewer**, bukan pyramid tile, bukan multi-resolusi,
  bukan encode ulang gambar.
- `imageQuality: "standard"|"high"|"original"` di `AppContext.tsx:101-102,245-251`
  (tersimpan di `localStorage` + ikut remote state `remoteStore.ts:30,43`) **tidak dipakai**
  oleh `addPanorama` maupun pipeline apa pun — tidak ada resize/quality selection saat upload.
- `tourConfig` (`src/config/tour.config.ts:1-12`) mengatur `defaultZoom:70`, `minFov:30`,
  `maxFov:100`, `transitionSpeed:"18rpm"`, `renderMode:"3d"`. Catatan: viewer publik memakai
  `renderMode:"2d"` dan transisi `"16rpm"` (`PublicViewerModal.tsx:47-74`), jadi konfigurasi
  Studio tidak sepenuhnya dipakai di publik.

### 6.2 Leveling, nadir, koreksi warna

- `src/lib/effects.ts:1-48` mendefinisikan `SceneEffects`:
  `roll, brightness, contrast, saturate, hue, grayscale, sepia, nadir` + preset
  `natural/warm/cool/dusk/mono`.
- Panel kanan: **Levelling** slider roll −20°…20° + tombol "Level this scene"
  (`RightPanel.tsx:238-245`), **Nadir** checkbox "Tampilkan penutup nadir"
  (`:248-253`), **Quick Fix** (`:255-266`), **Custom Fix** (`:268-274`),
  **Day To Dusk** (`:276-279`).
- Penerapan:
  - warna → CSS `filter` pada `.psv-canvas-container`
    (`effects.ts:29-40`, `useTourViewer.ts:427-437`);
  - roll → `viewer.setOption("sphereCorrection", { roll })` (`useTourViewer.ts:432-436`);
  - nadir → prop `showNadir` ke `TourViewer` (`App.tsx:364`) berupa penutup/badge UI.
- Ini **koreksi real-time di viewer**, bukan image processing: file panorama tidak diubah,
  efek disimpan sebagai metadata (`virtour360.effects`, `AppContext.tsx:789-804`).
  Lihat juga `docs/VALIDATION.md:75,86-89`.
- **Dual fisheye → equirectangular: tidak ada.** Tidak ada konversi proyeksi, tidak ada
  tool `media/leveling/estimate` seperti Panoee (`docs/RESEARCH.md:28`).

### 6.3 Scripts

Ketiga script di `scripts/` adalah **patch data Supabase**, bukan pipeline gambar:

- `scripts/seed-supabase.mjs:42-94,134-173` — 5 user dummy + payload `virtour:public`
  berisi panorama demo Pannellum.
- `scripts/update-creator-images.mjs:13-35` — rewrite URL gambar kreator ke `/media/...`.
- `scripts/update-public-images.mjs:13-24` — string-replace nama file di payload.
- `scripts/restore-creators.mjs:13-35` — mengembalikan array `creators` jika kosong.

Tidak ada script resize, tiling, EXIF fix, nadir patch, atau dual-fisheye stitch.

---

## 7. Public store: publish, pengambilan, cache

### 7.1 Penulisan

`publishPublicPayload` (`src/lib/publicStore.ts:122-150`):

- Jika `!isServerMode` (default tanpa env) → **`{ ok:false, uid }`**. Artinya tombol Publish
  tidak menyimpan apa pun ke server; modal tetap menampilkan UID/link/QR/embed seolah sukses.
- Jika server mode:
  1. `loadPublicPayload()` untuk mengambil `creators` lama (`:132`),
  2. `POST /api/public` dengan `{ uid, payload: { ...payload, uid, creators: lama, folders: buildPublicFolders(scenes) } }` (`:133-145`).
- `buildPublicFolders` (`publicStore.ts:82-105`) mengelompokkan scene berdasarkan
  `scene.project.title || scene.group || "Lainnya"` → slug; tiap folder berisi
  `id: folder-<slug>`, `name`, `description`, `cover: first.thumbnail`, `sceneIds`, `tags`, `year`.

`api/public.js`:

- `PUBLIC_ID = "virtour:public"`, `projectId(uid) = "virtour:pub:<uid>"`
  dengan sanitasi `[^a-zA-Z0-9-_]`, max 40 char (`:3-10`).
- POST (`:43-55`) upsert ke tabel `virtour_state` dengan `data: { payload, updated_at }`.
- Kredensial Supabase (`SUPABASE_URL` + `SUPABASE_SECRET_KEY`/`SERVICE_ROLE_KEY`) hanya di
  serverless function (`:20-28`) — tidak pernah di bundle browser.
- `Cache-Control: no-store` (`:18`).

### 7.2 Pembacaan oleh halaman publik

- `loadPublicPayload(uid)` (`publicStore.ts:107-120`) → `GET /api/public?id=<uid>` dengan
  `cache: "no-store"`, fallback `folders` jika payload belum punya.
- `PublicPortfolioView` memanggilnya sekali saat mount dengan `publicUidFromHash()`
  (`src/views/PublicPortfolioView.tsx:276-299`); kalau gagal → fallback ke scene lokal
  (`:301-305`). `uploaded = scenes.filter(id.startsWith("pano-"))` (`:306`) — konsisten
  dengan prefix UID `addPanorama`.
- Link `#/p/<uid>` menampilkan **portofolio per project**, bukan profil user:
  `displayName` diambil dari `folders[0].name` / `scenes[0].project.title`
  (`PublicPortfolioView.tsx:327-339`).
- Viewer publik: `PublicViewerModal` (`src/components/viewer/PublicViewerModal.tsx:26-121`)
  membuat `Viewer` + `VirtualTourPlugin` (`dataMode:"client"`, `renderMode:"2d"`),
  node dari `scene.panorama`/`thumbnail`, link dari hotspot `type:"scene"`, marker HTML dari
  hotspot lain. Tidak ada audio, tidak ada filter efek, tidak ada nadir.

### 7.3 Cache / revalidation

- Tidak ada ISR, tidak ada tag revalidation, tidak ada ETag handler.
- SPA rewrite di `vercel.json:6` membuat semua path dilayani `index.html`; data selalu
  di-fetch klien dengan `no-store`.
- Satu-satunya header cache adalah aset statis `/media/*` → immutable 1 tahun
  (`vercel.json:7-14`). Konsekuensi: mengganti file panorama dengan nama sama berisiko
  tersimpan lama di browser/CDN.

### 7.4 Observasi live (HTTP fallback)

`GET https://virtour360real.vercel.app/api/public?id=1x2m270p3j` → HTTP 200 dengan:

- `uid: "1x2m270p3j"`,
- 3 scene: `atrium`, `studio`, `terrace` (panorama & thumbnail relatif `/media/...`),
- `folders`: 3 folder (`folder-the-gallery`, `folder-creative-room`, `folder-sunset-terrace`),
- `profile.name: "awe"`, `email: hello@ardhana.studio`,
- `creators`: 5 entri hasil seed,
- `updatedAt: "2026-11-22T13:46:19.311Z"`.

Ini membuktikan server mode aktif di produksi dan skema `virtour:pub:<uid>` terpakai.
Bundle produksi juga mengandung string UI "Publish & bagikan", "Who has access",
"Embed portofolio", "QR Code", "Allow Fullscreen", "Copy Code", "Create", "Studio" —
sesuai source. Tidak ditemukan string `download`, `.zip`, `Export`, `og:image`,
`Custom Domain`, `Street View`, `multiple`, `onDrop`, `FileReader`.

---

## 8. SEO metadata, share link, social preview

- `index.html:1-15` (state statis, diverifikasi identik di live):
  - `<html lang="id">`, `theme-color #09090b`,
  - `<meta name="description" content="Virtour360° Virtual Tour — karya pilihan dalam pengalaman panoramik interaktif.">`,
  - `<title>Virtour360 — Studio Virtual Tour</title>`,
  - favicon `/favicon.svg`.
- **Tidak ada** `og:title`, `og:description`, `og:image`, `twitter:card`, canonical, JSON-LD,
  `robots.txt`, atau `sitemap.xml`. Tidak ada perubahan `document.title` per route/project.
- Routing berbasis hash (`#/p/<uid>`, `#/portfolio`, `#/studio`) — fragmen hash tidak dikirim
  ke server, sehingga tiap tour tidak punya URL HTTP yang dapat diindeks/ di-share dengan
  preview berbeda.
- "Share link" hanya berarti: salin URL ke clipboard + QR code lokal (`qrcode`,
  `PublishModal.tsx:37-42,65,140-145`). Tidak ada Web Share API, tidak ada email/WhatsApp
  deep link, tidak ada social preview image generator.
- Portfolio card `<img>` memakai `alt` dari judul (`PublicPortfolioView.tsx:175`), tapi itu
  accessibility, bukan SEO metadata.

---

## 9. Batasan dibanding Panoee asli

Sumber perbandingan: `docs/RESEARCH.md:83-148`, `docs/VALIDATION.md:75-94`.

| Kemampuan Panoee | Virtour360 |
|---|---|
| krpano 1.21.2 (2D/3D, VR, transisi kaya) | Photo Sphere Viewer 5 (`useTourViewer.ts:2-8`); VR/gyro lewat plugin, render `3d` di Studio vs `2d` di publik |
| Media library: folder, multi-file drop, 2:1 validation, "Upload 360" vs flat photo, Object 360 | Single-file click upload, tanpa validasi/folder/flat/object |
| S3 + quality Standard/High/Original (benar-benar varian file) | Supabase Storage `panoramas` (opsional) atau IndexedDB; "quality" hanya zoom/minFov |
| Tools: Optimizer, Nadir Fixer, Level 360, Dual Fisheye→Equirectangular, Color Correction, EXIF Fixer, AI Edit, Floorplan, Static Hosting | Hanya viewer-level roll + CSS filter + nadir badge; tidak ada bake/convert/AI |
| Publish: Draft/Public/Password (nyata), Change Slug, Custom Domain/Connect Domain, cache status + Refresh Cache, `seo/reindex-url` | UI Draft/Public/Password kosmetik; UID acak 10 char; `no-store`; tanpa slug/domain/SEO reindex |
| Integrate: download base `.zip` → `static/static/data.js` → upload hosting; Export berbayar | Tidak ada |
| Analytics (PostHog), realtime (Pusher), subscription/payment, multi-user tim | Tidak ada (portofolio pribadi, lihat `docs/VALIDATION.md:79-81`) |
| Embed widget `panoee.com/embed/widget.js` dengan opsi lanjutan | Dua generator iframe statis (`height=600`), tanpa preview/responsive API |

### Batasan teknis yang perlu dicatat

1. **Publish tanpa server mode = tidak tersimpan.** Default env kosong → `publishPublicPayload`
   mengembalikan `ok:false`, tetapi UI tetap menampilkan link/QR/embed
   (`publicStore.ts:130`, `PublishModal.tsx:62-66`).
2. **Draft/Password tidak mengamankan tour.** Tidak ada pengecekan akses di `/api/public`
   maupun viewer; policy RLS `virtour_state` juga `using(true)` (`supabase/schema.sql:28-37`).
3. **Publish berulang membuat project baru** (UID baru setiap klik), bukan memperbarui project
   yang sama (`publicStore.ts:125-130`).
4. **File upload tidak tervalidasi & tidak dioptimasi** → panorama besar 20–50 MB bisa
   memenuhi IndexedDB/Storage; tidak ada progress indicator.
5. **Media lintas device belum lengkap:** mode server tidak menyinkron metadata panorama,
   aset audio/image hasil "Replace" juga lokal saja (`AppContext.tsx:379-388`, `:705-759`).
6. **Audio tidak terdengar di publik/embed** (`PublicViewerModal.tsx:45-81`).
7. **Efek (roll/warna/nadir) tidak ikut ke publik** — `publish()` mengirim `scenes` apa adanya,
   tanpa `effectsByScene`; `PublicViewerModal` juga tidak menerapkan `effectsToCss`.
8. **Hash-change ke UID lain tanpa reload tidak memuat ulang payload** — listener hash di
   `PublicPortfolioView.tsx:270-274` hanya memperbarui `creatorId`.
9. **Tidak ada SEO/social preview** karena SPA hash + meta statis.

---

## Lampiran: referensi file utama

| File | Peran |
|---|---|
| `src/components/auth/UploadModal.tsx` | UI upload panorama + replace scene |
| `src/context/AppContext.tsx` | `addPanorama`, `removePanorama`, `replaceSceneImage`, audio, media override, scene assembly |
| `src/lib/db.ts` | IndexedDB (`panoramas`, `assets`) |
| `src/lib/remoteStore.ts` | Supabase Storage upload/remove + state remote |
| `src/lib/supabase.ts` | mode klien vs server, guard secret key |
| `src/components/auth/PublishModal.tsx` | publish, access UI, QR, share link, embed code |
| `src/components/auth/EmbedModal.tsx` | embed portofolio generik |
| `src/lib/publicStore.ts` | UID, URL, folders, publish/load publik |
| `api/public.js`, `api/state.js` | serverless endpoints (Supabase secret di server) |
| `src/views/PublicPortfolioView.tsx` | konsumsi payload publik & buka viewer |
| `src/components/viewer/PublicViewerModal.tsx` | viewer 360° publik |
| `src/lib/effects.ts`, `src/hooks/useTourViewer.ts`, `src/config/tour.config.ts` | efek, kualitas, konfigurasi viewer |
| `src/components/layout/RightPanel.tsx` | UI Leveling/Nadir/Quick Fix/Custom Fix/audio |
| `supabase/schema.sql`, `scripts/*.mjs` | skema DB & patch data (bukan image pipeline) |
| `vercel.json`, `index.html` | rewrite/cache header & meta statis |
| `docs/RESEARCH.md`, `docs/VALIDATION.md`, `README.md` | benchmark Panoee, batasan, panduan deploy |
