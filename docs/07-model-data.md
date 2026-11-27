# 08. Model Data & Konten — Virtour360 (Replika Panoee)

> **Sumber riset:** `C:\Users\visual works\Documents\rea\virtour360`
> **Live target:** https://virtour360real.vercel.app/#/p/1x2m270p3j
> **Referensi benchmark:** https://studio.panoee.net/ , https://panoee.com
> **Verifikasi data live:** `GET https://virtour360real.vercel.app/api/public?id=1x2m270p3j` (diakses 2026-11-23, payload lengkap dikutip di §5.4)
> **Status:** Dokumentasi model data berdasarkan pembacaan seluruh file sumber; tidak ada perubahan source code.

---

## Daftar Isi

1. [Ringkasan Arsitektur Data](#1-ringkasan-arsitektur-data)
2. [Schema TypeScript Lengkap & Data Dictionary](#2-schema-typescript-lengkap--data-dictionary)
3. [Tipe Hotspot, Gaya & Ikon](#3-tipe-hotspot-gaya--ikon)
4. [Graph Scene & Navigasi](#4-graph-scene--navigasi)
5. [Data Seed/Contoh & Sumber Halaman `/p/1x2m270p3j`](#5-data-seedcontoh--sumber-halaman-p1x2m270p3j)
6. [Konfigurasi Tour & Theme](#6-konfigurasi-tour--theme)
7. [Database Supabase (Schema, RLS, Storage)](#7-database-supabase-schema-rls-storage)
8. [Utilitas Format, Efek & Transformasi](#8-utilitas-format-efek--transformasi)
9. [Data Lokal vs Remote & Migrasi/Seed](#9-data-lokal-vs-remote--migrasiseed)
10. [Catatan Ketidaksesuaian & Batasan](#10-catatan-ketidaksesuaian--batasan)
11. [Referensi File/Baris](#11-referensi-filebaris)

---

## 1. Ringkasan Arsitektur Data

Virtour360 menyimpan model data dalam **tiga lapisan** yang saling melengkapi:

| Lapisan | Lokasi | Fungsi | Sifat |
|---|---|---|---|
| **Statis (hardcoded)** | `src/types/tour.ts`, `src/data/*.ts`, `src/config/*.ts` | Definisi tipe, 3 scene awal, profil, kreator contoh, contoh panorama, tema | Build-time, termutakhir lewat edit file |
| **Lokal (browser)** | `localStorage` + IndexedDB (`src/lib/db.ts`) | Override hotspot, media, audio, efek, grup, urutan scene, favorit, kualitas; Blob panorama & aset | Runtime, per-identitas (user/guest) |
| **Remote (Supabase)** | `supabase/schema.sql`, `src/lib/remoteStore.ts`, `api/*.js` | State privat per user/tamu + payload publish publik | Opsional (mode server/anon Supabase) |

Alur paling penting: **publish** mengubah `Scene[]` menjadi `PublicPayload` (profil + scenes + folders + creators + uid) lalu disimpan ke tabel `virtour_state` dengan id `virtour:pub:<uid>` melalui `/api/public`. Halaman `#/p/<uid>` membaca payload itu tanpa login.

```
[src/data/scenes.ts] ──► AppContext (override lokal) ──► Scene[]
                                                         │
                                          publishPublicPayload()
                                                         ▼
                              PublicPayload { profile, scenes, folders,
                                              creators, uid, updatedAt }
                                                         │ POST /api/public
                                                         ▼
                    Supabase virtour_state  id = "virtour:pub:1x2m270p3j"
                                                         │ GET /api/public?id=...
                                                         ▼
                                   PublicPortfolioView  #/p/1x2m270p3j
```

---

## 2. Schema TypeScript Lengkap & Data Dictionary

Semua tipe inti didefinisikan di **`src/types/tour.ts`** (83 baris). Tipe pendukung tersebar di `src/lib/*` dan `src/data/*`.

### 2.1 `HotspotType` — `src/types/tour.ts:1`

```ts
export type HotspotType = "info" | "project" | "link" | "scene"
```

| Enum value | Label di UI editor | Arti / perilaku | Field khusus |
|---|---|---|---|
| `info` | Info | Marker informasi; klik membuka panel detail | `description` |
| `project` | Karya | Marker area karya/portofolio (bucket untuk "Product"/"Compact") | `description` |
| `link` | Tautan | Klik membuka URL eksternal di tab baru | `href` (wajib secara praktis) |
| `scene` | Pindah ke layer | Navigasi antar-scene; dirender sbg **link** PSV, bukan marker | `targetSceneId` (wajib secara praktis) |

> **Catatan penting:** meski enum `HotspotType` hanya 4 nilai, **picker hotspot ala Panoee menyediakan 9 label** (`Point, Chevron, Image, Article, Video, Sound, Link, Compact, Product`) yang dipetakan ke 4 tipe + ikon berbeda di `src/App.tsx:160-176` (lihat §3.3).

### 2.2 `HotspotShape` & `HotspotIcon` — `src/types/tour.ts:4-5`

```ts
export type HotspotShape = "circle" | "square" | "diamond" | "star" | "hexagon" | "triangle" | "heart"
export type HotspotIcon  = "point" | "info" | "link" | "image" | "video" | "sound" | "product" | "star" | "heart"
```

| `HotspotShape` | Label UI (`RightPanel.tsx:442-448`) | Catatan |
|---|---|---|
| `circle` | Lingkaran | Default; tidak memakai class `hs-shape-*` |
| `square` | Kotak | `clip-path` CSS |
| `diamond` | Belah ketupat | `clip-path` CSS |
| `star` | Bintang | `clip-path` CSS |
| `hexagon` | Segi enam | `clip-path` CSS |
| `triangle` | Segitiga | `clip-path` CSS |
| `heart` | Hati | `clip-path` CSS |

| `HotspotIcon` | SVG (lucide-like) di `useTourViewer.ts:29-40` | Label UI |
|---|---|---|
| `point` | pin lokasi + lingkaran | Point |
| `info` | lingkaran "i" | Info |
| `link` | rantai | Tautan |
| `image` | gambar | Gambar |
| `video` | play rect | Video |
| `sound` | musik | Audio |
| `product` | kubus | Produk |
| `star` | bintang | Bintang |
| `heart` | hati | Hati |

> Terdapat ikon tambahan internal `project` (4 kotak) di `ICONS` (`useTourViewer.ts:32`) yang **tidak termasuk** union `HotspotIcon`, melainkan dipakai sebagai fallback `ICONS[spot.type]` untuk tipe `project`.

### 2.3 `HotspotStyle` — `src/types/tour.ts:8-39`

| Field | Tipe | Wajib | Rentang / Enum | Default | Keterangan (baris) |
|---|---|---|---|---|---|
| `size` | `number` | ✅ | 1–15 (slider UI) | `3` | Ukuran marker; px = `14 + size*2.4` (`:10`, `RightPanel.tsx:374-386`) |
| `effect` | `"normal"\|"pulse"\|"blink"\|"spin"\|"bounce"\|"rotate"\|"none"` | ✅ | 7 nilai | `"normal"` | Efek animasi CSS (`:12`, `RightPanel.tsx:401-418`) |
| `color` | `string` (hex) | ✅ | `#RRGGBB` | `"#facc15"` | Warna marker (`:14`, `RightPanel.tsx:472-482`) |
| `showLabel` | `boolean` | ✅ | — | `false` | Tampilkan label di bawah marker (`:16`) |
| `labelOnHover` | `boolean` | ✅ | — | `false` | Label hanya saat hover (`:18`) |
| `opacity` | `number` | ✅ | 10–100 | `100` | Dibagi 100 saat render CSS (`:20`, `useTourViewer.ts:56`) |
| `rotate` | `number` | ✅ | −360…360 (derajat) | `0` | Rotasi marker via `transform: rotate()` (`:22`, `useTourViewer.ts:57`) |
| `shape` | `HotspotShape` | ✅ | 7 nilai | `"circle"` | Bentuk marker (`:24`) |
| `icon` | `HotspotIcon` | ✅ | 9 nilai | `"point"` | Ikon marker (`:26`) |

**`defaultHotspotStyle`** — `src/types/tour.ts:29-39`:

```ts
export const defaultHotspotStyle: HotspotStyle = {
  size: 3, effect: "normal", color: "#facc15",
  showLabel: false, labelOnHover: false,
  opacity: 100, rotate: 0, shape: "circle", icon: "point",
}
```

### 2.4 `Hotspot` — `src/types/tour.ts:41-51`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id` | `string` | ✅ | Unik per scene. Generated: `hs-${Date.now()}-${random5}` (`useTourViewer.ts:474`) atau `door-${sceneId}` / `next-c…` di data contoh |
| `type` | `HotspotType` | ✅ | 4 nilai (lihat §2.1) |
| `yaw` | `number` | ✅ | Derajat horizontal (−180…180); disebut `ath` di Panoee/krpano |
| `pitch` | `number` | ✅ | Derajat vertikal (−90…90); disebut `atv` di Panoee/krpano |
| `title` | `string` | ✅ | Judul marker + tooltip + label |
| `description?` | `string` | ❌ | Konten panel detail |
| `href?` | `string` | ❌ | URL eksternal, dipakai jika `type === "link"` |
| `targetSceneId?` | `string` | ❌ | Id scene tujuan, dipakai jika `type === "scene"` |
| `style?` | `HotspotStyle` | ❌ | Di-merge dengan `defaultHotspotStyle` saat render |

Contoh objek (dari scene `atrium`, `src/data/scenes.ts:16-32`):

```json
{
  "id": "hs-about",
  "type": "info",
  "yaw": 18,
  "pitch": -4,
  "title": "Tentang karya ini",
  "description": "Panorama 360° pertama dalam seri galeri..."
}
```
```json
{
  "id": "hs-next",
  "type": "scene",
  "yaw": -95,
  "pitch": 2,
  "title": "Menuju Studio",
  "description": "Lanjut ke ruang kerja kreatif",
  "targetSceneId": "studio"
}
```

Contoh hotspot dengan style kustom (`src/data/examples.ts:117-131`):

```json
{
  "id": "door-atrium",
  "type": "info",
  "yaw": 0,
  "pitch": 0,
  "title": "Pintu → Studio — Creative Room",
  "description": "Klik pintu untuk masuk ke ruang berikutnya.",
  "targetSceneId": "studio",
  "style": {
    "size": 4, "effect": "normal", "color": "#0ea5e9",
    "showLabel": true, "labelOnHover": false, "opacity": 100,
    "rotate": 0, "shape": "circle", "icon": "link"
  }
}
```

> Menariknya, hotspot `door-*` bertipe `info` tetapi tetap memiliki `targetSceneId`. Viewer **Studio** hanya menavigasi jika `spot.targetSceneId` ada (`useTourViewer.ts:185-188`), sehingga ini tetap berfungsi; viewer **publik** (`PublicViewerModal.tsx:55-70`) hanya menjadikan hotspot `type === "scene"` sebagai link dan menaruh `targetSceneId` di `marker.data` untuk fallback klik.

### 2.5 `ProjectMeta` — `src/types/tour.ts:53-59`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `title` | `string` | ✅ | Nama project; dipakai sbg nama folder hasil publish (`publicStore.ts:86`) |
| `role` | `string` | ✅ | Peran/kategori, tampil di Dashboard (`DashboardView.tsx:48,93`) |
| `client` | `string` | ✅ | Nama klien |
| `year` | `string` | ✅ | Tahun (string, bukan number) |
| `tags` | `string[]` | ✅ | Tag; dipakai filter Dashboard `360`/`tour` (`DashboardView.tsx:127-128`) dan folder publik |

### 2.6 `Scene` — `src/types/tour.ts:61-72`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id` | `string` | ✅ | Unik; `defaultSceneId = scenes[0].id` = `"atrium"` (`scenes.ts:121`) |
| `name` | `string` | ✅ | Nama scene, tampil di sidebar/minimap/caption |
| `description` | `string` | ✅ | Deskripsi scene; jadi `description` folder jika 1 scene |
| `group` | `string` | ✅ | Nama grup scene; default `"Uncategory"` |
| `panorama` | `string` | ✅ | Path/URL equirectangular 2:1, mis. `/media/panoramas/entrance_hall.jpg` |
| `thumbnail` | `string` | ✅ | Path/URL thumbnail ±800px |
| `initialView` | `{ yaw: number; pitch: number; zoom: number }` | ✅ | Sudut pandang & zoom saat scene dimuat (`useTourViewer.ts:171-173`) |
| `hotspots` | `Hotspot[]` | ✅ | Daftar hotspot scene |
| `project` | `ProjectMeta` | ✅ | Metadata project (catatan: di `docs/PLAN.md:155` dulu direncananya opsional, implementasinya **wajib**) |
| `audio?` | `string` | ❌ | URL audio ambien; diisi dari Blob URL saat upload (`AppContext.tsx:899`) |

Contoh objek lengkap (`src/data/scenes.ts:7-41`) — lihat juga payload live di §5.4.

### 2.7 `Profile` — `src/types/tour.ts:74-83`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `name` | `string` | ✅ | Nama pemilik portofolio |
| `initials` | `string` | ✅ | Inisial (data lokal: `"aw"` huruf kecil) |
| `role` | `string` | ✅ | Peran, mis. `"Creative Developer & 360° Photographer"` |
| `location` | `string` | ✅ | Lokasi |
| `email` | `string` | ✅ | Email kontak |
| `website` | `string` | ✅ | URL situs |
| `bio` | `string` | ✅ | Biografi |
| `stats` | `{ label: string; value: string }[]` | ✅ | Statistik (Proyek/Klien/Penghargaan di data lokal) |

> **PublicProfile** (`src/lib/publicStore.ts:4-11`) adalah versi **tanpa `role` dan `stats`** untuk payload publish. Field: `name, initials, location, email, website, bio` (semua wajib). Nilainya diisi `PublishModal.tsx:46-53` dari user login atau `data/profile.ts`.

### 2.8 `PublicFolder`, `PublicCreatorPost`, `PublicCreator`, `PublicPayload` — `src/lib/publicStore.ts`

**`PublicFolder`** (`:14-22`) — "satu project berisi beberapa scene":

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id` | `string` | ✅ | `folder-${slug(nama)}` |
| `name` | `string` | ✅ | Nama folder |
| `description` | `string` | ✅ | `"${n} scene dalam project ini."` atau deskripsi scene pertama |
| `cover` | `string` | ✅ | `thumbnail` scene pertama |
| `sceneIds` | `string[]` | ✅ | Daftar id scene anggota |
| `tags` | `string[]` | ✅ | Diambil dari `project.tags` scene pertama |
| `year` | `string` | ✅ | Diambil dari `project.year` scene pertama |

**`PublicCreatorPost`** (`:24-31`):

| Field | Tipe | Wajib |
|---|---|---|
| `id` | `string` | ✅ |
| `title` | `string` | ✅ |
| `image` | `string` | ✅ |
| `panorama` | `string` | ✅ |
| `category` | `string` | ✅ |
| `views` | `string` | ✅ (format teks, mis. `"12 post"`) |

**`PublicCreator`** (`:34-41`):

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id` | `string` | ✅ | `creator-1` … `creator-5` (seed) |
| `name` | `string` | ✅ | Nama kreator |
| `initials` | `string` | ✅ | Inisial |
| `color` | `string` | ✅ | Kelas Tailwind, mis. `"bg-amber-100 text-amber-700"` |
| `email` | `string` | ✅ | Email |
| `posts` | `PublicCreatorPost[]` | ✅ | Satu post per kreator di seed |

**`PublicPayload`** (`:43-53`) — bentuk final yang dipublish:

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `profile` | `PublicProfile` | ✅ | Identitas project |
| `scenes` | `Scene[]` | ✅ | Semua scene yang dipublish |
| `folders` | `PublicFolder[]` | ✅ | Hasil `buildPublicFolders(scenes)` |
| `creators?` | `PublicCreator[]` | ❌ | Kreator dari seed/publish (dipertahankan saat publish ulang, `publicStore.ts:141`) |
| `uid?` | `string` | ❌ | UID unik project 10 karakter |
| `updatedAt` | `string` | ✅ | ISO timestamp |

### 2.9 Tipe Penyimpanan & State (lib)

**`StoredPanorama`** — `src/lib/db.ts:1-8`: `id: string`, `name: string`, `blob: Blob`, `createdAt: number`, `url?: string` (URL publik Supabase Storage saat remote; lokal pakai `blob:`).

**`AssetKind`** — `src/lib/db.ts:10`: `"audio" | "image"`.

**`StoredAsset`** — `src/lib/db.ts:12-19`: `id, sceneId, kind: AssetKind, name, blob: Blob, createdAt: number`.

**`RemoteState`** — `src/lib/remoteStore.ts:20-31` (state privat per identitas):

| Field | Tipe | Default (`emptyRemoteState`, `:33-44`) |
|---|---|---|
| `users` | `RemoteUser[]` | `[]` |
| `hotspots` | `Record<string, Hotspot[]>` | `{}` |
| `favorites` | `string[]` | `[]` |
| `media` | `Record<string, { panorama?: string; thumbnail?: string }>` | `{}` |
| `panoramas` | `RemotePanorama[]` | `[]` |
| `effects` | `Record<string, SceneEffects>` | `{}` |
| `groups` | `string[]` | `["Uncategory"]` |
| `sceneGroups` | `Record<string, string>` | `{}` |
| `sceneOrder` | `Record<string, number>` | `{}` |
| `imageQuality` | `string` | `"standard"` |

Pendukung: **`RemoteUser`** `{ name, email, initials, password }` (`:6-11`), **`RemotePanorama`** `{ id, name, url, createdAt }` (`:13-18`).

**`User` / `StoredUser`** — `src/context/AppContext.tsx:35-43`: `User { name, email, initials }`; `StoredUser extends User { password }` (hanya mode lokal; di mode server password tidak pernah ke browser).

**`SceneEffects`** — `src/lib/effects.ts:1-12` (lihat §8.2).

**`Example360`** — `src/data/examples.ts:7-16`: `id, title, kind, image, panorama, description, yaw, pitch`.

**`LocalCreator`** — `src/data/creators.ts:1-12`: `id, name, initials, color, title, image, panorama, category, views, email?`.

**`View`** — `src/lib/navigation.ts:1`: `"home" | "studio" | "dashboard" | "portfolio"`.
**`Quality`** — `src/hooks/useTourViewer.ts:16`: `"hemat" | "standar" | "tinggi"` (internal viewer; **berbeda** dengan `imageQuality` `"standard" | "high" | "original"` di AppContext).

---

## 3. Tipe Hotspot, Gaya & Ikon

### 3.1 Definisi vs Implementasi

| Aspek | Definisi TS | Realisasi |
|---|---|---|
| Tipe hotspot | 4: `info`, `project`, `link`, `scene` (`tour.ts:1`) | Dropdown editor persis 4 opsi (`RightPanel.tsx:363-366`) |
| Ikon marker | 9: `point…heart` (`tour.ts:5`) | 9 ikon SVG di `ICONS` + fallback `project` (`useTourViewer.ts:29-40`) |
| Bentuk | 7 (`tour.ts:4`) | 7 opsi dropdown + `clip-path` CSS (`RightPanel.tsx:442-448`) |
| Efek | 7 (`tour.ts:12`) | 7 opsi dropdown + animasi CSS `hs-*` (`RightPanel.tsx:410-416`, `RESEARCH.md:72-73`) |
| Polygon | **tidak ada di `HotspotType`** | Hanya tombol "Gambar area" → `startPlacement("project")`; `polygon_config` Panoee **belum** diimplementasi (`App.tsx:378`, `RESEARCH.md:79-81`) |
| Audio/video/image | **bukan tipe hotspot** | Diwakili `type: "info"` + `style.icon: "sound"|"video"|"image"` (picker, lihat §3.3); audio scene juga via `Scene.audio` |

### 3.2 Perilaku klik (`useTourViewer.ts:180-194`)

```
select-marker
  ├─ ada spot.targetSceneId → tour.setCurrentNode(targetSceneId)  [pindah scene]
  ├─ spot.type === "link" && spot.href → window.open(href, "_blank", "noopener,noreferrer")
  └─ selainnya → setSelectedHotspot(spot)  [buka panel detail]
```

Di viewer publik (`PublicViewerModal.tsx:92-112`), navigasi juga memakai `marker.data.targetSceneId` dengan fallback event klik DOM langsung.

### 3.3 Pemetaan Picker 9 Jenis → Tipe + Ikon (`src/App.tsx:160-176`)

| Label Panoee | `HotspotType` | `HotspotIcon` |
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

Judul default saat hotspot dibuat (`useTourViewer.ts:467-472`): `info → "Info baru"`, `project → "Area proyek"`, `link → "Tautan baru"`, `scene → "Navigasi baru"`. Deskripsi default: `"Hotspot baru. Ubah judul dan deskripsi di panel Hotspot."`

### 3.4 Rendering marker (`markerConfig`, `useTourViewer.ts:42-63`)

- `style` di-merge: `{ ...defaultHotspotStyle, ...(spot.style ?? {}) }`.
- Ukuran piksel: `px = 14 + style.size * 2.4`; marker `width/height = px*2`, anchor `"center center"`.
- Class CSS: `hs-dot` + `hs-${effect}` (kecuali `normal`) + `hs-shape-${shape}` (kecuali `circle`) + `hs-label` / `hs-label-on-hover`.
- HTML: `--hs-color`, `opacity: style.opacity/100`, `transform: rotate(${style.rotate}deg)`, `data-hs-id` (dipakai drag & fallback klik).
- Escaping HTML via `escapeHtml()` (`useTourViewer.ts:65-69`) — mencegah XSS dari judul/label. (Di `PublicViewerModal.tsx:66` escaping hanya menghapus karakter `&<>"'`, bukan mengganti entity — perbedaan kecil.)

---

## 4. Graph Scene & Navigasi

### 4.1 Representasi node/edge

Tidak ada tipe `Tour` eksplisit di kode. Graph dibangun **implisit** dari `Scene[]` + hotspot bertipe `scene`:

| Konsep | Representasi | Fungsi |
|---|---|---|
| Node | `Scene` (id, panorama, name, description, thumbnail) | `buildNodes()` (`useTourViewer.ts:71-81`) → `VirtualTourPlugin` nodes |
| Edge | `Hotspot` dengan `type === "scene"` dan `targetSceneId` | `sceneLinks(scene)` (`sceneGraph.ts:4-8`) → `{ nodeId, position: { yaw, pitch } }` |
| Marker non-navigasi | Hotspot `type !== "scene"` | `contentHotspots(scene)` (`sceneGraph.ts:11-13`) → `markers` PSV |

`sceneLinks()` memakai type-guard:
```ts
.filter((h): h is Hotspot & { targetSceneId: string } =>
        h.type === "scene" && !!h.targetSceneId)
```

### 4.2 Cara navigasi dihitung

1. **Hotspot → scene tujuan**: klik marker/link memanggil `tour.setCurrentNode(targetSceneId)`; event `node-changed` memperbarui `currentSceneId`, menutup panel hotspot, dan memanggil `onSceneChange` (`useTourViewer.ts:174-179, 185-188`).
2. **Sidebar / daftar scene / graph**: `goToScene(id)` → `setCurrentNode(id)` (`useTourViewer.ts:492-497`).
3. **Prev/Next tombol**: indeks dihitung dari **urutan array `scenes`** (yang sudah di-sort oleh `sceneOrder`, `AppContext.tsx:901`):
   ```ts
   const currentIndex = Math.max(0, scenes.findIndex((s) => s.id === tour.currentSceneId)) // App.tsx:158
   prevScene = scenes[(currentIndex - 1 + scenes.length) % scenes.length]                  // App.tsx:368
   nextScene = scenes[(currentIndex + 1) % scenes.length]                                  // App.tsx:369
   ```
   Bersifat **sirkular** (scene terakhir → pertama). Ini navigasi *linear berdasarkan urutan*, **bukan** graph edge.
4. **Viewer publik**: `go(delta)` dengan modulus yang sama (`PublicViewerModal.tsx:123-130`); keyboard `ArrowLeft`/`ArrowRight` dan `Escape` (`:132-140`).
5. **Pindah via inspector**: tombol "Set ke layer berikutnya" menetapkan `targetSceneId` ke scene berikutnya secara modulus (`RightPanel.tsx:507-517`).

### 4.3 Validasi & fallback

| Situasi | Perlakuan | Referensi |
|---|---|---|
| `findScene(scenes, id)` tidak ketemu | Fallback ke `scenes[0]` | `sceneGraph.ts:15-17` |
| `targetSceneId` tidak ada di nodes | `catch` → toast `"Scene tujuan tidak ditemukan."` / `"Scene tidak ditemukan."` | `useTourViewer.ts:185-186, 496` |
| Viewer publik: target tidak valid | Diabaikan (`.catch(() => undefined)`), dicek dulu dengan `list.some(...)` | `PublicViewerModal.tsx:95-96, 108` |
| `activeSceneId` tidak ada di scenes | Tidak dipindahkan (`some()` guard) | `useTourViewer.ts:441-442` |
| Hotspot spill ke `contentHotspots` | Tipe `scene` **selalu** jadi link PSV, tidak dobel marker | `sceneGraph.ts:11-13`, `useTourViewer.ts:78-79` |
| Koordinat klik di luar sphere | Fallback: `yaw = radToDeg(pos.yaw) + dx*180`, `pitch = clamp(radToDeg(pos.pitch) - dy*90, -90, 90)` | `useTourViewer.ts:290-297` |
| Urutan scene | `sort((a,b) => (sceneOrder[a.id] ?? 0) - (sceneOrder[b.id] ?? 0))` | `AppContext.tsx:901` |

> Tidak ada validasi **cycle** atau ** orphan node** (scene tanpa incoming edge). Graph juga tidak punya deteksi scene tak terhubung — semua scene tetap tampil di sidebar/graph linear.

### 4.4 Tampilan graph di UI (bukan data)

- `MiniMap` (`TourViewer.tsx:112`): peta yaw + titik hotspot.
- **Side menu** (`:115-129`): daftar scene di kanan viewer.
- **Tour graph** (`:132-150`): deretan node `A → B → C` (visualisasi urutan linear, bukan edge hotspot).
- Opsi ini berasal dari Panoee "View options: Mini-map, Side menu, Tour graph" (`RESEARCH.md:105-107`).

---

## 5. Data Seed/Contoh & Sumber Halaman `/p/1x2m270p3j`

### 5.1 Inventaris data hardcoded

| File | Isi | Jumlah |
|---|---|---|
| `src/data/scenes.ts` | Scene statis: `atrium`, `studio`, `terrace` | **3 scene**, 7 hotspot awal (2+3+2) |
| `src/data/profile.ts` | Profil Ardhana Wicaksono + 3 stat | **1 profil** |
| `src/data/creators.ts` | `LOCAL_CREATORS` c1–c5, tiap 1 post | **5 kreator**, 5 post |
| `src/data/examples.ts` → `EXAMPLES_360` | Contoh panorama gratis (Poly Haven CC0 via path lokal) | **3 entri** (atrium, studio, apartment) |
| `src/data/examples.ts` → `CREATOR_PANORAMAS` | Panorama cadangan kreator | **5 entri** |
| `src/data/examples.ts` → `buildCreatorScenes(i)` | Tur 3 scene per kreator (rotasi dari panorama ke-i) | 3 scene per kreator |
| `src/data/examples.ts` → `buildExampleScenes()` | Tur contoh 3 scene dengan hotspot `door-*` | 3 scene |
| `src/views/PublicPortfolioView.tsx:36-45` | `postCards` | **8 post** |
| `src/views/PublicPortfolioView.tsx:47-54` | `tourCards` | **6 tour** |
| `src/views/PublicHomeView.tsx:12-19` | `ITEMS` trending | **6 item** |
| `src/views/PublicHomeView.tsx:21` | `CATEGORIES` | 7 kategori |
| `scripts/seed-supabase.mjs:43-94` | `DUMMY_USERS` | **5 user dummy**, 5 creator, 5 post, password `demo1234` |
| `supabase/schema.sql` | Tabel + bucket | 2 tabel, 1 bucket |

File media terkait (lihat `docs/ASSETS.md`): `public/media/panoramas/{entrance_hall,art_studio,hotel_room,artist_workshop,ballroom}.jpg` + versi `thumbnails/` — format equirectangular 2:1, disarankan ≤10 MB.

### 5.2 Ringkasan jumlah (yang paling relevan)

| Entitas | Jumlah | Sumber |
|---|---|---|
| Scene dasar | 3 | `data/scenes.ts` |
| Hotspot dasar | 7 (2 info/scene + 3 project/scene/scene + 2 link/scene) | `data/scenes.ts` |
| Profil lokal | 1 | `data/profile.ts` |
| Kreator lokal | 5 | `data/creators.ts` |
| Kreator remote (seed DB) | 5 | `seed-supabase.mjs` → `virtour:public` |
| Post (seed remote) | 5 (1 per kreator) | `seed-supabase.mjs:140-149` |
| User dummy | 5 | `seed-supabase.mjs:43-94` |
| Folder publish (live) | 3 | payload `/api/public` |
| Scene publish (live) | 3 | payload `/api/public` |

### 5.3 Dari mana data halaman `/p/1x2m270p3j` berasal — alur lengkap

1. **Hash router**: `currentView()` memetakan `#/p/...` → `"portfolio"` (`navigation.ts:7`). `PublicPortfolioView` dipakai (`Root.tsx`/`App.tsx`).
2. **UID dibaca** dari hash: `publicUidFromHash()` dengan regex `/^#\/p\/([^/?]+)/` → `"1x2m270p3j"` (`publicStore.ts:76-80`).
3. **Fetch**: `loadPublicPayload(uid)` → `GET /api/public?id=1x2m270p3j` dengan `cache: "no-store"` (`publicStore.ts:108-120`).
4. **Server** (`api/public.js:30-41`): membuat `projectId(uid)` → **`virtour:pub:1x2m270p3j`** (sanitasi karakter `[^a-zA-Z0-9-_]`, max 40); query `virtour_state` helper `SUPABASE_SECRET_KEY`/`SERVICE_ROLE_KEY`. Jika tidak ada, fallback ke row lama `virtour:public`.
5. **Payload di-parse**: `data?.data?.payload ?? data?.data ?? null` (mendukung 2 bentuk penyimpanan: lama langsung payload, baru dibungkus `{ payload, updated_at }`).
6. **Fallback folder**: `folders ?? buildPublicFolders(scenes)` (`publicStore.ts:116`) — grouping dari `project.title` (di-slug), satu folder per project.
7. **Fallback UI**: jika fetch gagal, `PublicPortfolioView` memakai profil + `scenes` lokal + `buildPublicFolders(scenes)` (`PublicPortfolioView.tsx:276-299`).
8. **Tampilan**: karena `sharedUid` ada, nama yang ditampilkan adalah `folders[0].name ?? scenes[0].project.title` (bukan nama user), dengan badge `by Project · /p/<uid>` (`PublicPortfolioView.tsx:327-339, 380`).

`uid` `1x2m270p3j` dibuat oleh `makePublicUid()` (`publicStore.ts:63-68`): 6 byte acak → base36, `padStart(2,"0")`, digabung, dipotong 10 karakter. Link dibentuk `publicShareUrl(uid)` → `<origin>/#/p/<uid>` (`:70-74`).

### 5.4 Payload live aktual (dari `GET /api/public?id=1x2m270p3j`)

Ringkasan (diperoleh 2026-11-23, isi penuh disederhanakan pada field panjang):

```json
{
  "uid": "1x2m270p3j",
  "updatedAt": "2026-11-22T13:46:19.311Z",
  "profile": {
    "name": "awe", "initials": "A",
    "location": "Jakarta, Indonesia",
    "email": "hello@ardhana.studio",
    "website": "https://ardhana.studio",
    "bio": "Saya membangun pengalaman visual imersif — dari pemotretan panorama 360°…"
  },
  "scenes": [
    {
      "id": "atrium", "name": "Atrium — The Gallery", "group": "Uncategory",
      "panorama": "/media/panoramas/entrance_hall.jpg",
      "thumbnail": "/media/thumbnails/entrance_hall.jpg",
      "initialView": { "yaw": 0, "pitch": 0, "zoom": 70 },
      "project": { "title": "The Gallery", "role": "360° Capture & Interactive Design",
                   "client": "Diraja Art Space", "year": "2025",
                   "tags": ["360°","Photography","WebGL"] },
      "hotspots": [
        { "id":"hs-1795352218619-eh73f","type":"info","yaw":160,"pitch":5,"title":"Info baru","description":"Hotspot baru. Ubah judul dan deskripsi di panel Hotspot." },
        { "id":"hs-1795352932522-hs8ew","type":"info","yaw":318,"pitch":-5,"title":"Info baru","description":"…" },
        { "id":"hs-1795352948006-7hy2s","type":"info","yaw":223,"pitch":4,"title":"Info baru","description":"…" },
        { "id":"hs-1795352957923-neqxz","type":"info","yaw":228,"pitch":-3,"title":"Info baru","description":"…" },
        { "id":"hs-1795355136611-gjgni","type":"info","yaw":135,"pitch":-2,"title":"Info baru","description":"…" }
      ]
    },
    {
      "id": "studio", "name": "Studio — Creative Room", "group": "Uncategory",
      "panorama": "/media/panoramas/art_studio.jpg",
      "initialView": { "yaw": 30, "pitch": 0, "zoom": 70 },
      "hotspots": [
        { "id":"hs-process","type":"project","yaw":-40,"pitch":-6,"title":"Proses kreatif","description":"Dari riset, moodboard…" },
        { "id":"hs-back","type":"scene","yaw":120,"pitch":3,"title":"Kembali ke Atrium","targetSceneId":"atrium" },
        { "id":"hs-next","type":"scene","yaw":-120,"pitch":1,"title":"Menuju Terrace","targetSceneId":"terrace" },
        { "id":"hs-1795352999223-qoksw","type":"info","yaw":22,"pitch":-8,"title":"Info baru","description":"…" }
      ],
      "project": { "title":"Creative Room","role":"Virtual Tour & Spatial Storytelling",
                   "client":"Personal Project","year":"2025","tags":["Tour","Storytelling","UI"] }
    },
    {
      "id": "terrace", "name": "Terrace — Sunset View", "group": "Uncategory",
      "panorama": "/media/panoramas/hotel_room.jpg",
      "initialView": { "yaw": -20, "pitch": 4, "zoom": 65 },
      "hotspots": [
        { "id":"hs-link","type":"link","yaw":60,"pitch":0,"title":"Lihat karya lainnya",
          "href":"https://www.behance.net","description":"Kunjungi galeri online…" },
        { "id":"hs-back","type":"scene","yaw":-90,"pitch":2,"title":"Kembali ke Studio","targetSceneId":"studio" }
      ],
      "project": { "title":"Sunset Terrace","role":"Panoramic Content & Color Grading",
                   "client":"Sunset Harbor","year":"2024","tags":["360°","Grading","Hospitality"] }
    }
  ],
  "folders": [
    { "id":"folder-the-gallery","name":"The Gallery","cover":"/media/thumbnails/entrance_hall.jpg",
      "sceneIds":["atrium"],"tags":["360°","Photography","WebGL"],"year":"2025",
      "description":"Ruang pamer utama dengan pencahayaan alami dan artefak pilihan." },
    { "id":"folder-creative-room","name":"Creative Room","cover":"/media/thumbnails/art_studio.jpg",
      "sceneIds":["studio"],"tags":["Tour","Storytelling","UI"],"year":"2025","description":"…" },
    { "id":"folder-sunset-terrace","name":"Sunset Terrace","cover":"/media/thumbnails/hotel_room.jpg",
      "sceneIds":["terrace"],"tags":["360°","Grading","Hospitality"],"year":"2024","description":"…" }
  ],
  "creators": [
    { "id":"creator-1","name":"Alvi Arts","initials":"AA","color":"bg-amber-100 text-amber-700",
      "email":"alvi@example.com","posts":[{ "id":"post-1","title":"Atrium — The Gallery",
        "image":"/media/thumbnails/entrance_hall.jpg","panorama":"/media/panoramas/entrance_hall.jpg",
        "category":"360°","views":"12 post" }] },
    { "id":"creator-2","name":"Atrium Studio","initials":"AS", … "views":"8 post" },
    { "id":"creator-3","name":"Ruang Kreatif","initials":"RK", … "views":"21 post" },
    { "id":"creator-4","name":"Sunset Living","initials":"SL", … "views":"5 post" },
    { "id":"creator-5","name":"Harbor 360","initials":"H3", … "views":"9 post" }
  ]
}
```

**Temuan penting dari payload live:**
- Scene `atrium` berisi **5 hotspot "Info baru" hasil edit di editor** (id `hs-1795…`), menggantikan 2 hotspot asli (`hs-about`, `hs-next`). Scene `studio` mendapat 1 tambahan "Info baru". Artinya data publik adalah **hasil edit pengguna yang dipublish**, bukan lagi 7 hotspot hardcoded awal.
- `profile.name` = `"awe"` (dari user login / edit profil), bukan `"Ardhana Wicaksono"` dari `data/profile.ts`.
- `creators` = 5 kreator hasil **seed Supabase** yang dipertahankan lewat mekanisme `payload.creators?.length ? … : previous?.creators` saat publish (`publicStore.ts:141`).
- Folder = 3 folder, masing-masing 1 scene (slug dari `project.title`), dibuat otomatis oleh `buildPublicFolders()`.
- Semua panorama/thumbnail masih memakai path lokal `/media/...` (bukan URL Supabase Storage) → hasil script `update-public-images.mjs` dan `update-creator-images.mjs`.

### 5.5 Transformasi `buildPublicFolders()` (`publicStore.ts:82-105`)

```
for each scene:
  name = scene.project?.title || scene.group || "Lainnya"  (trim, fallback "Lainnya")
  key  = slug(name)   // lowercase, non-[a-z0-9] → "-", trim "-", fallback "project"
  group[key].push(scene)

folder = {
  id: `folder-${key}`,
  name: first.project?.title || first.group || "Lainnya",
  description: items.length > 1 ? `${items.length} scene dalam project ini.`
                                : first.description || "Panorama 360°.",
  cover: first.thumbnail,
  sceneIds: items.map(s => s.id),
  tags: first.project?.tags ?? [],
  year: first.project?.year ?? "",
}
```

---

## 6. Konfigurasi Tour & Theme

### 6.1 `tourConfig` — `src/config/tour.config.ts:1-12`

| Field | Nilai | Tipe/Constraint | Keterangan |
|---|---|---|---|
| `defaultZoom` | `70` | number | Zoom level PSV saat panorama selesai dimuat |
| `minFov` | `30` | number | Batas bawah field-of-view |
| `maxFov` | `100` | number | Batas atas field-of-view |
| `transitionSpeed` | `"18rpm"` | string (CSS/PSV duration) | Kecepatan transisi antar scene |
| `renderMode` | `"3d"` (`as const`) | `"2d"\|"3d"` | Mode VirtualTourPlugin di Studio; **publik memakai `"2d"` hardcode** (`PublicViewerModal.tsx:49`) |
| `loadingLabel` | `"Menyiapkan panorama…"` | string | Label loading |

Plugin PSV yang dipasang (`useTourViewer.ts:126-146`, versi `^5.15.1` di `package.json:16-22`): `MarkersPlugin`, `VirtualTourPlugin` (`dataMode:"client"`, `positionMode:"manual"`, transisi `effect:"fade"`, `rotation:true`, `showLoader:true`, `showLinkTooltip:true`), `AutorotatePlugin` (`autorotatePitch:"5deg"`, `autorotateSpeed:"2rpm"`), `CompassPlugin` (`size:"48px"`), `GyroscopePlugin`, `SettingsPlugin`. Viewer: `navbar:false`, `touchmoveTwoFingers:true`, `mousewheelCtrlKey:false`, caption = nama scene pertama.

### 6.2 `theme` — `src/config/theme.ts:1-26` (`as const`)

| Grup | Token | Nilai | Pemakaian |
|---|---|---|---|
| `color` | `background` | `#09090b` | Latar gelap studio |
| | `panel` | `#18181b` | Panel |
| | `surface` | `#27272a` | Permukaan |
| | `surfaceHover` | `#3f3f46` | Hover |
| | `border` | `#27272a` | Border |
| | `borderStrong` | `#3f3f46` | Border kuat |
| | `text` | `#fafafa` | Teks utama |
| | `textMuted` | `#a1a1aa` | Teks sekunder |
| | `textSubtle` | `#71717a` | Teks halus |
| | `accent` | `#facc15` | Aksen amber (sama dengan marker default) |
| | `primary` | `#0ea5e9` | Aksen biru (link/scene) |
| | `brand` | `#ec4899` | Aksen pink (brand) |
| `size` | `topbar` | `56` px | Tinggi top bar |
| | `sidebar` | `240` px | Lebar sidebar kiri |
| | `inspector` | `260` px | Lebar inspector kanan |
| `radius` | `control` | `8` px | Radius kontrol |
| | `card` | `12` px | Radius kartu |
| | `panel` | `14` px | Radius panel |

> Palet ini mengikuti referensi Panoee (zinc + amber/blue/pink) dan dipakai `TourViewer.tsx:3,107` untuk inset kanvas. Halaman publik memakai palet terang Tailwind (`#f7f9fc`, `#eef2f8`, `#d1005c`, cyan-500) — bukan token `theme.ts`.

### 6.3 Opsi tampilan & kualitas

| Opsi | Tipe / Enum | Default | Lokasi | Efek |
|---|---|---|---|---|
| `imageQuality` | `"standard"\|"high"\|"original"` | `"standard"` | `AppContext.tsx:101-102,245-251`; UI `RightPanel.tsx:300-317` | Disimpan remote & lokal; tidak mengubah URL gambar (informasional, "seperti Panoee") |
| Viewer `Quality` | `"hemat"\|"standar"\|"tinggi"` | `"standar"` | `useTourViewer.ts:16-22,532-537` | `hemat`: minFov 65/zoom 45; `standar`: 30/70; `tinggi`: 15/100 |
| `groups` | `string[]` | `["Uncategory"]` | `AppContext.tsx:238,808-849` | Buat/ganti nama/hapus grup; penghapusan → `"Uncategory"` |
| `sceneOrder` | `Record<string, number>` | `{}` | `AppContext.tsx:859-866,901` | Urutan scene (↑/↓), dipakai prev/next |
| `favorites` | `string[]` | `[]` | `AppContext.tsx:779-785` | Toggle hati; `likes` di portofolio = `favorites.length` (`PublicPortfolioView.tsx:379`) |
| View options | boolean | `showMiniMap=true`, `showSideMenu=false`, `showGraph=false` | `TourViewer.tsx:77-79`, `App.tsx:355-364` | Mini-map, side menu, tour graph |
| Publish access | `"draft"\|"public"\|"password"` | `"public"` | `PublishModal.tsx:21,24,94-124` | UI-only saat ini (tidak mengubah RLS/endpoint) |
| Embed flags | `allowFullscreen`, `allowVr`, `lazy` | `true,true,true` | `PublishModal.tsx:30-35,160-162` | Menyusun `<iframe …>` code |

### 6.4 Ikon & Logo

- Ikon UI: **`lucide-react` ^1.77.0** (`package.json:24`), dipakai luas di header, toolbar, inspector.
- Ikon marker: SVG inline buatan sendiri di `ICONS` (`useTourViewer.ts:26-40`) — bukan lucide, agar bisa di-`innerHTML`.
- Logo: komponen `Logo360` (`src/components/ui/Logo360.tsx`), dipakai di header studio/publik dengan `tone="dark"|...`, `size={28}` (`PublicHomeView.tsx:113`, `PublicPortfolioView.tsx:85`). Aset brand ada di `public/media/brand/` (lihat `docs/PLAN.md:67`).

---

## 7. Database Supabase (Schema, RLS, Storage)

### 7.1 `supabase/schema.sql` (56 baris)

> Komentar di baris 1 menyebut "1 tabel + 1 bucket", tetapi aktualnya **2 tabel + 1 bucket** (ditambah RLS policies).

#### Tabel `public.virtour_users` (`:5-11`)

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `email` | `text` | `PRIMARY KEY` | Email lowercase (dinormalisasi di `api/auth.js:38,48,64`) |
| `name` | `text` | `NOT NULL` | Nama user |
| `initials` | `text` | `NOT NULL` | 2 huruf kapital dari nama |
| `password_hash` | `text` | `NOT NULL` | Format `salt:hash` (scrypt), **bukan plaintext** |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Waktu daftar |

RLS: `enable row level security` (`:13`); policy `"virtour360 users service"` `FOR ALL USING (true) WITH CHECK (true)` (`:14-19`) — akses penuh (demo, via service key di server).

#### Tabel `public.virtour_state` (`:22-26`)

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | `text` | `PRIMARY KEY` | `virtour360-shared`, `user:<email>`, `guest:<id>`, `virtour:public`, `virtour:pub:<uid>` |
| `data` | `jsonb` | `NOT NULL DEFAULT '{}'::jsonb` | JSON state (RemoteState / PublicPayload / `{payload, updated_at}`) |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | Waktu update terakhir |

RLS: `enable` (`:28`); policy `"virtour360 anon all"` `FOR ALL USING (true) WITH CHECK (true)` (`:32-37`) — anon diperbolehkan (catatan `:30-31`: untuk produksi ganti dengan `auth.uid()`/token).

#### Storage bucket `panoramas` (`:39-53`)

| Properti | Nilai |
|---|---|
| `id` / `name` | `panoramas` |
| `public` | `true` |
| Policy `"virtour360 panoramas read"` | `FOR SELECT USING (bucket_id = 'panoramas')` |
| Policy `"virtour360 panoramas write"` | `FOR ALL USING (bucket_id='panoramas') WITH CHECK (bucket_id='panoramas')` |

Upload: `supabase.storage.from("panoramas").upload(\`${id}.${ext}\`, file, { upsert:true, contentType })` → `getPublicUrl()` (`remoteStore.ts:87-96`). Hapus: ekstrak path setelah `/panoramas/` dari URL, `remove([path])` (`:98-105`).

> **Tidak ada index tambahan** selain primary key; tidak ada foreign key/relasi antar tabel — relasi disimpan sebagai JSON di `data` (denormalized). Tidak ada tabel terpisah untuk Scene, Hotspot, Project, Folder, Post, Creator.

### 7.2 Mapping ke tipe TypeScript

| Tabel / Kolom DB | Tipe TS | Konversi | Referensi |
|---|---|---|---|
| `virtour_users.email/name/initials` | `User` (`AppContext.tsx:35-39`) | `select` → `{name,email,initials}` dikirim ke client | `api/auth.js:44,53-57` |
| `virtour_users.password_hash` | `RemoteUser.password` (hanya di `RemoteState.users`) | scrypt `salt:hash`; verify dengan `timingSafeEqual` | `api/_auth.js:32-45`, `seed-supabase.mjs:37-40` |
| `virtour_state.data` (state privat) | `RemoteState` | `{ ...emptyRemoteState, ...(data.data as Partial<RemoteState>) }` | `remoteStore.ts:46-64` |
| `virtour_state.data` (publish) | `PublicPayload` | `data?.data?.payload ?? data?.data` | `api/public.js:37` |
| `virtour_state.id` | `string` | `SHARED_STATE_ID="virtour360-shared"`; `identityKey = user:email \| guest:id` | `supabase.ts:34-35`, `AppContext.tsx:262-266` |
| `storage.objects` (bucket panoramas) | `RemotePanorama.url` | `getPublicUrl(path).data.publicUrl` | `remoteStore.ts:95` |

Catatan bentuk penulisan:
- **State privat**: `upsert({ id, data: state, updated_at })` (`remoteStore.ts:79-84`); di server `data: state` juga (`api/state.js:56-60`).
- **Publish**: `upsert({ id: "virtour:pub:<uid>", data: { payload: {...payload, uid}, updated_at: ISO }, updated_at: ISO })` (`api/public.js:48-52`).
- **Seed lama**: `data: payload` langsung (tanpa pembungkus `payload`) di `seed-supabase.mjs:167-172` — masih kompatibel berkat fallback `data?.data?.payload ?? data?.data`.

### 7.3 API serverless (Vercel Functions)

| Endpoint | Method | Fungsi | Env |
|---|---|---|---|
| `/api/auth` | GET | Restore session dari token | `SUPABASE_URL`, `SUPABASE_SECRET_KEY` |
| | POST `action: register\|login\|profile\|password` | CRUD user + hash | `api/auth.js` |
| `/api/state?key=<id>` | GET/POST | State privat per identitas | `api/state.js` |
| `/api/public?id=<uid>` | GET/POST | Payload publish (tanpa login) | `api/public.js` |

`_auth.js` membuat token HMAC-SHA256 `base64url(payload).base64url(sig)` berisi `{name,email,initials,exp}` dengan `SESSION_DAYS = 30` (`:3-16`), diverifikasi dengan `timingSafeEqual` (`:18-30`). Secret fallback `"virtour360-dev"`.

Mode klien: `supabase.ts:3-32` hanya membuat client jika `VITE_SUPABASE_URL` ada dan `VITE_SUPABASE_ANON_KEY` **bukan** secret/service-role (ditolak dengan warning, `:10-21`). `isServerMode = VITE_USE_SERVER_DB === "1"`. `isRemote = isServerMode || supabase !== null`.

---

## 8. Utilitas Format, Efek & Transformasi

### 8.1 `src/lib/format.ts` (10 baris)

| Fungsi | Tanda tangan | Perilaku | Reference |
|---|---|---|---|
| `clamp` | `(value, min, max) => number` | `Math.min(max, Math.max(min, value))` | `:1-2` |
| `round` | `(value, digits = 0) => number` | `Math.round(value * 10**digits) / 10**digits` | `:4-7` |
| `formatAngle` | `(value: number) => string` | `String(Math.round(value))` → `"90"`, `"-108"` | `:9-10` |

> **Tidak ada** utilitas format tangka/angka/views/durasi di `format.ts`. Format "views" (`"2.4k"`, `"1.8k"`) dan `"12 post"` adalah **string literal hardcoded** di data contoh (`PublicHomeView.tsx:13-18`, `seed-supabase.mjs:147`). Tanggal ditampilkan apa adanya atau via `new Date(...).getFullYear()` (`AppContext.tsx:889`) / `toISOString()` (`publicStore.ts:164`, `PublishModal.tsx:59`). Durasi hanya muncul sebagai konstanta UI (`transitionSpeed: "18rpm"`, `"16rpm"` di viewer publik).

### 8.2 `src/lib/effects.ts` — `SceneEffects` (48 baris)

| Field | Tipe | Default | Rentang UI | Arti |
|---|---|---|---|---|
| `roll` | `number` | `0` | −20…20 ° | Koreksi kemiringan panorama (`sphereCorrection.roll`) |
| `brightness` | `number` | `100` | 50…150 % | CSS `brightness()` |
| `contrast` | `number` | `100` | 50…150 % | CSS `contrast()` |
| `saturate` | `number` | `100` | 0…200 % | CSS `saturate()` |
| `hue` | `number` | `0` | −180…180 ° | CSS `hue-rotate()` |
| `grayscale` | `number` | `0` | 0…100 % | CSS `grayscale()` |
| `sepia` | `number` | `0` | 0…100 % | CSS `sepia()` |
| `nadir` | `boolean` | `false` | checkbox | Tampilkan badge penutup nadir |

Fungsi:
- `normalizeEffects(value?)` `:25-27` → `{ ...defaultEffects, ...(value ?? {}) }` (dipakai `AppContext.tsx:791`).
- `effectsToCss(effects)` `:30-40` → `"brightness(100%) contrast(100%) saturate(100%) hue-rotate(0deg) grayscale(0%) sepia(0%)"`; diterapkan ke `.psv-canvas-container` (`useTourViewer.ts:428-436`). `roll` dan `nadir` tidak masuk CSS (roll → `setOption("sphereCorrection")`, nadir → badge di `TourViewer.tsx:214-218`).
- `effectPresets` `:42-48`:

| Preset | brightness | contrast | saturate | hue | grayscale | sepia |
|---|---|---|---|---|---|---|
| `natural` | 100 | 100 | 100 | 0 | 0 | 0 |
| `warm` | 105 | 105 | 115 | −8 | 0 | 12 |
| `cool` | 102 | 108 | 105 | 10 | 0 | 0 |
| `dusk` | 82 | 118 | 130 | −18 | 0 | 8 |
| `mono` | 105 | 115 | 100 | 0 | 100 | 0 |

UI inspector: `RightPanel.tsx:238-298` (Levelling, Nadir, Quick Fix, Custom Fix, Staging Day To Dusk, Filter Processing, Sun light). `dusk` disembunyikan dari Quick Fix (`:259`) dan dipakai tombol khusus (`:278`).

### 8.3 Transformasi data utama (ringkasan)

| Transformasi | Fungsi / Lokasi | Input → Output |
|---|---|---|
| Scene → node PSV | `buildNodes()` `useTourViewer.ts:71-81` | `Scene[]` → `{id,panorama,name,description,thumbnail,links,markers}[]` |
| Hotspot → marker | `markerConfig()` `useTourViewer.ts:42-63` | `Hotspot` → PSV marker config (HTML, tooltip, data) |
| Hotspot → edge | `sceneLinks()` `sceneGraph.ts:4-8` | hotspot `scene` → `{nodeId, position}` |
| Scene → folder | `buildPublicFolders()` `publicStore.ts:82-105` | `Scene[]` → `PublicFolder[]` |
| Panorama upload → Scene | `AppContext.tsx:876-892` | `StoredPanorama` → `Scene` (group `Uncategory`, `initialView` 0/0/70, `project.role="Panorama 360°"`, tags `["360°","Upload"]`) |
| Override merge | `AppContext.tsx:893-902` | `staticScenes + uploaded`, lalu `{...scene, ...groupOverride, ...hotspotOverride, ...effectiveMedia, ...audio}` lalu sort by `sceneOrder` |
| Media persist filter | `persistableMedia()` `AppContext.tsx:202-212` | Buang URL `blob:` (tidak valid lintas sesi) sebelum persist |
| UID → link | `makePublicUid()`, `publicShareUrl()`, `publicUidFromHash()` `publicStore.ts:63-80` | random 10 char ↔ `#/p/<uid>` |
| Efek → CSS | `effectsToCss()` `effects.ts:30-40` | `SceneEffects` → filter string |
| Derajat ↔ radian | `radToDeg` `useTourViewer.ts:24`; `round` `format.ts:4` | PSV pakai radian, model pakai derajat |
| Password hash | `hashPassword()/verifyPassword()` `api/_auth.js:32-45`; `seed-supabase.mjs:37-40` | `scrypt(password, salt, 64)` → `salt:hash` |

---

## 9. Data Lokal vs Remote & Migrasi/Seed

### 9.1 Perbandingan

| Aspek | Lokal (default) | Remote Supabase (anon / server mode) |
|---|---|---|
| Aktif jika | `isRemote === false` (env kosong / key secret ditolak) | `isServerMode` (`VITE_USE_SERVER_DB=1`) atau `supabase !== null` |
| State per identitas | `localStorage` keys `virtour360.*` | Baris `virtour_state.id = user:<email>` / `guest:<id>` |
| Panorama | IndexedDB `virtour360` store `panoramas` (Blob) + `blob:` URL | Di-upload ke Storage `panoramas`, `url` publik; blob tetap disimpan lokal |
| Audio/gambar scene | IndexedDB store `assets` (Blob) + object URL | **Tidak** di-upload (hanya lokal); `panoramas` tidak disinkron di server mode (`AppContext.tsx:379-388`) |
| Hotspot/media/efek/grup/urutan/favorit/kualitas | `localStorage` | Disinkron dua arah: load saat mount (`:323-364`), save debounce 800 ms (`:366-392`) |
| Auth | `localStorage` `virtour360.users` + `.session`, password plaintext demo | `/api/auth` → `virtour_users.password_hash` (scrypt), token HMAC 30 hari |
| Publish | Tidak tersedia (`publishPublicPayload` return `{ok:false}` jika !server, `publicStore.ts:130`) | Tersedia via `/api/public`; UID unik per project |
| Reset workspace | — | Saat pemilik berubah, hapus 8 localStorage key + `clearAllLocalData()` (`AppContext.tsx:177-188, 403-483`) |

Daftar kunci `localStorage` (`AppContext.tsx:117-128`): `virtour360.users`, `.session`, `.guestId`, `.owner`, `.hotspots`, `.media`, `.favorites`, `.effects`, `.groups`, `.sceneOrder`, `.sceneGroups`, `.imageQuality`. IndexedDB: DB `virtour360` versi 2, store `panoramas` & `assets` (`db.ts:21-24`).

Identitas tamu: `g-${Date.now().toString(36)}-${random}` (`AppContext.tsx:190-198`). `identityKey = user ? user:<email lowercase> : guest:<guestId>` (`:262-266`).

### 9.2 Cara migrasi / seed

1. **Schema awal**: jalankan `supabase/schema.sql` di SQL Editor (atau `SCHEMA` array di `seed-supabase.mjs:96-115` yang identik).
2. **Seed user + payload publik**:
   ```bash
   SEED_DB_PASSWORD=... node scripts/seed-supabase.mjs
   ```
   - Koneksi via `pg` ke pooler `aws-0-ap-southeast-2.pooler.supabase.com:6543`, user `postgres.zhkswftjzddnmlqdiupp` (`:17-35`).
   - Buat 5 user dummy dengan password `demo1234` (hash scrypt) (`:124-132`).
   - Susun `creators` (5) + `posts` (5) + `profile` + `scenes: []` + `folders: []` + `updatedAt` (`:134-165`).
   - Upsert ke `virtour_state` id **`virtour:public`** (`:167-173`).
3. **Perbaikan gambar** (script one-off, urutan historian):
   - `update-public-images.mjs`: ganti string `key-biscayne-1/2/3` → `entrance_hall/art_studio/hotel_room` di payload `virtour:public`.
   - `update-creator-images.mjs`: set tiap `post.image/panorama` ke `/media/thumbnails|panoramas/<file>.jpg` berurutan `entrance_hall, art_studio, hotel_room, artist_workshop, ballroom`.
   - `restore-creators.mjs`: jika `creators` kosong, isi ulang 5 kreator dengan panorama `https://pannellum.org/images/{alma,bma-1,cerro-toco-0,from-tree,jfk}.jpg` (kemudian ditimpa script update di atas).
4. **Publish dari UI**: `PublishModal` → `publishPublicPayload()` → `POST /api/public` dengan `{ uid, payload }`; data lama `creators` dipertahankan, `folders` dihitung ulang, `uid` ditulis ke payload (`publicStore.ts:125-150`, `api/public.js:43-55`).
5. **Deploy**: isi env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_USE_SERVER_DB`, dan (server) `SUPABASE_URL`, `SUPABASE_SECRET_KEY`/`SERVICE_ROLE_KEY`; build ulang (`schema.sql:55-56`, `vercel.json`).

### 9.3 Kompatibilitas bentuk `data`

`api/public.js:37` dan `restore-creators.mjs:26` menangani dua generasi format:
- **Lama**: `data` = payload langsung (`{ profile, scenes, creators, … }`) — hasil seed.
- **Baru**: `data` = `{ payload: {...}, updated_at: "…" }` — hasil publish.

`update-creator-images.mjs:19,34` dan `restore-creators.mjs:26,36` juga melakukan `const payload = row.payload ?? row` lalu menulis balik `row.payload ? {...row, payload} : payload`.

---

## 10. Catatan Ketidaksesuaian & Batasan

1. **`docs/PLAN.md:135-157` vs kode aktual**: rencana awal `type: "info"|"link"|"scene"` dan `project?` opsional; implementasi `tour.ts` menambah `"project"` dan menjadikan `project` wajib. `docs/RESEARCH.md:68` juga menyebut "size 1–5", padahal kode/UI memakai 1–15.
2. **`Tour` tidak pernah didefinisikan** sebagai interface — "tur" = `Scene[]` + `tourConfig` + `PublicPayload`. `Project/Folder` juga bukan tabel DB, melainkan `ProjectMeta` di scene dan `PublicFolder` hasil derivasi.
3. **`polygon`, `video`, `audio`, `image`, `form` bukan `HotspotType`**; tidak ada tipe `form` sama sekali. Polygon baru sebatas tombol gambar area → tipe `project` (`RESEARCH.md:79-81`).
4. **RLS sangat permisif** (`USING (true)`) — aman untuk demo 2–5 orang, tidak untuk produksi (komentar `schema.sql:30-31`).
5. **Tidak ada validasi skema** saat load (`loadPublicPayload` hanya spread + fallback folders). Payload rusat bisa menyebabkan render error; tidak ada Zod/validator.
6. **Format views/tanggal/durasi tidak terpusat** di `format.ts` (lihat §8.1) — masih hardcoded di komponen.
7. **`profile.stats` tidak ikut dipublish** — `PublicProfile` menghilangkan `role` & `stats`, sehingga statistik di portofolio publik dihitung ulang dari `posts.length`, `tours.length`, `favorites.length`, dan angka tetap `"1313"` views (`PublicPortfolioView.tsx:118-124`).

---

## 11. Referensi File/Baris

| Topik | File | Baris |
|---|---|---|
| `HotspotType`, `HotspotShape`, `HotspotIcon` | `src/types/tour.ts` | 1, 4–5 |
| `HotspotStyle` + default | `src/types/tour.ts` | 8–39 |
| `Hotspot` | `src/types/tour.ts` | 41–51 |
| `ProjectMeta`, `Scene`, `Profile` | `src/types/tour.ts` | 53–83 |
| 3 scene seed + hotspot | `src/data/scenes.ts` | 6–121 |
| Profil lokal | `src/data/profile.ts` | 3–16 |
| `Example360`, `buildCreatorScenes`, `CREATOR_PANORAMAS`, `buildExampleScenes` | `src/data/examples.ts` | 7–150 |
| `LocalCreator`, 5 kreator | `src/data/creators.ts` | 1–29 |
| `PublicProfile/Folder/Creator/Post/Payload`, slug, UID, `buildPublicFolders`, publish | `src/lib/publicStore.ts` | 4–150 |
| `RemoteState`, load/save, upload/remove Storage | `src/lib/remoteStore.ts` | 1–105 |
| IndexedDB `StoredPanorama`, `StoredAsset` | `src/lib/db.ts` | 1–127 |
| Mode Supabase / identitas remote | `src/lib/supabase.ts` | 1–35 |
| `AppContextValue`, localStorage keys, merge `scenes`, sinkron remote | `src/context/AppContext.tsx` | 35–128, 224–392, 868–902 |
| `sceneLinks`, `contentHotspots`, `findScene` | `src/lib/sceneGraph.ts` | 1–17 |
| `clamp`, `round`, `formatAngle` | `src/lib/format.ts` | 1–10 |
| `SceneEffects`, presets, CSS | `src/lib/effects.ts` | 1–48 |
| `tourConfig` | `src/config/tour.config.ts` | 1–12 |
| `theme` | `src/config/theme.ts` | 1–26 |
| Viewer: `markerConfig`, `buildNodes`, `ICONS`, navigasi, efek, penempatan hotspot | `src/hooks/useTourViewer.ts` | 16–97, 121–237, 409–490 |
| Picker 9 jenis Panoee → tipe+ikon | `src/App.tsx` | 160–176 |
| Prev/next scene | `src/App.tsx` | 158, 368–371 |
| Inspector hotspot (style, type, target, href) | `src/components/layout/RightPanel.tsx` | 163–170, 335–589 |
| Graph/side menu/minimap UI | `src/components/viewer/TourViewer.tsx` | 104–224 |
| Viewer publik (2d, go delta) | `src/components/viewer/PublicViewerModal.tsx` | 43–130 |
| Hash routing `#/p/<uid>` | `src/lib/navigation.ts`, `src/lib/publicStore.ts` | 1–29, 76–80 |
| Payload publik + fallback | `src/views/PublicPortfolioView.tsx` | 258–380 |
| Home: data trending & kreator | `src/views/PublicHomeView.tsx` | 12–19, 254–321 |
| Publish modal (access, embed, payload) | `src/components/auth/PublishModal.tsx` | 21–60, 91–168 |
| DB schema + RLS + bucket | `supabase/schema.sql` | 1–56 |
| API public/state/auth | `api/public.js`, `api/state.js`, `api/auth.js`, `api/_auth.js` | 1–58, 1–66, 1–88, 1–46 |
| Seed 5 user + payload `virtour:public` | `scripts/seed-supabase.mjs` | 17–184 |
| Script perbaikan gambar/kreator | `scripts/update-public-images.mjs`, `update-creator-images.mjs`, `restore-creators.mjs` | 13–25, 13–45, 13–50 |
| Reverse-engineering Panoee (hotspot, opsi, publish) | `docs/RESEARCH.md` | 38–81, 105–115 |
| Rencana model data awal | `docs/PLAN.md` | 125–157 |
| Format aset 2:1 | `docs/ASSETS.md` | 1–32 |
| Payload live `/p/1x2m270p3j` | `GET https://virtour360real.vercel.app/api/public?id=1x2m270p3j` | verifikasi 2026-11-23 |

---

_Disusun oleh researcher dokumentasi model data. Semua contoh objek diambil langsung dari source atau payload live; tidak ada modifikasi terhadap kode aplikasi._
