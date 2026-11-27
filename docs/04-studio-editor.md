# 04 — Studio / Editor Virtour360 (Replika Panoee)

> **Sumber utama**: `C:\Users\visual works\Documents\rea\virtour360`
> **Live**: https://virtour360real.vercel.app — rute `#/studio` (tombol **Studio** di header publik)
> **Dokumen induk**: `FEATURE_DOCS/00-DOKUMENTASI-FITUR-LENGKAP.md`
> **Tanggal audit**: 2026-11-23
> **Metode**: pembacaan menyeluruh seluruh source (`src/`, `api/`, `docs/`), tanpa mengubah satu baris kode. Upaya observasi live melalui browser in-app **gagal** karena browser tidak terhubung ke sesi (`[browser.disconnected] — no desktop browser is connected`). Observasi produksi yang tercatat di `virtour360/docs/QA.md` (2026-11-22) dipakai sebagai bukti sekunder dan ditandai eksplisit di bawah.

---

## 0. Ringkasan eksekutif

Studio Virtour360 adalah editor 360° bergelap 3 kolom yang dibangun di atas **Photo Sphere Viewer 5** (bukan krpano seperti Panoee). Fitur yang **benar-benar bekerja dan tersimpan**: multi-scene (bawaan + upload), grup & urutan scene, hotspot CRUD + drag + undo, gaya marker (ukuran/opacity/rotasi/efek/bentuk/ikon/warna/label), efek warna & leveling per scene, audio per scene, thumbnail capture, replace panorama, pilih media dari scene lain, pratinjau, publish + link/QR/embed, sinkronisasi state ke backend Supabase via Vercel Function.

Fitur yang **masih kosong/placeholder atau berbeda dari Panoee**: rename scene, duplicate scene, drag-reorder thumbnail, breadcrumb, editor tema, penyimpanan *initial view* / FOV / zoom limit dari UI, polygon hotspot sungguhan, status Draft/Archived sungguhan, duplicate project di dashboard, dan sebagian label UI kosmetik. Detail lengkap ada di §10.

### Peta status cepat

| Area | Status | Catatan |
|---|---|---|
| Layout 3 kolom + mini-map + toolbar | ✅ Lengkap | `src/App.tsx`, `TopBar`, `LeftSidebar`, `RightPanel`, `TourViewer` |
| Scene: tambah, hapus, urutkan, grup | ✅ | Tambah/hapus hanya scene hasil upload; urutan memakai offset angka |
| Scene: rename, duplikat, breadcrumb | ❌ | Tidak ada UI/API |
| Inspector: hotspot & point setup | ✅ | Paling kaya, adaptive dari Panoee |
| Inspector: judul/deskripsi scene, initial view | ⚠️ | Field `readOnly`; `initialView` tidak bisa diubah dari UI |
| Kanvas: klik taruh hotspot + drag | ✅ | HUD reticle, konversi yaw/pitch, ghost GPU |
| Mode edit vs preview | ✅ | `preview` menyembunyikan semua panel |
| Hotkey | ✅ | ←/→, R, +/−, F (abaikan saat input fokus) |
| Media: upload, replace, pilih dari scene, hapus | ✅ | Tanpa folder/album/drag-reorder |
| Dashboard: filter, kartu, notifikasi | ✅ | Badge "Published" hardcode untuk semua kartu |
| Undo / redo | ⚠️ | Undo hotspot saja (20 level, memori); **tanpa redo** |
| Autosave & persistensi | ✅ | localStorage + IndexedDB + Supabase (debounce 800 ms) |

---

## 1. Akses, rute, dan gating

| Fakta | Referensi |
|---|---|
| Hash router: `#/home` (default), `#/portfolio`, `#/p/<uid>`, `#/studio`, `#/dashboard` | `src/lib/navigation.ts:1-14`, `src/Root.tsx:29-37` |
| `#/studio` dan `#/dashboard` adalah **rute privat**. Tanpa `user` dari context, yang tampil adalah `LoginRequired`, bukan editor. | `src/Root.tsx:31,41-44`; `src/components/auth/LoginRequired.tsx:7-46` |
| `LoginRequired` menampilkan tombol **Masuk sekarang** (`setAuthOpen(true)`) dan **Kembali ke publik**; teks: “Studio perlu login”. | `LoginRequired.tsx:21-38` |
| Setelah register/login sukses, `AuthModal` otomatis `navigate("studio")`. | `src/components/auth/AuthModal.tsx:34-48` |
| QA produksi mencatat: `#/studio` tanpa login → gate PASS; login `alvi@example.com` / `demo1234` → Studio PASS. | `docs/QA.md:13-15` (bukti sekunder) |

**Implikasi untuk pengamat**: link `#/p/1x2m270p3j` adalah portofolio publik; tombol **Studio** di header akan menuju gate login bila belum ada sesi. Tidak ada mode “demo tamu” untuk studio di build saat ini (changelog 2026-11-22 menghapus konsep tamu, `docs/CHANGELOG.md:143-150`).

---

## 2. Layout Studio — inventaris elemen UI

Ukuran token: `topbar = 56px`, `sidebar = 240px`, `inspector = 260px` (`src/config/theme.ts:16-20`). Kontainer akar adalah `AppShell`: `relative h-full w-full overflow-hidden bg-zinc-950` (`src/components/layout/AppShell.tsx:3-17`). Kanvas `main` diposisikan `left: 240px / right: 260px`, atau `0/0` saat preview (`src/components/viewer/TourViewer.tsx:104-108`, `src/App.tsx:365`).

### 2.1 Top bar (tinggi 56px, 3 zona)

`src/components/layout/TopBar.tsx:50-145`

| Zona | Elemen | Fungsi / perilaku | Ref |
|---|---|---|---|
| Kiri (lebar sidebar) | Avatar inisial (`user?.initials ?? profile.initials` = `aw`) + chevron | Membuka **menu akun** dropdown | `TopBar.tsx:57-66`; `App.tsx:229,258-312` |
| Tengah (mengambang, pill hitam blur) | 6 ikon tool: **Pilih & edit hotspot** (Pencil), **Kursor/navigasi** (MousePointer2), **Hotspot** (MapPin), **Urungkan** (Undo2), **Gambar area** (PenLine), **Pengaturan tampilan** (Settings2) | `activeTool` state lokal di `App.tsx:106`. Tool aktif = background putih. Undo disabled bila `!canUndo`, tooltip berubah jadi “Belum ada perubahan untuk dibatalkan”. | `TopBar.tsx:14-21,69-97`; `App.tsx:197-212` |
| Kanan (lebar inspector) | **3 Suggestion** + indikator dot | Membuka popover saran (3 aksi: tambah hotspot info, reset tampilan, buka scene berikutnya). Jumlah “3” hardcode. | `TopBar.tsx:104-113`; `App.tsx:239-256` |
| Kanan | Tombol **Play** (pratinjau) | `preview = true` → TopBar, sidebar, inspector, mini-map, saran, graph hilang; tombol keluar pratinjau muncul di kanvas. | `TopBar.tsx:115-124`; `App.tsx:223-224,325,382,366-367`; `TourViewer.tsx:162-169` |
| Kanan | Tombol biru **Published** | Membuka `PublishModal` (bukan langsung publish). | `TopBar.tsx:125-131`; `App.tsx:236,437-449` |
| Melayang kanan viewer | Tombol **SlidersHorizontal** | Toggle `SettingsPopover`. | `TopBar.tsx:135-143`; `App.tsx:341-358` |

**Menu akun** (`App.tsx:258-312`): identitas user/email (atau “Publik / Data tersimpan di browser ini”), Pengaturan akun → `ProfileModal`, Unggah panorama 360° → `UploadModal`, Buka Dashboard, Kembali ke Portofolio user, Embed portofolio → `EmbedModal`, Salin link publish (hanya bila `localStorage["virtour360.publishedUid"]` ada), Kembali ke Home, dan Keluar / Masuk–Daftar.

**SettingsPopover** (`App.tsx:39-101`, dirender di `TourViewer.tsx:220-224`):
- Kualitas viewer: `hemat / standar / tinggi` → mengubah `minFov` (65/30/15) & zoom (45/70/100). **State lokal hook, tidak dipersist.**
- Checkbox **Kompas** (default on) dan **Gyroskop** (default off; gagal → toast).
- View options: **Mini-map** (default on), **Side menu** (default off), **Tour graph** (default off).
- Footer hotkey + catatan gyroskop hanya di perangkat sensor & localhost/HTTPS.

> Catatan implementasi: prop `onToggleSettings` di `TopBar` tidak dipakai; toggle settings sebenarnya lewat `handleTool("settings")` (`App.tsx:207-208`).

### 2.2 Left sidebar — manajemen scene (lebar 240px)

`src/components/layout/LeftSidebar.tsx:77-305`

| Bagian | Elemen | Fungsi | Ref |
|---|---|---|---|
| Aksi utama | Tombol putih **+ Create** | Membuka `UploadModal` (sama dengan Add Scene) | `LeftSidebar.tsx:81-87`; `App.tsx:318-319` |
| Aksi utama | Toggle **Images / List** | Tampilan kartu thumbnail atau baris daftar | `LeftSidebar.tsx:88-103` |
| Aksi cepat (5 ikon) | **Group** (siklus: none → source → category → none), **Collapse**, **Info**, **Search**, **More** | Group sumber memisahkan `Upload Anda` vs `Scene bawaan` berdasar prefix id `pano-`; group kategori memakai `scene.group`. Info = panel statistik (scene/hotspot/upload/tampilan). Search = filter nama, judul proyek, group, tag. More = Hapus pencarian / Pulihkan tampilan / Buka Dashboard. | `LeftSidebar.tsx:69-75,106-165` |
| Header grup | Chevron collapse, nama grup + jumlah, ikon pensil (rename via `window.prompt`), ikon trash (hapus; grup terakhir tidak bisa dihapus) | Grup disimpan di AppContext | `LeftSidebar.tsx:169-202`; `AppContext.tsx:808-849` |
| Kartu scene | Tombol **+ Add Scene** di dalam tiap grup | Membuka upload | `LeftSidebar.tsx:205-213` |
| Tampilan grid | Kartu 74px dengan background thumbnail, gradient gelap, nama scene, dot putih, dot amber bila aktif; tombol trash muncul saat hover **hanya untuk scene upload** | Klik kartu = pindah scene | `LeftSidebar.tsx:240-266` |
| Tampilan list | Baris 44px: thumbnail 32px, nama, tombol **↑ / ↓**, `<select>` pindah grup, trash (upload saja) | `moveScene(id, ±1)`, `setSceneGroup` | `LeftSidebar.tsx:219-238` |
| Bawah daftar | **+ Grup baru** → input nama (Enter simpan, Escape batal) | `createGroup` | `LeftSidebar.tsx:278-302` |

**Tidak ada** breadcrumb, rename scene, duplikat scene, drag-reorder kartu, atau indikator nomor urut di sidebar.

### 2.3 Kanvas viewer + overlay

`src/components/viewer/TourViewer.tsx:104-240`

| Overlay | Posisi / syarat | Fungsi | Ref |
|---|---|---|---|
| `<div ref={containerRef}>` | `absolute inset-0`, kursor crosshair saat mode penempatan | Kanvas Photo Sphere Viewer | `TourViewer.tsx:110` |
| **Mini-map** | kiri 264px, atas 100px, lebar 320px, `sm:block`; bisa collapse | Gambar thumbnail + garis penunjuk yaw + titik hotspot; klik/drag → `rotateTo(yaw)` | `TourViewer.tsx:112`; `MiniMap.tsx:14-89` |
| **Side menu** | kanan tengah, syarat `showSideMenu && !preview` | Daftar cepat 44px thumbnail scene | `TourViewer.tsx:115-129` |
| **Tour graph** | bawah tengah, syarat `showGraph && !preview` | Rantai scene `A → B → C` dengan thumbnail | `TourViewer.tsx:132-150` |
| Banner penempatan | atas tengah, syarat `placementType` | “Klik pada panorama untuk menaruh hotspot / area proyek” + tombol **Batal** | `TourViewer.tsx:152-160` |
| Tombol **Keluar pratinjau** | kiri atas, hanya preview | Kembali ke editor | `TourViewer.tsx:162-169` |
| Pill audio | kanan atas bila `scene.audio` | Nama file + Putar/Jeda + hapus audio; `<audio>` inline | `TourViewer.tsx:171-185` |
| Box **360 berikutnya** | kanan bawah, `lg:flex` | Panah kiri + kartu scene berikutnya (thumbnail, nama) → pindah scene | `TourViewer.tsx:188-212`; `App.tsx:368-371` |
| Badge nadir | bawah tengah bila `effects.nadir` | Teks “VIRTour360” sebagai penutup nadir | `TourViewer.tsx:214-218` |
| Settings popover | kanan atas 56px | Lihat §2.1 | `TourViewer.tsx:220-224` |
| Bottom toolbar | bawah tengah | Lihat §5 | `TourViewer.tsx:226-239` |
| Overlay loading | seluruh area editor, bila `!isReady` | Spinner + “Menyiapkan panorama…” | `App.tsx:406-413` |
| Credit | kanan bawah (hidden di <lg) | `user.name · project.title · project.year` | `App.tsx:415-417` |

### 2.4 Right panel / inspector (lebar 260px)

`src/components/layout/RightPanel.tsx:172-653`

3 tab: **Scene** (default), **Hotspot** (dengan jumlah hotspot), **Location** (`RightPanel.tsx:157-191`). Konten scroll dengan `pb-24`.

Detail tab ada di §3 dan §4. Secara ringkas: tab Scene berisi 11 accordion; tab Hotspot berisi tombol tambah, editor hotspot terpilih, dan daftar semua hotspot; tab Location hanya informasi profil statis.

---

## 3. Manajemen scene

### 3.1 Model scene

`src/types/tour.ts:61-72`: `id, name, description, group, panorama, thumbnail, initialView{yaw,pitch,zoom}, hotspots[], project{title,role,client,year,tags}, audio?`.

Scenefinal dirakit di `AppContext.tsx:875-902` dengan urutan prioritas:
`staticScenes` (3 scene bawaan di `src/data/scenes.ts:6-119`) + scene hasil upload → override `group`, `hotspots`, media (`effectiveMedia = mediaOverrides + assetMedia`), `audio` → diurutkan berdasarkan `sceneOrder[a.id] - sceneOrder[b.id]`.

### 3.2 Inventaris operasi scene

| Operasi | Ada? | Mekanisme / batasan | Ref |
|---|---|---|---|
| Tambah scene | ✅ | Satu-satunya cara: upload gambar equirectangular lewat `UploadModal` → `addPanorama()` → id `pano-<timestamp>-<random>`, nama dari input atau nama file, hotspot awal `[]`, `initialView {0,0,70}`, grup `Uncategory`. | `UploadModal.tsx:45-72,107-145`; `AppContext.tsx:549-569,875-892` |
| Hapus scene | ⚠️ | Hanya scene upload (id diawali `pano-`). Tombol trash tersembunyi untuk 3 scene bawaan. `removePanorama()` juga menghapus file Storage, asset IndexedDB, audio, media override, dan URL cache. | `LeftSidebar.tsx:236,256-264`; `App.tsx:214-219`; `AppContext.tsx:571-607` |
| Duplikat scene | ❌ | Tidak ada tombol/API. (Panoee punya `scene/CreateScene(s)`; Virtour360 tidak.) | `docs/RESEARCH.md:24-25,32` |
| Urutkan scene | ⚠️ | Tombol ↑/↓ hanya di **tampilan list**. `moveScene` menambah/mengurangi angka offset `sceneOrder[id]`, lalu array di-`sort`. Bukan swap sungguhan: klik berulang pada scene yang sama bisa menghasilkan nilai kembar dan urutan stabil mengikuti posisi awal. Tidak ada drag-reorder. | `LeftSidebar.tsx:226-227`; `AppContext.tsx:859-866,901` |
| Rename scene | ❌ | Field `name` di inspector bersifat `readOnly` (tooltip: “ubah melalui panel pengaturan proyek”, panel tersebut tidak ada). Scene upload bisa diganti nama hanya lewat nama file saat upload. | `RightPanel.tsx:48-59,199`; `UploadModal.tsx:109-117` |
| Grup scene | ✅ | Buat / rename (via `prompt`) / hapus / pindah scene via `<select>`. Default `Uncategory`. | `LeftSidebar.tsx:177-202,228-235,278-302`; `AppContext.tsx:808-857` |
| Scene aktif | ✅ | `tour.currentSceneId` (hook) + `activeSceneId` (context) + `setActiveSceneId`. Klik kartu/thumbnail, panah 3D, box “360 berikutnya”, atau ←/→. Perpindahan memicu `node-changed`, `setNodes`/`setMarkers`, reset seleksi hotspot. | `useTourViewer.ts:104-106,174-179,420-425,439-446,492-497`; `App.tsx:314-321` |
| Breadcrumb | ❌ | Tidak ada komponen breadcrumb di source. | — |
| Thumbnail | ✅ | 3 aksi: **Camera** = `captureThumbnail(sceneId, currentThumbnailUrl())` (memakai URL panorama aktif sebagai thumbnail); **Maximize2** = Lightbox; **Replace** = `UploadModal` mode ganti; **Select post** = `MediaPickerModal`. | `RightPanel.tsx:202-220`; `App.tsx:394-400`; `AppContext.tsx:664-703` |

### 3.3 Alur perpindahan scene (ringkas)

1. Klik thumbnail → `tour.goToScene(id)` (`useTourViewer.ts:492-497`).
2. `setCurrentSceneId(id)` + callback `onSceneChange` → `setActiveSceneId` di context.
3. `tourRef.current.setCurrentNode(id)` → PSV `node-changed` → marker scene diganti (`useTourViewer.ts:421-425`).
4. Efek CSS per scene diterapkan ulang ke `.psv-canvas-container` (`useTourViewer.ts:427-437`).

---

## 4. Inspector / panel properti

### 4.1 Tab Scene — 11 accordion

`src/components/layout/RightPanel.tsx:195-333`

| Accordion | Kontrol | Apa yang berubah | Persist | Ref |
|---|---|---|---|---|
| **Config** (default open) | 2 `Field` read-only (nama, id scene), baris thumbnail (Camera / Maximize2), tombol **Replace**, **Select post**, audio (nama + X atau tombol **Upload file .mp3**) | Nama & id **tidak bisa diedit**; thumbnail, panorama, audio bisa | ✅ localStorage/IndexedDB/remote | `RightPanel.tsx:197-236` |
| **Levelling** | Slider `Roll` (−20…20°) + tombol **Level this scene** | `effects.roll` → `viewer.setOption("sphereCorrection", {roll})` | ✅ `virtour360.effects` | `RightPanel.tsx:238-246`; `useTourViewer.ts:427-437` |
| **Nadir** | Checkbox “Tampilkan penutup nadir” | Badge “VIRTour360” di bawah kanvas | ✅ | `RightPanel.tsx:248-253`; `TourViewer.tsx:214-218` |
| **Quick Fix** | 4 preset: natural, warm, cool, mono (dusk disembunyikan) | Menimpa brightness/contrast/saturate/hue/grayscale/sepia | ✅ | `RightPanel.tsx:255-266`; `lib/effects.ts:42-48` |
| **Custom Fix** | Slider Brightness 50–150%, Contrast 50–150%, Saturation 0–200% | CSS `filter` kanvas | ✅ | `RightPanel.tsx:268-274`; `lib/effects.ts:29-40` |
| **Staging Day To Dusk** | Tombol **Terapkan senja** | Preset `dusk` | ✅ | `RightPanel.tsx:276-279` |
| **Filter Processing** | Slider Hue −180…180°, Grayscale 0–100%, Sepia 0–100% | CSS `filter` | ✅ | `RightPanel.tsx:281-287` |
| **Sun light** | Slider Brightness + tombol **Hangat / Dingin** + **Reset semua efek** | Preset warna; reset = hapus override efek scene | ✅ | `RightPanel.tsx:289-298` |
| **Kualitas gambar** | `<select>` Standard / High / Original | `imageQuality` **global** (bukan per scene), teks “Sama seperti Panoee” | ✅ `virtour360.imageQuality` | `RightPanel.tsx:300-318`; `AppContext.tsx:245-251` |
| **View** | Teks statis `Limit view -90/90/-180/180`, `Zoom limit 60/150` | **Tidak bisa diubah**; angkanya juga tidak sinkron dengan implementasi (lihat §10) | — | `RightPanel.tsx:320-331` |

Efek diterapkan dengan `effectsToCss()` ke `.psv-canvas-container` dan `sphereCorrection.roll` ke viewer; reset efek menghapus entri `effectsByScene[sceneId]` (`AppContext.tsx:789-804`).

### 4.2 Tab Hotspot — editor paling lengkap

`src/components/layout/RightPanel.tsx:335-631`

**Tombol Tambah hotspot** (`RightPanel.tsx:337-339`) memanggil `startPlacement("info")` — masuk mode klik-di-kanvas, bukan langsung menaruh di tengah.

Saat hotspot dipilih (klik marker di kanvas, atau baris daftar), editor menampilkan (`RightPanel.tsx:341-590`):

| Grup | Kontrol | Detail | Ref |
|---|---|---|---|
| Header | Badge tipe (amber/biru), **Trash2** hapus, **X** tutup | `onRemoveHotspot` + clear seleksi | `RightPanel.tsx:343-354` |
| Identitas | `<select>` **Jenis hotspot**: Info / Karya / Pindah ke layer / Tautan | `updateHotspot({type})` langsung | `RightPanel.tsx:356-368` |
| **Point setup** | Slider **Ukuran 1–15**, **Opacity 10–100%**, **Rotasi −360…360°**; `<select>` **Efek** (normal, pulse, blink, spin, bounce, rotate, none); **Bentuk** (circle, square, diamond, star, hexagon, triangle, heart); **Ikon** (point, info, image, video, sound, link, product, star, heart); color picker **Warna marker**; checkbox **Tampilkan label** & **Label saat disorot saja** | Setiap perubahan mengirim `style: {...defaultHotspotStyle, ...style, field: value}` — artinya field lain yang belum di-set ikut nilai default | `RightPanel.tsx:370-505`; `types/tour.ts:8-39`; `styles/theme.css:79-198` |
| Navigasi | Tombol **Set ke layer berikutnya** (hanya tipe scene, `scenes.length > 1`) | `targetSceneId = scenes[(index+1) % length]` | `RightPanel.tsx:507-518` |
| Konten | Input **Judul**, textarea **Deskripsi** (3 baris); input **URL tautan** (tipe link); `<select>` **Scene tujuan** (tipe scene) | Judul/deskripsi/URL masuk state lokal `title/description/href`, baru tersimpan saat tombol **Simpan perubahan** ditekan. Tipe/style/target tersimpan instan. | `RightPanel.tsx:146-170,520-561,568` |
| Posisi | Teks `yaw <n>` / `pitch <n>` | **Read-only** — posisi hanya diubah lewat klik/drag di kanvas | `RightPanel.tsx:563-566` |
| Aksi lanjutan | **Kunjungi scene** (tipe scene + target) → `onGoToScene`; **Buka tautan** (tipe link + href) → `window.open` | | `RightPanel.tsx:572-589` |
| Daftar | Semua hotspot scene: dot amber (info/project/link) atau biru + panah (scene), judul, yaw, trash. Baris tipe **scene** langsung memindahkan scene; baris lain memilih marker & kamera `animate()` ke hotspot. | | `RightPanel.tsx:601-629`; `useTourViewer.ts:580-585` |
| Empty state | Lingkaran pink + petunjuk “Pilih hotspot pada panorama…” | | `RightPanel.tsx:592-599` |

**Rendering marker** (`useTourViewer.ts:42-63`): HTML marker berisi `.hs-marker > .hs-dot[+hs-effect][+hs-shape]`, ikon SVG inline (10 varian), label opsional, tooltip judul, atribut `data-hs-id` untuk drag, ukuran `14 + size*2.4` px, opacity `style.opacity/100`, rotasi CSS. Hotspot tipe `scene` **tidak** dirender sebagai marker: diubah jadi link navigasi `VirtualTourPlugin` (`lib/sceneGraph.ts:3-13`).

### 4.3 Tab Location

`RightPanel.tsx:633-650`: peta radial statis + `MapPin`, `profile.location` (= “Jakarta, Indonesia”), email & website dari `src/data/profile.ts:8-9`, dan catatan eksplisit: “Lokasi bersifat informasi profil; tidak ada geotagging nyata pada panorama.” **Tidak ada editor lokasi.**

---

## 5. Kanvas editor: penempatan & drag hotspot

### 5.1 Penempatan (klik → yaw/pitch)

Alur di `useTourViewer.ts`:

1. `handleTool("pin")` → `tour.startPlacement("info")`; `draw` → `startPlacement("project")`; toolbar bawah → `pickHotspot(label)` memetakan 9 label Panoee ke `(type, icon)` lalu `startPlacement(type, icon)` (`App.tsx:160-176,197-212`).
2. `startPlacement` menyimpan tipe di ref + `setPlacementType` → kursor crosshair & banner “Klik pada panorama…” (`useTourViewer.ts:567-578`; `TourViewer.tsx:110,152-160`).
3. Effect `placementType` membuat **HUD reticle** `.hs-hud` di dalam kanvas; `pointermove` mengubah label `yaw X° · pitch Y°` via `viewerCoordsToSphericalCoords` dan `requestAnimationFrame` (`useTourViewer.ts:239-313`; CSS `styles/theme.css:111-152`).
4. `pointerup` di seluruh window → konversi koordinat ke derajat; bila konversi gagal (klik di luar bola) dipakai fallback `yaw = kamera.yaw + dx*180`, `pitch = clamp(kamera.pitch - dy*90, -90, 90)` → penempatan tetap 360° penuh (`useTourViewer.ts:277-303`).
5. `placeHotspot()` membuat id `hs-<Date.now()>-<random>`, `yaw/pitch` dibulatkan, judul default per tipe (`Info baru`, `Area proyek`, `Tautan baru`, `Navigasi baru`), deskripsi default, style default + ikon terpilih → `onAddHotspot` → `addHotspot` di context → hotspot langsung terseleksi di inspector (`useTourViewer.ts:464-490`).
6. Handler `viewer.click` juga ada sebagai cadangan dengan `placementHandledRef` agar tidak dobel (`useTourViewer.ts:202-214`).

Bukti produksi (sekunder): klik pada `y = 15%` menghasilkan `yaw 50°, pitch +24°`; reticle & label ter-update; klik di luar bola tetap menambah titik (`docs/QA.md:57-73`).

### 5.2 Drag marker

`useTourViewer.ts:315-407`:
- `pointerdown` capture pada elemen `[data-hs-id]` → `draggingId`, buat ghost `.hs-drag-ghost`.
- `pointermove` → konversi koordinat, `markers.updateMarker(markerConfig({...spot, ...next}))` **langsung** (tanpa tunggu React), ghost digeser via `translate3d` + rAF.
- `pointerup` / `pointercancel` → `onMoveHotspot(sceneId, id, yaw, pitch)` → `updateHotspot` → commit history + localStorage.
- QA produksi: `hs-process` berpindah `yaw −40°/pitch −6° → yaw 126°/pitch 48°` (`docs/QA.md:63-69`).

### 5.3 Preview real-time & kamera

| Aksi | Fungsi hook | Ref |
|---|---|---|
| Reset tampilan | `resetView()` → `viewer.rotate(initialView.yaw/pitch)` + `zoom(initialView.zoom)` | `useTourViewer.ts:499-503` |
| Putar ke yaw (mini-map) | `rotateTo(yaw)` mempertahankan pitch | `useTourViewer.ts:505-510` |
| Zoom ± | `zoomBy(delta)` dengan clamp **20…100** | `useTourViewer.ts:512-518` |
| Auto-rotate | `AutorotatePlugin.start/stop`, pitch `5deg`, speed `2rpm` | `useTourViewer.ts:142,520-530` |
| Kompas / gyro | `CompassPlugin.show/hide`, `GyroscopePlugin.start/stop` | `useTourViewer.ts:539-558` |
| Kualitas | `hemat/standar/tinggi` → `minFov` 65/30/15 + zoom 45/70/100 | `useTourViewer.ts:16-22,532-537` |
| Pilih hotspot dari daftar | `animate({yaw, pitch, speed: 600})` | `useTourViewer.ts:580-585` |
| Thumbnail dari panorama aktif | `currentThumbnailUrl()` → scene.panorama | `useTourViewer.ts:589-592` |

**Preview** (`preview=true`): seluruh panel disembunyikan, kanvas `inset {left:0,right:0}`, tombol “Keluar pratinjau” muncul (`App.tsx:223-224,325,365-367,382`; `TourViewer.tsx:162-169`). Tidak ada perubahan data — murni tampilan.

---

## 6. Toolbar bawah viewer & hotkey

`src/components/viewer/BottomToolbar.tsx:38-125` (pill hitam blur di bawah tengah)

| Tombol | Aksi | Ref |
|---|---|---|
| Badge sudut/zoom `yaw pitch zoom` + ikon Eye | Klik = toggle auto-rotate (aktif: kuning) | `BottomToolbar.tsx:41-51` |
| **+ Hotspot** | Buka picker 9 jenis: Point, Chevron, Image, Article, Video, Sound, Link, Compact, Product → `onPickHotspot(label)` → mode penempatan | `BottomToolbar.tsx:36,55-85`; `App.tsx:160-176` |
| **Media** | **Menyesatkan**: membuka input file audio (`audioInputRef.click()`), bukan library media | `BottomToolbar.tsx:86-89`; `App.tsx:379` |
| **Polygon** (hidden di <md) | Juga `startPlacement("project")` — **bukan polygon sungguhan** | `BottomToolbar.tsx:90-93`; `App.tsx:378` |
| **− / +** (lg only) | Zoom ±6 derajat (hotkey ±6 juga) | `BottomToolbar.tsx:97-104`; `App.tsx:190-191` |
| **Default view** | Kamera kembali ke `initialView` tersimpan — **tidak menyimpan sudut saat ini** | `BottomToolbar.tsx:106-113`; `useTourViewer.ts:499-503` |
| **Maximize2** | Fullscreen element `AppShell` | `BottomToolbar.tsx:115-122`; `useFullscreen.ts:3-20` |

**Hotkey** (`src/hooks/useHotkeys.ts:12-44`, dipasang di `App.tsx:186-193`):

| Tombol | Aksi |
|---|---|
| `ArrowLeft` / `ArrowRight` | Scene sebelumnya / berikutnya (wrap modulo) |
| `R` / `r` | Reset ke `initialView` |
| `+` / `=` , `-` | Zoom in/out |
| `F` / `f` | Toggle fullscreen |

Hotkey **diabaikan** bila target adalah `INPUT`, `TEXTAREA`, atau `SELECT` (`useHotkeys.ts:15-16`).

**Mode edit vs preview**: di mode edit semua tool aktif; di preview tool bar masih tampil di kanvas namun panel samping/top bar hilang, dan tombol keluar pratinjau mengembalikan ke edit. TopBar tool “select”/“cursor” keduanya hanya memanggil `stopPlacement()` — tidak ada perbedaan fungsional (`App.tsx:209-211`).

---

## 7. Media management

| Operasi | UI | Implementasi | Persistensi | Ref |
|---|---|---|---|---|
| Upload panorama baru | `UploadModal`: nama scene (opsional), drop area `image/*` dengan pratinjau blob, tombol **Unggah & tambahkan scene**; daftar **Panorama Anda (n)** + trash per item | `addPanorama(name, file)` → id `pano-*`; `savePanorama` ke IndexedDB `virtour360/panoramas`; bila remote → `uploadPanoramaFile` ke Supabase Storage `panoramas` (gagal → fallback lokal + toast) | IndexedDB + optional Supabase Storage | `UploadModal.tsx:45-72,107-163`; `AppContext.tsx:549-569`; `lib/db.ts:59-87`; `lib/remoteStore.ts:87-105` |
| Ganti panorama scene | Inspector **Replace** → `UploadModal` mode ganti | `replaceSceneImage(sceneId, file)` → hapus asset gambar lama, simpan asset baru `kind:"image"`, hapus media override, `assetMedia[sceneId] = {panorama, thumbnail}` | IndexedDB `assets` + URL blob | `RightPanel.tsx:213-215`; `App.tsx:400`; `AppContext.tsx:705-735` |
| Pilih dari pustaka scene lain | Inspector **Select post** → `MediaPickerModal` grid 2–3 kolom, thumbnail + nama; **Pulihkan asli** | `setMediaFromScene(targetId, source)` menyalin `panorama` & `thumbnail` scene lain sementara; `removeSceneMediaOverride` menghapus override & asset image | `virtour360.media` (hanya URL non-`blob:` yang dipersist) | `MediaPickerModal.tsx:9-69`; `AppContext.tsx:202-212,664-703` |
| Reorder media | ❌ | Tidak ada. Yang bisa diurutkan hanya **scene** (lihat §3.2), bukan media. | — | — |
| Hapus media | ✅ | Trash di `UploadModal` (panorama), trash scene upload di sidebar, X pada audio | `removePanorama`, `removeSceneAudio` | `AppContext.tsx:571-607,761-775` |
| Upload audio scene | Inspector **Upload file .mp3** / toolbar **Media** → `<input type=file accept="audio/*">` | `setSceneAudio` → asset `kind:"audio"`, `audioByScene[id] = {url,name}`; player di `TourViewer` | IndexedDB `assets` (URL blob dibuat ulang saat load) | `App.tsx:401,421-433`; `AppContext.tsx:737-759`; `TourViewer.tsx:171-185` |
| Kualitas gambar | Inspector select + viewer popover | Dua sistem berbeda: `imageQuality` (standard/high/original) **tersimpan**; `quality` (hemat/standar/tinggi) **tidak tersimpan** | ⚠️ | `RightPanel.tsx:300-318`; `useTourViewer.ts:16-22` |

> Tidak ada folder/album media, upload drag-and-drop, multiple-file select, indikator rasio 2:1, atau "Edit with AI" seperti Panoee (`docs/RESEARCH.md:86-95`).

---

## 8. Dashboard (`#/dashboard`)

`src/views/DashboardView.tsx:112-335` — juga diproteksi login (`Root.tsx:31,41-44`).

### 8.1 Header & navigasi
- Logo pink `Logo360` → `navigate("studio")` (`DashboardView.tsx:21-27`).
- Nav: **Project** (toast “Anda sedang di halaman Project.”), **Media** (`setUploadOpen(true)`), **Portofolio** (`navigate("portfolio")`) (`DashboardView.tsx:152-167`).
- Kanan: pill **Portofolio Pribadi** (toast), **Changelog** (toast), tombol pink **+ New Project** (buka upload), avatar inisial → dropdown Keluar / Masuk–Daftar (`DashboardView.tsx:171-206`).

### 8.2 KPI strip
3 kartu: **Proyek** = `scenes.length`, **Dipublikasikan** = jumlah scene upload, **Favorit** = `favorites.length` (`DashboardView.tsx:212-225`).

### 8.3 Filter & tampilan
- Tab **live / studio** (live = hanya scene upload; studio = hasil filter) (`DashboardView.tsx:113,135,227-245`).
- Toggle **grid / list**.
- `<select>` sumber: Semua sumber / Upload saya / Scene bawaan.
- `<select>` kategori: Semua kategori / 360° / Tour (berdasar `project.tags`).
- Input cari (nama, judul, role, client, tag) + tombol X; bila kosong ada efek caret typing (`DashboardView.tsx:247-272`; `styles/theme.css:220-226`).
- Empty state + tombol **Reset filter** (`DashboardView.tsx:289-313`).

### 8.4 Kartu project
`ProjectCard` (`DashboardView.tsx:29-107`): thumbnail 132px (grid) / 64px (list), badge jumlah hotspot (MapPin), badge hijau **Published**, inisial judul + judul + role (+ year di list). Aksi: klik kartu → `openProject()` = `setActiveSceneId(id)` + `navigate("studio")`; trash **hanya untuk scene upload** → `removePanorama` + toast.

### 8.5 Status, notifikasi, aksi

| Item | Realitas |
|---|---|
| Status Published / Draft / Archived | **Hanya badge “Published” hardcode** untuk semua kartu. Tidak ada field `status` di `Scene` (`types/tour.ts:61-72`). Draft/Archived tidak pernah dirender. |
| Publish | Dilakukan dari **Studio → TopBar → Published → PublishModal**, bukan dari kartu dashboard. Mode akses Draft/Public/Password + password ada di modal, tetapi `publishPublicPayload()` mengabaikan `access`/`password` — jadi bersifat kosmetik. (`PublishModal.tsx:21-35,91-124`; `publicStore.ts:125-150`) |
| Duplicate project | ❌ Tidak ada (Panoee punya `project/duplicate-project`, `docs/RESEARCH.md:23`). |
| View public | ✅ Tombol “— View Public Profile” → `#/portfolio` (`DashboardView.tsx:242-244`). |
| Notifikasi | Toast global di `Root.tsx:58-62`; `notify()` auto-hilang setelah 2600 ms (`AppContext.tsx:277-281`). Tombol Gift, Changelog, Portofolio Pribadi hanya memicu toast. |
| Catatan bawah kanan | Card “Catatan — Portofolio untuk teman” bisa ditutup (`DashboardView.tsx:316-328`). |

Bukti produksi (sekunder): filter, grid/list, hapus/buka kartu, tab Live/Studio PASS (`docs/QA.md:9-20,44-53`).

---

## 9. State management, undo/redo, autosave, persistensi

### 9.1 AppContext — state global

`src/context/AppContext.tsx:55-113` (interface) dan `:224-260` (state). Ringkasan grup state:

- **Auth/identitas**: `user`, `guestId`, `identityKey = user ? "user:"+email : "guest:"+guestId` (`:262-265`). Pemulihan sesi dari `/api/auth` saat mount (`:283-298`).
- **Data scene**: `panoramas` (IndexedDB), `hotspotOverrides`, `mediaOverrides`, `audioByScene`, `assetMedia`, `effectsByScene`, `groups`, `sceneOrder`, `sceneGroupOverrides`, `imageQuality`, `activeSceneId`.
- **UI global**: `authOpen`, `uploadOpen`, `replaceSceneId`, `toast`, `canUndo`, `remoteReady`.
- **Modals**: `activeTool`, `settingsOpen`, `preview`, `accountOpen`, `suggestionsOpen`, `profileOpen`, `embedOpen`, `publishOpen`, `mediaPickerOpen`, `lightboxOpen`, `showMiniMap`, `showSideMenu`, `showGraph`, `publishedUid` — **semua lokal di `App.tsx:103-121`**, tidak ikut tersimpan.

`useApp()` hanyalah pembungkus `useContext(AppContext)` + guard error (`src/context/useApp.ts:5-9`).

### 9.2 Kunci localStorage

`AppContext.tsx:117-128`:

| Key | Isi | Ditulis oleh |
|---|---|---|
| `virtour360.users` | Daftar akun (mode lokal) | register/updateProfile |
| `virtour360.session` | Sesi login | login/register/restore |
| `virtour360.guestId` | ID tamu stabil | `getGuestId()` |
| `virtour360.owner` | Email pemilik workspace terakhir | `resetWorkspaceIfOwnerChanged` |
| `virtour360.hotspots` | `Record<sceneId, Hotspot[]>` | `commitHotspots` / undo |
| `virtour360.media` | Override panorama/thumbnail (blob URL dibuang) | `setMedia`, capture, replace |
| `virtour360.favorites` | `string[]` | `toggleFavorite` |
| `virtour360.effects` | `Record<sceneId, SceneEffects>` | `setSceneEffects` / reset |
| `virtour360.groups` | `string[]` | CRUD grup |
| `virtour360.sceneOrder` | `Record<sceneId, number>` | `moveScene` |
| `virtour360.sceneGroups` | `Record<sceneId, string>` | `setSceneGroup` |
| `virtour360.imageQuality` | standard/high/original | `setImageQuality` |
| `virtour360.publishedUid` | UID publish terakhir | `App.tsx:445` |

`readJSON`/`persist` membungkus `JSON.parse`/`setItem` dengan try-catch agar gagal tanpa crash (`AppContext.tsx:130-145`). `persistableMedia()` membuang URL `blob:` supaya tidak tersimpan dan menampilkan gambar rusak setelah reload (`:202-212`).

**IndexedDB** (`src/lib/db.ts:21-127`): database `virtour360` v2, store `panoramas` (file asli) & `assets` (audio/gambar pengganti). Object URL dibuat ulang dari blob saat mount (`:300-319`). Saat pemilik workspace berganti, localStorage keys di atas **dan** kedua store IndexedDB dibersihkan (`:177-188`).

### 9.3 Undo / redo

- `historyRef` menyimpan **maksimal 20 snapshots** hotspot: `historyRef.current = [...slice(-19), hotspotsRef.current]` (`AppContext.tsx:611-617`).
- `canUndo` true setelah commit pertama; tombol Undo di TopBar aktif.
- `undoEdit()` → `pop()`, `setHotspotOverrides`, persist, `notify("Perubahan terakhir dibatalkan.")` (`AppContext.tsx:649-660`).
- **Yang tercakup undo**: tambah/edit/hapus hotspot, termasuk drag dan setiap perubahan style. **Yang tidak**: scene, grup, urutan, efek, media, audio, kualitas.
- **Redo tidak ada** — tidak ada `redo`, `historyIndex`, atau tombol redo di seluruh source.
- Karena slider style memanggil `updateHotspot` pada setiap `onChange`, satu kali geser slider bisa menambah banyak entri history.

### 9.4 Autosave & sinkronisasi backend

- **Lokal**: hampir semua aksi langsung `persist(...)` ke localStorage; blob langsung ke IndexedDB. Tidak ada tombol Save.
- **Remote**: bila `isRemote` (server mode `VITE_USE_SERVER_DB=1` atau Supabase anon key ada), state dimuat sekali per `identityKey` (`AppContext.tsx:323-364`) lalu ditulis ulang dengan **debounce 800 ms** via `saveRemoteState` (`:366-392`). Payload: users, hotspots, favorites, media, effects, groups, sceneGroups, sceneOrder, imageQuality, panoramas (metadata saja di server mode).
- **Server**: `api/state.js` memaksa `stateId = "user:"+email` dari token JWT/HMAC bila login, sehingga state privat tidak bisa dibaca user lain; fallback `guest:<id>` / `virtour360-shared` untuk tanpa sesi (`api/state.js:35-62`).
- **Mode klien Supabase**: `virtour_state` + Storage bucket `panoramas`; secret key ditolak bila masuk env `VITE_*` (`lib/supabase.ts:3-32`).
- **Publish**: snapshot seluruh `scenes` + profil + `folders` (dari `buildPublicFolders`, dikelompokkan per `project.title`) dikirim ke `POST /api/public`, disimpan sebagai `virtour:pub:<uid>`; publik membaca `GET /api/public?id=<uid>` tanpa login (`PublishModal.tsx:44-67`; `publicStore.ts:82-150`; `api/public.js:3-54`). Setelah publish, UID juga disimpan lokal untuk menu “Salin link publish”.

QA produksi mengonfirmasi `POST /api/state` + `GET` ulang hotspot tersimpan, env server aktif, grup & kualitas bertahan setelah reload (`docs/QA.md:23-35,44-53`).

---

## 10. Fitur lokal/placeholder vs benar-benar tersimpan

### 10.1 Matrix status implementasi

| Fitur | Status | Keterangan / bukti kode |
|---|---|---|
| Scene bawaan (3) + upload | ✅ Nyata & tersimpan | `data/scenes.ts:6-119`; `AppContext.tsx:875-902` |
| Grup scene (CRUD + pindah) | ✅ Tersimpan lokal + remote | `AppContext.tsx:808-857`; QA `docs/QA.md:44-53` |
| Urutan scene ↑/↓ | ✅ Tersimpan | `AppContext.tsx:859-866` (offset, bukan swap) |
| Hotspot CRUD + style + position | ✅ Tersimpan + undo | `AppContext.tsx:611-660` |
| Drag marker real-time | ✅ Tersimpan saat `pointerup` | `useTourViewer.ts:315-407` |
| Efek scene (roll/nadir/filter/preset) | ✅ Tersimpan + diterapkan kanvas | `RightPanel.tsx:238-298`; `useTourViewer.ts:427-437` |
| Audio & gambar scene | ✅ Tersimpan (Blob) | `lib/db.ts:94-127` |
| Kualitas gambar Standard/High/Original | ✅ Tersimpan | `AppContext.tsx:245-251` |
| Publish + UID + QR + embed | ✅ Tersimpan ke `virtour:pub:<uid>` | `publicStore.ts:125-150` |
| Auth register/login/profile/password | ✅ Server (mode produksi) atau Supabase client (mode aktif) | `AppContext.tsx`; `api/auth.js`; `src/lib/authRemote.ts` |
| Kualitas viewer hemat/standar/tinggi | ⚠️ Lokal (state hook) | `useTourViewer.ts:110,532-537` — hilang setelah reload |
| Mini-map / side menu / tour graph / preview | ⚠️ Lokal (state `App.tsx`) | `App.tsx:109,114-116` |
| 3 Suggestion | ⚠️ Hardcode | `TopBar.tsx:112`; aksinya nyata (`App.tsx:242-254`) |
| Badge “Published” di dashboard | ⚠️ Hardcode | `DashboardView.tsx:53-55,83-85` |
| Akses Draft/Public/Password di publish | ⚠️ Kosmetik | `PublishModal.tsx:21-35,91-124`; diabaikan `publishPublicPayload` |
| Lokasi / geotagging | ⚠️ Statis | `RightPanel.tsx:633-650`; teks mengakui tidak ada geotagging |
| Nama & ID scene di inspector | ⚠️ Read-only | `RightPanel.tsx:48-59,199-200` |
| Limit view / zoom limit | ⚠️ Teks statis & tidak akurat | `RightPanel.tsx:320-331` vs `useTourViewer.ts:18-22,515` |
| Rename/duplikat scene, breadcrumb | ❌ | Tidak ada kode |
| `initialView` / FOV editor | ❌ | Dibaca di `useTourViewer.ts:171-172,499-503`; tidak pernah ditulis dari UI. Tombol “Default view” hanya **memulihkan**, bukan **menyimpan** seperti Panoee (`docs/RESEARCH.md:100`) |
| Polygon hotspot | ❌ | Tombol “Polygon” & “Gambar area” hanya `startPlacement("project")`; `docs/RESEARCH.md:79-81` mengakui baru sebatas tombol |
| Tema / warna UI editor | ❌ | Token statis `config/theme.ts`, `styles/theme.css` |
| Reorder media / folder / album | ❌ | — |
| Duplicate project | ❌ | — |
| AI Edit, floorplan, domain, analitik | ❌ | Dihapus sengaja (`docs/CHANGELOG.md:61-69`; `docs/RESEARCH.md:144-148`) |

### 10.2 Catatan README yang sudah usang

`README.md:172` masih menulis “Tambah hotspot — Tombol '+ Hotspot' (mode lokal, belum tersimpan)”. Faktanya hotspot kini tersimpan ke `virtour360.hotspots` dan tersinkron (`AppContext.tsx:611-617,369-389`).

### 10.3 Observasi browser

Tidak ada observasi interaktif live yang dapat dicatat: tool browser mengembalikan `[browser.disconnected] — No desktop browser is connected to this session` dua kali (pembukaan tab portfolio & `tabs.list`). Dengan demikian seluruh deskripsi di atas bersumber dari kode statis; perilaku produksi yang dikutip berasal dari `docs/QA.md` dan `docs/CHANGELOG.md` di repo yang sama, bukan dari klik langsung sesi ini.

---

## 11. Alur kerja tipikal (end-to-end)

1. **Masuk**: `#/studio` → gate login → `AuthModal` → otomatis `#/studio` (`Root.tsx:41-44`; `AuthModal.tsx:34-48`).
2. **Tambah scene**: sidebar **Create / Add Scene** → pilih JPG equirectangular 2:1 → **Unggah & tambahkan scene** → scene `pano-*` muncul di grup `Uncategory` (`UploadModal.tsx:45-72`).
3. **Atur daftar**: toggle List → ↑/↓ untuk urutan, `<select>` untuk grup, atau buat grup baru; grid untuk memilih scene aktif (`LeftSidebar.tsx:205-302`).
4. **Posisikan kamera awal (batasan)**: putar panorama lalu **Default view** hanya mengembalikan ke `initialView` yang sudah ada; nilai baru **tidak bisa disimpan** dari UI (§10.1).
5. **Taruh hotspot**: toolbar atas ikon MapPin atau toolbar bawah **+ Hotspot** → pilih jenis (9 opsi) → klik panorama → HUD yaw/pitch muncul → hotspot dibuat & langsung dipilih (`useTourViewer.ts:239-303,464-490`).
6. **Edit hotspot**: tab **Hotspot** → ubah jenis, Point setup, judul, deskripsi, URL/target → **Simpan perubahan**. Geser marker langsung di kanvas untuk ubah yaw/pitch. Salah langkah → tombol Undo di TopBar (`RightPanel.tsx:341-590`; `AppContext.tsx:649-660`).
7. **Rapikan tampilan**: tab Scene → Level this scene, Quick Fix / Custom Fix, nadir, kualitas gambar; SettingsPopover → kompas/gyro/mini-map/side menu/graph (`RightPanel.tsx:238-318`; `App.tsx:39-101`).
8. **Media tambahan**: **Replace** panorama, **Select post** meminjam media scene lain, **Upload file .mp3** untuk audio, **Camera** untuk set thumbnail (`RightPanel.tsx:202-234`).
9. **Preview**: tombol Play di TopBar → kanvas penuh tanpa panel → **Keluar pratinjau** (`App.tsx:235,366-367`; `TourViewer.tsx:162-169`).
10. **Publish**: tombol **Published** → pilih akses (kosmetik) → **Publish sekarang** → link `#/p/<uid>` + QR + kode iframe; UID tersimpan di localStorage & menu akun (`PublishModal.tsx:44-67,134-169`; `App.tsx:443-447`).
11. **Dashboard / portofolio**: avatar → Buka Dashboard untuk filter & kartu project; “View Public Profile” → `#/portfolio` (`App.tsx:272-275`; `DashboardView.tsx:242-244`).

---

## 12. Indeks referensi file/baris

| File | Baris | Topik |
|---|---|---|
| `src/Root.tsx` | 28-55 | Router + gating studio/dashboard + toast global |
| `src/lib/navigation.ts` | 1-29 | Hash route & helper navigasi |
| `src/components/layout/AppShell.tsx` | 3-17 | Kontainer editor |
| `src/config/theme.ts` | 16-20 | 56 / 240 / 260 px |
| `src/config/tour.config.ts` | 1-12 | zoom 70, minFov 30, maxFov 100, transisi 18rpm, renderMode 3d |
| `src/App.tsx` | 39-101 | SettingsPopover |
| `src/App.tsx` | 103-219 | State lokal, hook, hotkey, tool handler |
| `src/App.tsx` | 221-323 | TopBar, saran, menu akun, LeftSidebar |
| `src/App.tsx` | 325-380 | TourViewer + semua callback |
| `src/App.tsx` | 382-451 | RightPanel, loading, audio input, modals |
| `src/components/layout/TopBar.tsx` | 14-145 | Toolbar atas & aksi global |
| `src/components/layout/LeftSidebar.tsx` | 32-306 | Sidebar scene, grup, pencarian, urutan |
| `src/components/layout/RightPanel.tsx` | 48-170 | Field read-only, ActionButton, EffectSlider, state editor |
| `src/components/layout/RightPanel.tsx` | 172-333 | Tab Scene (11 accordion) |
| `src/components/layout/RightPanel.tsx` | 335-631 | Tab Hotspot (point setup & daftar) |
| `src/components/layout/RightPanel.tsx` | 633-650 | Tab Location |
| `src/components/viewer/TourViewer.tsx` | 104-240 | Kanvas + overlay |
| `src/components/viewer/BottomToolbar.tsx` | 36-125 | Toolbar bawah + picker 9 jenis |
| `src/components/viewer/MiniMap.tsx` | 14-89 | Mini-map & seek yaw |
| `src/components/viewer/MediaPickerModal.tsx` | 9-69 | Pilih media dari scene |
| `src/hooks/useTourViewer.ts` | 16-81 | Kualitas, marker HTML, buildNodes |
| `src/hooks/useTourViewer.ts` | 94-237 | Inisialisasi PSV + plugin + event |
| `src/hooks/useTourViewer.ts` | 239-313 | HUD penempatan hotspot |
| `src/hooks/useTourViewer.ts` | 315-407 | Drag marker |
| `src/hooks/useTourViewer.ts` | 409-492 | Sinkronisasi scene, efek, placeHotspot |
| `src/hooks/useTourViewer.ts` | 492-622 | Kontrol kamera & API hook |
| `src/hooks/useHotkeys.ts` | 12-44 | Hotkey keyboard |
| `src/hooks/useFullscreen.ts` | 3-20 | Fullscreen |
| `src/context/AppContext.tsx` | 55-128 | Interface & kunci penyimpanan |
| `src/context/AppContext.tsx` | 224-392 | State, identitas, remote load/save |
| `src/context/AppContext.tsx` | 403-545 | Auth |
| `src/context/AppContext.tsx` | 549-660 | Panorama, hotspot CRUD, undo |
| `src/context/AppContext.tsx` | 664-866 | Media, audio, efek, grup, urutan |
| `src/context/AppContext.tsx` | 870-959 | Scenes memo & Provider |
| `src/context/useApp.ts` | 5-9 | Hook akses context |
| `src/types/tour.ts` | 1-83 | Hotspot, HotspotStyle, Scene, ProjectMeta |
| `src/lib/db.ts` | 21-127 | IndexedDB panoramas & assets |
| `src/lib/effects.ts` | 1-48 | SceneEffects & preset |
| `src/lib/sceneGraph.ts` | 3-17 | Link antar scene & filter marker |
| `src/lib/supabase.ts` | 3-35 | Mode remote & penolakan secret key |
| `src/lib/remoteStore.ts` | 20-105 | RemoteState & Storage panorama |
| `src/lib/publicStore.ts` | 82-150 | Folder publish & API publik |
| `src/views/DashboardView.tsx` | 21-335 | Dashboard lengkap |
| `src/components/auth/PublishModal.tsx` | 21-174 | Publish, QR, embed |
| `src/components/auth/UploadModal.tsx` | 5-167 | Upload & ganti panorama |
| `src/components/auth/AuthModal.tsx` | 6-152 | Login/register |
| `src/components/auth/LoginRequired.tsx` | 7-46 | Gate studio/dashboard |
| `src/components/auth/EmbedModal.tsx` | 6-37 | Embed portofolio |
| `src/styles/theme.css` | 79-198 | Animasi & bentuk marker hotspot |
| `src/styles/psv-overrides.css` | 1-90 | Tema viewer & arrow virtual tour |
| `api/state.js` | 25-66 | State privat per user |
| `api/public.js` | 3-54 | Payload publik per UID |
| `docs/QA.md` | 8-21, 44-76 | Verifikasi produksi (sekunder) |
| `docs/RESEARCH.md` | 31-36, 79-82, 117-148 | Reverse engineering Panoee & status |
| `docs/CHANGELOG.md` | 14-22, 61-69, 116-124 | Riwayat fitur studio |
| `README.md` | 164-172 | kontrol studio (baris 172 usang) |

---

### Penutup

Studio Virtour360 sudah mereplikasi sebagian besar **alur kerja inti Panoee** (scene → hotspot → efek → preview → publish) dengan kualitas interaksi yang tinggi pada penempatan & drag hotspot. Kesenjangan terbesar ada pada **operasi CRUD scene tingkat lanjut** (rename/duplicate/breadcrumb), **editor tampilan awal/FOV**, **status proyek nyata**, dan **beberapa kontrol yang masih kosmetik/read-only** sebagaimana dirinci di §10. Semua perubahan yang tersimpan memakai kombinasi localStorage + IndexedDB, dengan sinkronisasi Supabase opsional yang aktif di produksi.
