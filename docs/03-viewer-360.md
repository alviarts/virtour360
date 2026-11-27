# 03 — Viewer 360° & Kontrolnya (Virtour360 / replika Panoee)

> **Status dokumen:** Audit source lengkap + verifikasi live via HTTP.  
> **Source:** `C:\Users\visual works\Documents\rea\virtour360`  
> **Live yang diaudit:** `https://virtour360real.vercel.app/#/p/1x2m270p3j`  
> **Tanggal audit:** 2026-11-23  
> **Metode:** Membaca seluruh file yang tercantum di brief (`TourViewer.tsx`, `PublicViewerModal.tsx`, `BottomToolbar.tsx`, `MiniMap.tsx`, `MediaPickerModal.tsx`, `useTourViewer.ts`, `useHotkeys.ts`, `useFullscreen.ts`, `sceneGraph.ts`, `effects.ts`, `psv-overrides.css`, `theme.css`, `tour.config.ts`, `types/tour.ts`) **plus** file pendukung (`App.tsx`, `RightPanel.tsx`, `context/AppContext.tsx`, `data/scenes.ts`, `lib/format.ts`, `lib/publicStore.ts`, `lib/navigation.ts`, `Root.tsx`, `PublishModal.tsx`, `Lightbox.tsx`, `package.json`, `README.md`, `docs/PLAN.md`, `docs/RESEARCH.md`). Live diverifikasi dengan `GET /api/public?id=1x2m270p3j` dan fetch HTML halaman.  
> ⚠️ **Limitasi verifikasi interaktif:** tool browser desktop tidak terhubung ke sesi ini (`[browser.disconnected]`, sudah dicoba 3× sesuai instruksi skill). Jadi **tidak ada klik sungguhan** di browser. Kolom "Verifikasi" di bawah membedakan: ✅ = terbukti dari kode + data live, 🧪 = hanya dari kode (perlu klik manual untuk konfirmasi visual). Tidak ada source code yang diubah.

---

## Ringkasan eksekutif

| Aspek | Fakta |
|---|---|
| Engine | **Photo Sphere Viewer 5** (`@photo-sphere-viewer/core@^5.15.1`), renderer three.js — **bukan krpano** (Panoee asli memakai krpano 1.21.2, lihat `docs/RESEARCH.md:11,145`). |
| Plugin aktif | `MarkersPlugin`, `VirtualTourPlugin`, `AutorotatePlugin`, `CompassPlugin`, `GyroscopePlugin`, `SettingsPlugin` (`useTourViewer.ts:2-8,126-146`). |
| Dua mode viewer | **Studio** (editor, `useTourViewer` + `TourViewer`) dan **Public modal** (`PublicViewerModal`) — dua inisialisasi `Viewer` terpisah dengan konfigurasi berbeda. |
| Kontrol dasar | Drag, wheel, pinch/two-finger, toolbar zoom ±, Default view, Fullscreen, autorotate, hotkey `← → R + - F`. |
| Hotspot | 4 tipe data (`info`, `project`, `link`, `scene`), 9 ikon, 7 bentuk, 7 efek, 9 label picker ala Panoee. **Tidak ada** video/audio/image/e-commerce/lead-form/polygon sebagai tipe data nyata. |
| Navigasi scene | Panah 3D (`renderMode: "3d"`) dari `VirtualTourPlugin`, sidebar, mini-map, tour graph, kotak prev/next, transisi fade + rotasi. |
| Efek | Leveling (roll), nadir badge, brightness/contrast/saturate/hue/grayscale/sepia via CSS filter. **Little planet, green screen, multi-resolusi tidak ada.** |
| VR | Tidak ada tombol VR/stereo. Gyroskop ada (plugin + checkbox). "Allow VR" di modal publish hanya memengaruhi string embed. |

---

## 1. Engine viewer, inisialisasi & konfigurasi

### 1.1 Stack

`package.json:15-27` — dependency yang relevan:

```json
"@photo-sphere-viewer/core": "^5.15.1",
"@photo-sphere-viewer/virtual-tour-plugin": "^5.15.1",
"@photo-sphere-viewer/markers-plugin": "^5.15.1",
"@photo-sphere-viewer/autorotate-plugin": "^5.15.1",
"@photo-sphere-viewer/compass-plugin": "^5.15.1",
"@photo-sphere-viewer/gyroscope-plugin": "^5.15.1",
"@photo-sphere-viewer/settings-plugin": "^5.15.1"
```

Tidak ada `gallery-plugin`, `video-plugin`, `multires-plugin`, `stereo/VR plugin`, atau `krpano`. `docs/PLAN.md:45-53` menyebut gallery/video sebagai **rencana**, bukan implementasi. ✅ (terbukti dari package.json).

### 1.2 Konfigurasi pusat — `src/config/tour.config.ts:1-12`

| Field | Nilai | Arti / pemakaian |
|---|---|---|
| `defaultZoom` | `70` | `defaultZoomLvl` pada kedua `new Viewer()` (`useTourViewer.ts:150`, `PublicViewerModal.ts:36,78`). Skala PSV 0–100. |
| `minFov` | `30°` | Batas zoom paling dekat (`useTourViewer.ts:148`, `PublicViewerModal.ts:34,76`). |
| `maxFov` | `100°` | Batas zoom paling jauh (`useTourViewer.ts:149`, `PublicViewerModal.ts:35,77`). |
| `transitionSpeed` | `"18rpm"` | Kecepatan transisi antar scene **studio** (`useTourViewer.ts:136`). |
| `renderMode` | `"3d"` | Panah navigasi 3D di panorama (`useTourViewer.ts:131`). |
| `loadingLabel` | `"Menyiapkan panorama…"` | ⚠️ **Dead config**: didefinisikan tapi tidak pernah dilewatkan ke opsi `Viewer`. Loader yang terlihat berasal dari CSS `.psv-loader` + overlay React buatan (`App.tsx:406-413`). |

### 1.3 Inisialisasi Studio — `useTourViewer.ts:121-237`

`useEffect` dengan dependency `[]` → viewer dibuat **sekali** saat mount, lalu di-`destroy()` saat unmount (`useTourViewer.ts:222-235`). Data terbaru dibaca lewat ref `live.current` (`useTourViewer.ts:117-119`) agar handler tidak perlu di-rebind.

```ts
const viewer = new Viewer({
  container: containerRef.current,
  plugins: [
    MarkersPlugin.withConfig({}),
    VirtualTourPlugin.withConfig({
      dataMode: "client",
      positionMode: "manual",
      renderMode: tourConfig.renderMode,           // "3d"
      nodes: buildNodes(live.current.scenes),
      startNodeId: live.current.currentSceneId,
      transitionOptions: {
        showLoader: true,
        speed: tourConfig.transitionSpeed,          // "18rpm"
        effect: "fade",
        rotation: true,
      },
      showLinkTooltip: true,
    }),
    AutorotatePlugin.withConfig({ autorotatePitch: "5deg", autorotateSpeed: "2rpm" }),
    CompassPlugin.withConfig({ size: "48px" }),
    GyroscopePlugin.withConfig({}),
    SettingsPlugin.withConfig({}),
  ],
  navbar: false,              // navbar bawaan PSV DIMATIKAN
  minFov: 30, maxFov: 100, defaultZoomLvl: 70,
  touchmoveTwoFingers: true,
  mousewheelCtrlKey: false,
  caption: scenes[0].name,
})
```

**Konsekuensi `navbar: false`:** tidak ada tombol zoom/fullscreen/VR/settings bawaan PSV. Semua kontrol UI dibuat sendiri di React (`BottomToolbar`, `SettingsPopover`). Plugin `SettingsPlugin` tetap di-instantiate tetapi **tidak punya tombol pembuka** → efektif tidak terpakai (🧪).

**Event yang dipasang** (`useTourViewer.ts:216-220`):

| Event | Fungsi | Baris |
|---|---|---|
| `ready` | `setIsReady(true)` + `viewer.rotate()` ke `initialView` scene awal | 169-173 |
| `node-changed` | Update `currentSceneId`, clear selected hotspot, panggil `onSceneChange` | 174-179 |
| `select-marker` (markers) | Scene → `setCurrentNode`; link → `window.open`; lain → `setSelectedHotspot` | 180-194 |
| `position-updated` | Update state `{yaw,pitch,zoom}` (rad → deg, dibulatkan) untuk HUD/mini-map | 195-201 |
| `click` (viewer) | Menaruh hotspot saat mode placement aktif | 202-214 |

> ⚠️ **Nuansa penting:** `initialView.yaw/pitch` hanya diterapkan sekali saat event `ready` awal. Saat pindah scene lewat panah/sidebar/mini-map, **tidak ada** `rotate()` ke `initialView` scene tujuan. Tombol `R` / `Default view` yang akan mengarahkan ulang (`useTourViewer.ts:499-503`). ✅ dari kode.

### 1.4 Inisialisasi Public viewer — `PublicViewerModal.tsx:26-121`

Dua cabang:

**A. Tanpa `scenes` (single panorama)** — `PublicViewerModal.tsx:29-41`
```ts
new Viewer({ container, panorama, navbar:false, minFov:30, maxFov:100,
             defaultZoomLvl:70, mousewheelCtrlKey:false, touchmoveTwoFingers:true })
```
Cocok untuk kartu demo/kreator yang tidak punya `sceneId` (`PublicPortfolioView.tsx:557`). Hasilnya: **hanya drag + wheel**, tanpa hotspot, tanpa panah, tanpa info scene.

**B. Dengan `scenes` (tur multi-scene)** — `PublicViewerModal.tsx:45-81`
- Plugin: `MarkersPlugin` + `VirtualTourPlugin.withConfig({...})`
- `dataMode: "client"`, `renderMode: "2d"` (**bedanya dengan studio yang 3d**), `positionMode` tidak diset (default plugin).
- `nodes` dibangun inline dari `scenes`:
  - `links` = hotspot `type === "scene"` → `{ nodeId, position:{yaw,pitch} }` (baris 55-57)
  - `markers` = semua hotspot **`type !== "scene"`** → HTML `.hs-marker` dengan warna, efek, bentuk, label, tooltip judul (baris 58-70)
- `startNodeId` = `sceneId` bila valid, else `scenes[0].id` (baris 72)
- Transisi: `{ speed: "16rpm", effect: "fade", rotation: true }` (baris 73) — **tanpa `showLoader`**.
- Event: `node-changed` → judul & counter; `select-marker` → coba `setCurrentNode(targetSceneId)`; fallback klik langsung pada `[data-hs-id]` (baris 85-112).

> ⚠️ Karena hotspot `scene` **difilter keluar dari markers**, `data.targetSceneId` pada marker konten selalu `null`. Maka handler `select-marker` dan fallback klik di public viewer **praktis tidak pernah berpindah scene** — navigasi publik terjadi lewat panah `VirtualTourPlugin` dan tombol prev/next. Juga **tidak ada handler `link` → `window.open`** di public viewer (berbeda dengan studio). 🧪/✅ dari kode.

### 1.5 Panorama equirectangular

- Data scene memakai field `panorama` dan `thumbnail` berupa path statis (`data/scenes.ts:3-14`: `/media/panoramas/*.jpg`, `/media/thumbnails/*.jpg`).
- Panduan aset: `docs/ASSETS.md:4` — "Photo Sphere Viewer membaca **equirectangular** rasio **2:1**". `README.md:121-127` mencantumkan contoh panorama Pannellum.
- Upload meminta gambar equirectangular 2:1 (mis. 4096×2048) — `components/auth/UploadModal.tsx:88`.
- Tidak ada konversi/validasi rasio di sisi viewer; PSV menerima URL apa adanya.

---

## 2. Daftar lengkap kontrol & hotkey

### 2.1 Mouse / touch / wheel (dari PSV + opsi viewer)

| Input | Perilaku | Referensi | Status |
|---|---|---|---|
| Drag kiri pada panorama | Putar pandangan (yaw/pitch) | PSV core; `navbar:false` tidak memengaruhi | ✅ |
| Scroll wheel | Zoom langsung, **tanpa perlu Ctrl** (`mousewheelCtrlKey:false`) | `useTourViewer.ts:152`, `PublicViewerModal.ts:37,79` | ✅ |
| Drag dengan klik kanan | PSV default (tidak dipakai khusus); diproteksi saat placement (`data.rightclick` diabaikan) | `useTourViewer.ts:209` | ✅ |
| Touch: dua jari | `touchmoveTwoFingers:true` → gerak/zoom memakai dua jari (satu jari bebas untuk scroll halaman di mode publik) | `useTourViewer.ts:151`, `PublicViewerModal.ts:38,80` | 🧪 |
| Klik panah kuning 3D | Pindah scene (studio `renderMode:"3d"`, publik `"2d"`) | `tour.config.ts:9`, `PublicViewerModal.ts:49` | ✅ |
| Klik marker | Studio: pilih hotspot / pindah scene / buka link. Publik: hanya tooltip judul (lihat catatan §1.4) | `useTourViewer.ts:180-194` | 🧪 |
| Drag marker (studio) | Geser posisi hotspot; marker bergerak langsung via `updateMarker`, tersimpan saat pointer-up | `useTourViewer.ts:315-407` | ✅ |
| Klik panorama saat placement | Menaruh hotspot baru di yaw/pitch kursor; HUD reticle menampilkan koordinat live | `useTourViewer.ts:239-313` | ✅ |

### 2.2 Hotkey — `src/hooks/useHotkeys.ts:12-44` (daftar lengkap)

| Tombol | Handler | Aksi di Studio (dari `App.tsx:186-193`) | Status |
|---|---|---|---|
| `ArrowLeft` | `onPrev` | `goRelative(-1)` → scene sebelumnya (wrap-around) | ✅ |
| `ArrowRight` | `onNext` | `goRelative(1)` → scene berikutnya (wrap-around) | ✅ |
| `r` / `R` | `onReset` | `tour.resetView()` → yaw/pitch/zoom sesuai `initialView` scene aktif | ✅ |
| `+` / `=` | `onZoomIn` | `tour.zoomBy(6)` | ✅ |
| `-` | `onZoomOut` | `tour.zoomBy(-6)` | ✅ |
| `f` / `F` | `onFullscreen` | `toggleFullscreen()` pada `shellRef` (seluruh AppShell) | ✅ |

**Tidak ada hotkey untuk:** Escape (kecuali di modal publik & Lightbox), autorotate, kompas, gyroskop, tambah hotspot, minimap, side menu, graph, VR.

Catatan implementasi (`useHotkeys.ts:14-17`): hotkey diabaikan bila fokus ada di `INPUT`, `TEXTAREA`, atau `SELECT` — jadi mengetik di panel inspector tidak memicu pindah scene. `window.addEventListener("keydown", onKey)` dipasang ulang tiap render karena dependency `[handlers]` dan objek handler dibuat inline di `App.tsx:186-193` (tidak di-`useMemo`) — perilaku masih benar, hanya tidak optimal. ✅

**Hotkey khusus Public modal** (`PublicViewerModal.tsx:132-140`, `useEffect` **tanpa dependency array** → re-register tiap render):

| Tombol | Aksi |
|---|---|
| `Escape` | `onClose()` |
| `ArrowLeft` | `go(-1)` → scene sebelumnya (wrap-around) |
| `ArrowRight` | `go(1)` → scene berikutnya (wrap-around) |

Tidak ada `R/F/+/-` di public viewer.

### 2.3 Bottom toolbar (studio) — `BottomToolbar.tsx:36-123`

Tombol dari kiri ke kanan:

| # | Tombol (label/title) | Ikon | Aksi | Baris |
|---|---|---|---|---|
| 1 | Pembacaan sudut + "Putar otomatis" | `Eye` | **Klik = toggle autorotate**; teks menampilkan `yaw pitch zoom` (derajat, dibulatkan via `formatAngle`) | 41-51 |
| 2 | `+ Hotspot` (dengan picker) | `Plus` | Tanpa `onPickHotspot`: langsung placement `info`. Dengan picker: buka menu 9 jenis | 55-85 |
| 3 | `Media` | `Sparkles` | `onUploadAudio` → buka file picker `audio/*` (`App.tsx:379,421-433`) | 86-89 |
| 4 | `Polygon` | `Plus` | `onDraw` → `startPlacement("project")`; **tersembunyi di layar < md** (`hidden md:flex`) | 90-93 |
| 5 | `Perkecil` / `Perbesar` | `Minus` / `Plus` | `zoomBy(±6)`; **hanya tampil di lg+** (`hidden lg:flex`) | 97-104 |
| 6 | `Default view` | `Camera` | `resetView()` | 106-113 |
| 7 | `Layar penuh` / `Keluar layar penuh` | `Maximize2` | `toggleFullscreen()` | 115-122 |

Menu picker 9 jenis (`BottomToolbar.tsx:36`, dipetakan di `App.tsx:160-176`):

| Label picker | Tipe internal | Ikon internal |
|---|---|---|
| Point | `info` | `point` |
| Chevron | `scene` | `point` |
| Image | `info` | `image` |
| Article | `info` | `info` |
| Video | `info` | `video` |
| Sound | `info` | `sound` |
| Link | `link` | `link` |
| Compact | `info` | `product` |
| Product | `project` | `product` |

> Ini adalah **kosmetik**: 9 label hanya memilih kombinasi `type` + `icon`; perilaku klik dan panel edit tetap memakai 4 tipe data. ✅

### 2.4 Fullscreen — `src/hooks/useFullscreen.ts:3-20`

- `toggle()` memanggil `ref.current?.requestFullscreen()` pada **`shellRef` = AppShell** (`App.tsx:104,156,222`), bukan elemen kanvas saja.
- State `isFullscreen` dari event `document.fullscreenchange` (baris 6-10).
- `exitFullscreen()` / `requestFullscreen()` di-`.catch(() => undefined)` → gagalnya dibungkam (tanpa notifikasi). ✅
- Public viewer **tidak punya** tombol fullscreen; opsi "Allow Fullscreen" di `PublishModal.tsx:30,35,160` hanya menambahkan atribut `allowfullscreen` pada string iframe embed.

### 2.5 Zoom & kualitas (settings popover) — `App.tsx:39-101`, `useTourViewer.ts:16-22,512-518,532-537`

| Kontrol | Efek nyata |
|---|---|
| Zoom `+/-` toolbar / hotkey | `zoomBy(delta)` → `clamp(view.zoom + delta, 20, 100)` lalu `viewer.zoom(next)` |
| Kualitas Hemat | `minFov=65`, `zoom=45` |
| Kualitas Standar (default) | `minFov=30`, `zoom=70` |
| Kualitas Tinggi | `minFov=15`, `zoom=100` |

> `setQuality` mengubah opsi runtime viewer (`setOption("minFov")` + `zoom`) — **bukan** mengganti URL/resolusi gambar. 🧪  
> Catatan: batas bawah `zoomBy` adalah `20`, lebih rendah dari `minFov` 30/15 yang setara; PSV kemungkinan meng-clamp internal. ✅ dari kode.

---

## 3. Hotspot — tipe, render, ikon, animasi, skema data

### 3.1 Tipe yang benar-benar ada — `src/types/tour.ts:1`

```ts
export type HotspotType = "info" | "project" | "link" | "scene"
```

| Tipe | Data tambahan | Perilaku klik di Studio | Perilaku klik di Public |
|---|---|---|---|
| `info` | `title`, `description` | `setSelectedHotspot()` → diedit di RightPanel tab Hotspot | Tooltip judul; **tanpa panel info** |
| `project` | `title`, `description` | Sama seperti `info` (badge kuning, dipakai untuk "area proyek") | Tooltip judul |
| `link` | `href` | `window.open(href, "_blank", "noopener,noreferrer")` (`useTourViewer.ts:189-192`) + anchor "Buka tautan" di RightPanel (`RightPanel.tsx:580-589`) | ⚠️ **Tidak ada handler `window.open`** → tidak membuka tautan |
| `scene` | `targetSceneId` | Dikeluarkan dari markers; dirender sbg link `VirtualTourPlugin` → panah 3D; klik list di RightPanel juga pindah scene | Dirender sbg link → panah 2D |

**Tidak ada field/schema untuk:** image URL, video URL, audio URL per hotspot, e-commerce (harga/checkout), lead form, geotag. `Scene.audio` adalah audio **level scene**, bukan hotspot (`types/tour.ts:71`). ✅

### 3.2 Skema lengkap — `src/types/tour.ts:1-51`

```ts
type HotspotShape  = "circle"|"square"|"diamond"|"star"|"hexagon"|"triangle"|"heart"        // :4
type HotspotIcon   = "point"|"info"|"link"|"image"|"video"|"sound"|"product"|"star"|"heart" // :5

interface HotspotStyle {                 // :8-27
  size: number        // 1..15, default 3
  effect: "normal"|"pulse"|"blink"|"spin"|"bounce"|"rotate"|"none"   // default "normal"
  color: string       // hex, default "#facc15"
  showLabel: boolean  // default false
  labelOnHover: boolean
  opacity: number     // 10..100, default 100
  rotate: number      // -360..360 derajat, default 0
  shape: HotspotShape
  icon: HotspotIcon
}

interface Hotspot {                      // :41-51
  id: string
  type: HotspotType
  yaw: number
  pitch: number
  title: string
  description?: string
  href?: string
  targetSceneId?: string
  style?: HotspotStyle
}
```

Contoh data nyata di `data/scenes.ts:16-32` (atrium: hotspot `info` + `scene`), `data/scenes.ts:51-74` (studio: `project` + 2× `scene`), `data/scenes.ts:93-109` (terrace: `link` + `scene`).

### 3.3 Cara render marker — `useTourViewer.ts:26-63`

`markerConfig(spot)` membangun HTML:

```html
<div class="hs-marker" style="--hs-color:<warna>;opacity:<opacity/100>">
  <span class="hs-dot hs-<effect> hs-shape-<shape>" data-hs-id="<id>"
        style="width:<14+size*2.4>px;height:...;transform:rotate(<rotate>deg)">
    <svg>...ikon...</svg>
  </span>
  <span class="hs-label hs-label-on-hover">Judul (di-escape HTML)</span>
</div>
```

- Ikon SVG inline (10 entri `ICONS`, `useTourViewer.ts:29-40`): `point, info, project, link, image, video, sound, product, star, heart` — stroke `currentColor`, `stroke-width 2.2`.
- Fallback ikon: `style.icon` → `ICONS[spot.type]` → `ICONS.info` (baris 47).
- `escapeHtml()` (baris 65-69) dipakai untuk `title`, `id`, `color` — mencegah injeksi dari data editor. ✅
- Ukuran marker: `px = 14 + size * 2.4`, `size: { width: px*2, height: px*2 }`, `anchor: "center center"` (baris 44,54-55).
- Tooltip PSV: `{ content: spot.title, position: "top" }` (baris 60).
- `data: { hotspotId: spot.id }` dipakai event `select-marker` & drag (baris 61).
- `sceneLinks()` / `contentHotspots()` (`lib/sceneGraph.ts:3-13`) memisahkan hotspot `scene` (jadi link) dari konten (jadi marker) agar **tidak dobel**.

Versi public memakai HTML hampir sama tapi lebih sederhana (`PublicViewerModal.tsx:64-67`), tanpa inline SVG ikon — hanya dot + label + warna/efek/bentuk. ⚠️ Jadi **ikon tidak tampil di public viewer**, hanya warna/bentuk/animasi. ✅ dari kode.

### 3.4 Animasi & bentuk — `src/styles/theme.css:79-198`, `psv-overrides.css:31-90`

| Efek | CSS class | Keyframe | Durasi |
|---|---|---|---|
| pulse | `.hs-pulse` | `hs-pulse` (scale 1→1.15 + box-shadow) | 1.8s ease-in-out infinite |
| blink | `.hs-blink` | opacity 1 ↔ .25 | 1.2s step-end |
| spin | `.hs-spin` | rotateY? → `rotate(360deg)` (Z) | 4s linear |
| bounce | `.hs-bounce` | translateY 0→-6px→0 | 1.4s ease-in-out |
| rotate | `.hs-rotate` | `rotateY(360deg)` | 5s linear |
| none / normal | — | tanpa animasi | — |

Bentuk via `clip-path` (`theme.css:172-177`): `square` (border-radius 4px), `diamond`, `star`, `hexagon`, `triangle`, `heart`. Semua animasi dimatikan saat `prefers-reduced-motion: reduce` (`theme.css:196-198`). ✅

PSV override lain: `.psv-container` font/background, `.psv-loader` blur, `.psv-tooltip` gelap, `.psv-virtual-tour-arrow` opacity .75 → 1 saat hover (`psv-overrides.css:1-90`).

Panel editor Point setup (`RightPanel.tsx:370-505`) mengontrol: ukuran (1–15), opacity (10–100), efek (7 opsi), rotasi (−360…360), bentuk (7), ikon (9), warna (`<input type=color>`), showLabel, labelOnHover. Realtime lewat `onUpdateHotspot`. ✅

### 3.5 Penempatan & drag hotspot (studio)

**Placement** (`useTourViewer.ts:239-313`):
1. `startPlacement(type, icon)` (baris 567-572) menyimpan tipe di ref + state `placementType`.
2. `TourViewer.tsx:152-160` menampilkan banner kuning "Klik pada panorama untuk menaruh hotspot/area proyek" + tombol Batal.
3. Kanvas dapat class `cursor-crosshair` (`TourViewer.tsx:110`).
4. HUD reticle dibuat manual via DOM (bukan React) dengan label `yaw …° · pitch …°` dari `dataHelper.viewerCoordsToSphericalCoords` (`useTourViewer.ts:244-274`).
5. `pointerup` di mana saja menaruh hotspot; jika koordinat di luar sphere, fallback: `yaw = camera.yaw + dx*180`, `pitch = clamp(camera.pitch - dy*90, -90, 90)` (baris 277-303).
6. `placeHotspot()` (baris 464-490) membuat id `hs-<timestamp>-<random>`, judul default sesuai tipe, deskripsi default, `style` = default + ikon terpilih; lalu `onAddHotspot` → `addHotspot` di AppContext (tersimpan/override).
7. `placementHandledRef` (baris 202-206, 299) mencegah double-placement dari event `click` PSV + `pointerup` window.

**Drag marker** (`useTourViewer.ts:315-407`): pointerdown capture pada `[data-hs-id]`, ghost kuning mengikuti pointer via `requestAnimationFrame` + `translate3d`, marker di-update langsung via `markers.updateMarker(markerConfig({...spot,...next}))`, lalu `onMoveHotspot` menyimpan yaw/pitch saat lepas. ✅

**Edit/hapus** (`RightPanel.tsx:335-631`): pilih dari daftar hotspot, ubah `type`, style, judul, deskripsi, `href` (link), `targetSceneId` (scene), "Set ke layer berikutnya", "Kunjungi scene", hapus, `Simpan perubahan`. ⚠️ Tab panel **tidak otomatis berpindah ke "Hotspot"** saat marker diklik (`RightPanel.tsx:146` — state `tab` lokal, tidak ada effect yang mengubahnya), jadi detail info bisa terasa "tidak muncul" sampai tab dipilih manual. ✅ dari kode.

---

## 4. Navigasi antar scene

### 4.1 Graf data — `src/lib/sceneGraph.ts:3-17`

- `sceneLinks(scene)` → filter hotspot `type==="scene"` + `targetSceneId` → `{ nodeId, position:{ yaw, pitch } }` untuk `VirtualTourPlugin`.
- `contentHotspots(scene)` → filter `type !== "scene"` → marker.
- `findScene(scenes,id)` → fallback `scenes[0]`.

### 4.2 Cara pindah scene (ringkasan)

| Metode | Studio | Public | Referensi |
|---|---|---|---|
| Panah 3D/2D di panorama | ✅ `renderMode:"3d"` | ✅ `renderMode:"2d"` | `tour.config.ts:9`, `PublicViewerModal.ts:49` |
| Klik marker scene | ✅ lewat link plugin | ✅ lewat link plugin | `sceneGraph.ts:4-8` |
| Sidebar scene (thumbnail) | ✅ kiri, `LeftSidebar` | ❌ | `App.tsx:314-321` |
| Side menu kanan (thumbnail + nama) | ✅ opsional, default mati | ❌ | `TourViewer.tsx:114-129` |
| Tour graph (chip + panah →) | ✅ opsional, default mati | ❌ | `TourViewer.tsx:131-150` |
| Mini-map (klik/drag yaw) | ⚠️ hanya mengubah **yaw**, bukan pindah scene | ❌ | `MiniMap.tsx:19-23` |
| Kotak prev/next kanan-bawah | ✅ `lg` ke atas, wrap-around | ✅ tombol chevron kanan-bawah | `TourViewer.tsx:187-212`, `PublicViewerModal.ts:163-172` |
| Hotkey `←/→` | ✅ | ✅ | §2.2 |
| Daftar hotspot di RightPanel | ✅ klik item scene → `onGoToScene` | ❌ | `RightPanel.tsx:601-628` |
| Dropdown "Scene tujuan" | ✅ | ❌ | `RightPanel.tsx:548-561` |

### 4.3 Transisi

| Opsi | Studio | Public |
|---|---|---|
| `showLoader` | `true` | tidak diset |
| `speed` | `"18rpm"` | `"16rpm"` |
| `effect` | `"fade"` | `"fade"` |
| `rotation` | `true` | `true` |
| `renderMode` | `"3d"` | `"2d"` |

Sumber: `useTourViewer.ts:134-139`, `PublicViewerModal.ts:73`, `tour.config.ts:7-9`. ✅

### 4.4 Sinkronisasi node

`useEffect` di `useTourViewer.ts:409-425` memanggil `tour.setNodes(buildNodes(scenes), currentSceneId)` setiap `scenes` berubah (upload/hotspot edit/ganti media), lalu `markers.setMarkers(...)`. Efek terpisah (baris 420-425) menyamakan marker saat `currentSceneId` berubah. `currentSceneId` sengaja tidak dimasukkan dependency efek pertama untuk menghindari loop (komentar baris 416). ✅

### 4.5 Data live yang terverifikasi (`GET /api/public?id=1x2m270p3j`) ✅

Payload publik berisi **3 scene**: `atrium`, `studio`, `terrace`.
- `atrium`: 5 hotspot `info` ("Info baru" hasil eksperimen di editor), **tidak punya hotspot `scene` lagi** → dari atrium tidak ada panah navigasi.
- `studio`: `project` "Proses kreatif", `scene` → `atrium` (yaw 120), `scene` → `terrace` (yaw −120), 1 `info`.
- `terrace`: `link` → behance.net (yaw 60), `scene` → `studio` (yaw −90).
- `initialView`: atrium `{0,0,70}`, studio `{30,0,70}`, terrace `{−20,4,65}`.
- `folders`: 3 folder satu scene each ("The Gallery", "Creative Room", "Sunset Terrace").

Artinya di URL live, alur panah yang benar-benar tersedia: **studio ⇄ terrace** dan **studio → atrium** (atrium merupakan jalan buntu). ✅ (dari data API + logika `sceneGraph`).

---

## 5. MiniMap — `src/components/viewer/MiniMap.tsx:14-91`

| Aspek | Detail |
|---|---|
| Posisi | `fixed left-[264px] top-[100px] z-20 w-80` (baris 26) — mengikuti lebar sidebar 240px + offset (`theme.size.sidebar`, `theme.ts:18`) |
| Responsivitas | `hidden sm:block` → **tidak tampil di layar < 640px** |
| Header | Tombol dengan ikon `Grip` + "Mini-map" + chevron; klik = collapse/expand (baris 27-36) |
| Latar | Gambar `scene.thumbnail` dengan `object-cover opacity-90`, `draggable={false}` (baris 56-61) |
| Penunjuk arah | Garis vertikal kuning 2px + dot; posisi `left = ((yaw + 180)/360)*100 %`, di-clamp 0–100 (baris 17,67-72) |
| Badge | `{hotspotCount} hotspots · yaw {formatAngle(view.yaw)}°` (baris 62-64) |
| Titik hotspot | Dot kuning 8px untuk **setiap** `scene.hotspots`, `left = ((yaw+180)/360)*100`, `top = ((90-pitch)/180)*100` (baris 75-86) |
| Interaksi | `pointerdown` → `setPointerCapture` + `seek`; `pointermove` saat drag → `seek`; `pointerup`/`cancel` → lepas (baris 41-53) |
| `seek()` | `(clientX-left)/width` di-clamp 0..1 → `onSeek(ratio*360-180)` → `tour.rotateTo(yaw)` yang **mempertahankan pitch** (`useTourViewer.ts:505-510`) |
| Toggle | Settings popover "Mini-map" (`App.tsx:83-92`) |
| Mode public | ❌ tidak dirender (`TourViewer` hanya dipakai studio) |

> ⚠️ Ini **bukan peta denah/geospasial**: hanya proyeksi linear yaw/pitch pada thumbnail. Klik **tidak berpindah scene**, hanya mengarahkan pandangan. Task brief menyebut "klik untuk pindah scene" — di source **tidak demikian**. ✅ dari kode.

---

## 6. Media picker / lightbox — klarifikasi

Tugas menyebut "media picker / lightbox: gambar/video/audio, galeri, thumbnail". Implementasi sebenarnya berbeda:

### 6.1 `MediaPickerModal.tsx:9-68` — bukan galeri media

- Judul: **"Pilih gambar dari scene"**, subjudul: *"Ganti panorama & thumbnail scene ini dengan scene lain."* (baris 21-22).
- Isi: grid 2–3 kolom berisi **thumbnail scene lain** (tidak termasuk scene aktif, baris 11).
- Klik item → `setMediaFromScene(activeSceneId, scene)` (`AppContext.tsx:679-682`) → menimpa `panorama` + `thumbnail` scene aktif lewat `mediaOverrides`.
- Tombol **"Pulihkan asli"** → `removeSceneMediaOverride()` (`AppContext.tsx:684-703`) + notifikasi.
- Dibuka dari RightPanel tombol **"Select post"** (`RightPanel.tsx:217-220`) → `App.tsx:399,450`.
- ❌ Tidak ada upload gambar/video/audio, tidak ada galeri aset, tidak ada thumbnail multi-media.

### 6.2 `Lightbox.tsx:4-28` — preview gambar tunggal

- Dibuka dari tombol **"Perbesar thumbnail"** di RightPanel (`RightPanel.tsx:208-210`) → `App.tsx:398,451`.
- Hanya `<img src={tour.currentScene.thumbnail}>` maks. 75vh + judul + tombol X.
- Escape menutup (`Lightbox.tsx:5-11`). Klik backdrop menutup (baris 16).
- ❌ Tanpa navigasi galeri, tanpa prev/next, tanpa video/audio player.

### 6.3 Audio scene (yang paling mirip "media")

- Upload `audio/*` lewat input hidden (`App.tsx:421-433`) → `setSceneAudio` → `Scene.audio` (`AppContext.tsx:899`).
- Player sederhana di kanan-atas viewer: ikon `Music2`, nama file, tombol **Putar/Jeda**, tombol X hapus (studio only), `<audio>` element (`TourViewer.tsx:171-185`).
- `toggleAudio()` (`TourViewer.tsx:93-102`) → `play().catch()` memunculkan notifikasi "Audio tidak dapat diputar di browser ini."; state reset saat `scene.audio` berubah (baris 89-91).
- ❌ Public viewer tidak memutar audio scene.

### 6.4 Video

❌ Tidak ada `video-plugin`, tidak ada field video, tidak ada player. Ikon `video` di hotspot hanya kosmetik (`ICONS.video`, `useTourViewer.ts:35`). ✅

---

## 7. Efek khusus — sejauh apa diimplementasikan

Sumber: `src/lib/effects.ts:1-48`, diterapkan di `useTourViewer.ts:427-437`, UI di `RightPanel.tsx:238-318`, badge nadir di `TourViewer.tsx:214-218`.

| Fitur | Status | Detail /Referensi |
|---|---|---|
| Leveling (roll) | ✅ | `effects.roll` (−20…20°) → `viewer.setOption("sphereCorrection", { roll })` (`useTourViewer.ts:432-436`); slider + tombol "Level this scene" (`RightPanel.tsx:238-246`) |
| Nadir | ⚠️ **Parsial** | `effects.nadir` hanya memunculkan badge teks "VIRTour360" di bawah tengah (`TourViewer.tsx:214-218`) — **bukan penutup nadir/gambar** seperti Panoee. Tidak tampil di public viewer. |
| Brightness / Contrast / Saturate / Hue / Grayscale / Sepia | ✅ | CSS `filter` pada `.psv-canvas-container` via `effectsToCss()` (`effects.ts:30-40`, `useTourViewer.ts:430-431`); slider di Quick Fix / Custom Fix / Filter Processing / Sun light (`RightPanel.tsx:255-298`) |
| Preset Quick Fix | ✅ | `natural, warm, cool, mono` (dusk disembunyikan dari Quick Fix); `dusk` dipakai tombol "Terapkan senja" (`effects.ts:42-48`, `RightPanel.tsx:255-279`) |
| Reset efek | ✅ | `resetSceneEffects()` (`RightPanel.tsx:296`) |
| Autorotate | ✅ | `AutorotatePlugin` pitch 5°, speed 2rpm; toggle di toolbar (`useTourViewer.ts:142,520-530`) — **tidak tersedia di public viewer** |
| Transisi fade + rotasi | ✅ | Lihat §4.3 |
| Kompas | ✅ | `CompassPlugin size 48px`, toggle checkbox (`useTourViewer.ts:143,539-543`, `App.tsx:73-76`) |
| **Little planet / stereographic** | ❌ | Tidak ada opsi `projection`, tidak ada plugin, tidak ada UI. |
| **Green screen video** | ❌ | Tidak ada video plugin maupun field chroma-key. |
| **Multi-resolution / tiling** | ❌ | Tidak ada tile source; satu URL panorama penuh per scene. |
| **Day-to-dusk penuh** | ⚠️ | Hanya preset CSS filter `dusk`, bukan simulasi matahari/time-of-day. |
| **Efek di public viewer** | ❌ | `PublicViewerModal` tidak membaca `effectsByScene` sama sekali — semua efek (warna, roll, nadir) **hanya di studio**. |
| **Kualitas gambar "Standard/High/Original"** | ⚠️ **Dead setting** | `imageQuality` disimpan di localStorage/remote (`AppContext.tsx:245-251`) dan ditampilkan di `RightPanel.tsx:300-318`, tetapi **tidak dipakai** saat menyusun `scene.panorama` (`AppContext.tsx:875-902`). Tidak ada perubahan URL/resolusi. |

---

## 8. VR / gyroscope / mobile motion

| Item | Status | Bukti |
|---|---|---|
| GyroscopePlugin | ✅ terpasang di studio | `useTourViewer.ts:7,144`, ref baris 101,160,167 |
| Toggle gyroskop | ✅ checkbox "Gyroskop" di settings | `App.tsx:77-80` → `setGyroscopeEnabled` (`useTourViewer.ts:545-558`) |
| Start/stop | ✅ `plugin.start()/stop()`; gagal → notifikasi **"Gyroskop tidak tersedia di perangkat/browser ini."** | `useTourViewer.ts:551-557` |
| Syarat | ✅ Teks bantuan: "Gyroskop hanya bekerja pada perangkat sensor & localhost/HTTPS." | `App.tsx:94-95` |
| VR stereoskopik (kacamata) | ❌ | Tidak ada tombol VR; navbar PSV mati; tidak ada plugin stereo/VR. `allow="vr"` hanya di string embed (`PublishModal.tsx:35,161`). |
| Device orientation manual | ❌ | Tidak ada listener `deviceorientation` buatan; sepenuhnya lewat plugin. |
| Public viewer gyro | ❌ | Tidak dipasang di `PublicViewerModal`. |
| Embed iframe | ✅ (string saja) | `EmbedModal.tsx:8` memakai `allow="fullscreen; gyroscope; accelerometer"`; `PublishModal.tsx:35` memakai `allow="vr"` bila dicentang. |

---

## 9. Loading progresif, optimasi, error handling

### 9.1 Loading

- PSV menampilkan `.psv-loader` (di-styling gelap + blur di `psv-overrides.css:7-16`).
- Studio **juga** punya overlay React: spinner + teks "Menyiapkan panorama⬦" saat `!tour.isReady`, menutup area antara sidebar & inspector (`App.tsx:406-413`).
- `transitionOptions.showLoader: true` saat pindah node studio (`useTourViewer.ts:135`).
- `tourConfig.loadingLabel` tidak dipakai (lihat §1.2).
- ❌ Tidak ada indikator persentase/byte progres; ❌ tidak ada placeholder blur-up; ❌ tidak ada lazy-load per scene (semua node dikirim sekaligus ke plugin).

### 9.2 Optimasi gambar

| Teknik | Status |
|---|---|
| Thumbnail terpisah (`/media/thumbnails/*.jpg`) | ✅ dipakai sidebar, mini-map, graph, kartu public, folder cover |
| Header cache Vercel untuk aset media | ✅ `vercel.json` (disebut `README.md:61`) |
| Resize/compress otomatis saat upload | ⚠️ sebagian — UploadModal menyimpan ke IndexedDB/Storage; lihat `AppContext` upload flow. Tidak ada pipeline resize di viewer. |
| Multi-resolusi / progressive JPEG / tile | ❌ |
| `imageQuality` efektif | ❌ (lihat §7) |
| Panorama berbasis object URL (`blob:`) untuk upload lokal | ✅ (`AppContext.tsx:881-882`) |

### 9.3 Error handling

| Kasus | Perlakuan | Referensi |
|---|---|---|
| Scene tujuan tidak ada | `setCurrentNode().catch()` → `onNotify("Scene tujuan tidak ditemukan.")` / `"Scene tidak ditemukan."` | `useTourViewer.ts:186,496` |
| Audio gagal diputar | notifikasi "Audio tidak dapat diputar di browser ini." | `TourViewer.tsx:97` |
| Gyroskop gagal | notifikasi "Gyroskop tidak tersedia…" | `useTourViewer.ts:554-557` |
| Koordinat klik di luar sphere | fallback perhitungan yaw/pitch relatif kamera | `useTourViewer.ts:282-297` |
| `sphereCorrection` tidak didukung | `try/catch` dibungkam | `useTourViewer.ts:432-436` |
| Fullscreen ditolak browser | `.catch(() => undefined)` | `useFullscreen.ts:14-16` |
| Panorama gagal dimuat (404/CORS/decode) | ⚠️ **Tidak ada listener `error` PSV** — mengandalkan tampilan error default PSV | — |
| Publik: data publish Gagal | fallback ke scene lokal | `PublicPortfolioView.tsx:276-295` |

---

## 10. Public viewer vs Studio viewer — perbandingan lengkap

| Aspek | Studio (`App.tsx` + `useTourViewer` + `TourViewer`) | Public (`PublicViewerModal`) |
|---|---|---|
| Mount | Route `#/studio`, butuh login (`Root.tsx:31-44`) | Modal di atas `#/portfolio` / `#/p/<uid>` / home |
| Inisialisasi | `new Viewer` sekali + 6 plugin | `new Viewer` per buka modal + 0–2 plugin |
| `renderMode` | `"3d"` | `"2d"` |
| `navbar` | `false` | `false` |
| FOV / zoom | 30/100, default 70 | 30/100, default 70 (sama) |
| Panah 3D | ✅ | ✅ (2D) |
| Marker hotspot | ✅ dengan SVG ikon + drag + klik | ✅ tanpa ikon, tanpa drag, tanpa panel detail |
| Hotspot `link` → buka URL | ✅ | ❌ |
| Info/text detail | ✅ panel editor | ❌ hanya tooltip judul |
| Audio scene | ✅ player + upload/hapus | ❌ |
| Efek warna/leveling/nadir | ✅ | ❌ |
| Autorotate | ✅ | ❌ |
| Kompas / Gyroskop / Settings plugin | ✅ (Settings plugin tanpa UI) | ❌ |
| Mini-map / Side menu / Tour graph | ✅ (toggle) | ❌ |
| Toolbar bawah | ✅ zoom ±, Default view, Fullscreen, Hotspot picker, Media, Polygon | ❌ |
| Hotkey | `← → R + - F` | `Esc ← →` |
| Fullscreen | ✅ via AppShell | ❌ (hanya atribut embed) |
| UI info | TopBar, sidebar, inspector, counter | Header overlay judul + "x / n scene" + hint bawah: *"Geser untuk melihat 360° · scroll zoom · klik panah kuning pindah scene · Esc keluar"* (`PublicViewerModal.ts:174-176`) |
| Transisi | fade, 18rpm, loader, rotasi | fade, 16rpm, rotasi |
| Data | `scenes` dari AppContext (milik user, lebih volatile) | `sourceScenes` dari `/api/public?id=<uid>` (`PublicPortfolioView.tsx:276-305`) |

---

## 11. Matriks "terimplementasi vs belum" (ringkas)

### ✅ Terimplementasi & fungsional
- Engine PSV 5 + VirtualTour/Markers/Autorotate/Compass/Gyro/Settings plugin
- Panorama equirectangular 2:1, FOV/zoom/initial-view (studio), navbar custom
- Drag, wheel zoom, two-finger touch, zoom ± tombol & hotkey
- `← → R + = - f/F` hotkeys (dengan guard input)
- Fullscreen (AppShell)
- 4 tipe hotspot + 9 ikon + 7 bentuk + 7 efek + warna/opacity/rotasi/label
- Placement klik panorama + HUD koordinat + drag marker
- Hotspot CRUD di inspector + override yang tersimpan
- Panah navigasi 3D (studio)/2D (public), sidebar, side menu, graph, prev/next, transisi fade
- Mini-map yaw-seek + titik hotspot
- Audio scene (studio)
- Leveling roll, filter warna CSS, preset efek, badge nadir
- Gyroskop on-demand
- Publish link `#/p/<uid>`, QR, embed, loading overlay

### ⚠️ Terimplementasi tapi terbatas / menyesatkan
- `loadingLabel` — dead config
- `imageQuality` Standard/High/Original — hanya tersimpan, tidak mengubah gambar
- Nadir — hanya badge teks, bukan penutup
- Polygon — tombol hanya menaruh 1 titik `project`, bukan area/`polygon_config`
- 9 picker hotspot — alias kosmetik untuk 4 tipe data
- Mini-map — bukan peta; klik mengubah yaw, bukan pindah scene
- SettingsPlugin — dipasang tapi tak ada UI pembuka
- "Allow VR" / `allow="vr"` — hanya string embed
- Day-to-dusk — preset filter statis
- Detail hotspot — tidak muncul otomatis saat marker diklik (tab inspector tidak berganti)
- `initialView` — hanya dipakai saat load awal & tombol reset, bukan tiap pindah scene
- Public viewer — marker info/link tidak punya aksi klik bermakna

### ❌ Belum diimplementasikan
- VR stereoskopik / cardboard mode
- Little planet (stereographic projection)
- Green screen / chroma-key video
- Video plugin & panorama video
- Multi-resolution / tile / progressive loading
- Galeri media & lightbox gambar/video/audio (yang ada hanya preview thumbnail)
- E-commerce hotspot, lead form, geotagging
- Lottie/callout/zoomRange hotspot (`docs/RESEARCH.md:79-81`)
- Error handler eksplisit untuk kegagalan load panorama
- Hotkey Escape/VR/autorotate di studio

---

## Lampiran A — Indeks file & baris

| File | Baris kunci |
|---|---|
| `src/hooks/useTourViewer.ts` | 16-22 (QUALITY), 26-40 (ICONS), 42-63 (markerConfig), 71-81 (buildNodes), 94-119 (state+live ref), 121-237 (init+events), 239-313 (placement HUD), 315-407 (drag), 409-446 (sync), 427-437 (efek), 464-490 (placeHotspot), 492-518 (goToScene/reset/rotate/zoom), 520-558 (autorotate/kompas/gyro), 594-621 (return API) |
| `src/components/viewer/TourViewer.tsx` | 104-110 (kanvas), 112-150 (mini-map/side-menu/graph), 152-160 (placement banner), 171-185 (audio), 187-212 (prev/next), 214-218 (nadir badge), 226-239 (toolbar) |
| `src/components/viewer/BottomToolbar.tsx` | 35-36 (picker state/list), 41-122 (tombol) |
| `src/components/viewer/MiniMap.tsx` | 14-23 (state+seek), 25-87 (UI) |
| `src/components/viewer/PublicViewerModal.tsx` | 29-41 (single), 45-81 (tour), 83-121 (events), 123-140 (go+hotkey), 142-177 (UI) |
| `src/components/viewer/MediaPickerModal.tsx` | 9-68 |
| `src/components/ui/Lightbox.tsx` | 4-28 |
| `src/hooks/useHotkeys.ts` | 12-44 |
| `src/hooks/useFullscreen.ts` | 3-20 |
| `src/lib/sceneGraph.ts` | 3-17 |
| `src/lib/effects.ts` | 1-48 |
| `src/types/tour.ts` | 1-83 |
| `src/config/tour.config.ts` | 1-12 |
| `src/styles/theme.css` | 79-198 (hotspot animasi & bentuk) |
| `src/styles/psv-overrides.css` | 1-90 |
| `src/App.tsx` | 39-101 (SettingsPopover), 148-193 (hook wiring), 325-380 (TourViewer props), 406-413 (loading), 421-433 (audio input), 450-451 (modals) |
| `src/components/layout/RightPanel.tsx` | 195-331 (efek & kualitas), 335-631 (hotspot editor) |
| `src/context/AppContext.tsx` | 245-251 (imageQuality), 679-703 (media override), 875-902 (scenes assembly) |
| `src/views/PublicPortfolioView.tsx` | 258-305 (load publish), 553-560 (PublicViewerModal), 327-339 (UID) |
| `src/lib/publicStore.ts` | 63-80 (UID & share URL), 107-120 (load public) |
| `src/lib/navigation.ts` | 3-9 (hash → view) |
| `src/components/auth/PublishModal.tsx` | 30-35 (embed), 157-167 (VR/fullscreen/lazy), 44-67 (publish) |

## Lampiran B — Catatan verifikasi live

- `GET https://virtour360real.vercel.app/api/public?id=1x2m270p3j` → HTTP 200, payload `uid: "1x2m270p3j"`, 3 scene seperti di §4.5. ✅
- Fetch `#/p/1x2m270p3j` → HTML shell bertitle **"Virtour360 — Studio Virtual Tour"** (SPA; konten viewer dirender client-side). ✅
- Upaya `tools.browser.tabs.open/list` tiga kali mengembalikan `[browser.disconnected]`; sesuai skill browser, tidak di-retry lagi. Klik interaktif (panah, hotkey, fullscreen, mini-map, marker) **belum dikonfirmasi secara visual** — statusnya ditandai 🧪 di dalam dokumen ini. Semua kesimpulan 🧪 berasal dari pembacaan source langsung dan dapat diverifikasi ulang setelah browser desktop tersambung.
