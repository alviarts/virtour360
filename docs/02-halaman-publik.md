# Dokumentasi Fitur — Halaman Publik / Portofolio Kreator Virtour360 (Replika Panoee)

> **Tanggal:** 2026-11-23  
> **Workspace:** `C:\Users\visual works\Documents\rea`  
> **Source utama:** `C:\Users\visual works\Documents\rea\virtour360`  
> **Halaman target:** https://virtour360real.vercel.app/#/p/1x2m270p3j  
> **File utama:** `src/views/PublicPortfolioView.tsx`, `src/views/PublicHomeView.tsx`, `src/data/profile.ts`, `src/data/creators.ts`, `src/data/examples.ts`, `src/components/ui/*`, `src/components/auth/ProfileModal.tsx`, `src/config/theme.ts`  
> **Status verifikasi:** Source dibaca langsung. UI live diverifikasi dengan tiga cara: (1) `GET https://virtour360real.vercel.app/api/public?id=1x2m270p3j`; (2) render DOM + screenshot Chromium headless (Microsoft Edge `--headless=new`); (3) klik otomatis via Chrome DevTools Protocol (CDP) untuk accordion, View more, pencarian, like, card → viewer, bottom nav, CTA.  
> **Catatan tools:** Browser in-app (`tools.browser.*`) **tidak terhubung** pada sesi researcher ini (`[browser.disconnected]`), sehingga verifikasi interaktif dilakukan dengan Edge headless + CDP sebagai pengganti. Tidak ada source code yang diubah.

---

## 1. Ringkasan Eksekutif

Halaman **Portfolio Publik** adalah satu dari empat view SPA Virtour360, dipetakan dari hash `#/p/<uid>` maupun `#/portfolio[/<creatorId>]`. Halaman ini adalah "profil kreator/project" ala Panoee: hero identitas + statistik, daftar folder project→scene (accordion), grid **360° posts**, grid **virtual tours**, blok lokasi/kontak, CTA upload, dan floating bottom nav.

Karakter penting:

- **Identitas di URL `#/p/<uid>` adalah identitas PROJECT, bukan user.** Nama yang tampil ("The Gallery") diambil dari `payload.folders[0].name`, sedangkan `payload.profile.name` di server adalah `"awe"` — keduanya berbeda dan itu disengaja (`PublicPortfolioView.tsx:327-339`).
- **Data utama berasal dari Supabase lewat serverless API** (`/api/public?id=<uid>`), dengan fallback ke data lokal (`scenes` statis + `profile.ts`) bila fetch gagal atau mode server tidak aktif.
- **Sebagian konten (8 post + 6 tour) adalah kartu demo hardcode**, bukan scene yang dipublikasikan. Hanya folder dan `uploaded` scene (`id` diawali `pano-`) yang benar-benar dari payload.
- **Semua tombol berfungsi tanpa login**, kecuali aksi yang memang membutuhkan akun (Create/Studio/Upload membuka modal auth). Like/favorit juga bekerja untuk tamu dan disimpan di `localStorage`.
- **Bottom nav tidak mengganti halaman**: keempat tab hanya `scrollIntoView` ke section di dalam `#portfolio-root` (satu-satunya kontainer scroll).

---

## 2. Inventaris Fitur (Ringkas)

| No | Fitur | Perilaku | Referensi |
|---|---|---|---|
| P1 | Header sticky | Logo + search + Create + Studio + (Bell) + Masuk/avatar | `PublicPortfolioView.tsx:67-116,373` |
| P2 | Logo `virtour360` | Klik → `navigate("home")` (`#/home`) | `:84-86`; `Logo360.tsx:12-49` |
| P3 | Search "Cari karya⬦" | Filter judul post/tour (case-insensitive), tombol X membersihkan | `:87-96,367,456-460` |
| P4 | Tombol Create | `setAuthOpen(true)` — **selalu** membuka AuthModal, termasuk saat sudah login | `:99-101,373` |
| P5 | Tombol Studio | Login → `navigate("studio")`; tamu → AuthModal | `:102-104` |
| P6 | Bell | Hanya tampil saat login; klik → toast "Tidak ada notifikasi baru." | `:105-109` |
| P7 | Masuk / nama user | Label = `user?.name ?? "Masuk"`; klik → AuthModal | `:110-112` |
| P8 | Hero profil | Avatar inisial, nama, badge `/p/<uid>`, 4 statistik | `:118-150,374-381` |
| P9 | Statistik | Posts/Tours dari panjang array; Views = `"1313"` hardcode; Likes = `favorites.length` | `:119-124,377-379` |
| P10 | Project & folder | 3 folder dari payload; accordion satu folder terbuka | `:385-454`; `publicStore.ts:82-105` |
| P11 | Folder card | Cover, nama, deskripsi, 3 tag, badge "N scene", chevron | `:398-419` |
| P12 | Scene dalam folder | Grid `Card`, klik → DetailModal → viewer multi-scene | `:420-447`; `PublicViewerModal.tsx:43-74` |
| P13 | 360° posts | Grid kartu demo + upload; tampil 4 awal | `:36-45,307-313,462-483` |
| P14 | Card | Thumbnail, heart, badge 360°, badge count, badge komentar, judul | `:160-197` |
| P15 | Hover kartu | `scale-105` + animasi `pano-drift` (hanya saat hover) | `:175`; `theme.css:200-218` |
| P16 | DetailModal | Preview gambar + "Jelajahi 360° →" + Simpan/Favorit | `:199-227,543-552` |
| P17 | Lightbox | **Tidak dipakai di halaman ini** (hanya di Studio) | `Lightbox.tsx:4-29`; `App.tsx:451` |
| P18 | View more/less posts | Toggle `allPosts`: 4 ↔ 8 | `:264,476-482` |
| P19 | Banner "JELAJAHI →" | `navigate("home")` → `#/home` | `:485-497` |
| P20 | Virtual tours | 6 kartu demo + upload; tampil 3 awal; View more ↔ 6 | `:47-54,314-320,499-520` |
| P21 | Lokasi & kontak | `profile.location · profile.email` (data lokal) | `:522-528`; `profile.ts:3-16` |
| P22 | Share your world in 360 | CTA "Upload your own 360 →" → AuthModal | `:530-540` |
| P23 | Bottom nav | Home/Map/Author/Explore = scroll ke section, **bukan route** | `:229-256,562` |
| P24 | PublicViewerModal | Single panorama atau tur multi-scene + keyboard | `PublicViewerModal.tsx:18-179` |
| P25 | Empty state | "Tidak ada post/tour yang cocok." | `:475,512` |
| P26 | Responsive | Grid auto-fill 220px/280px; **header belum responsive** | `:82,383,464,501` |
| P27 | Publish data source | `loadPublicPayload(uid)` → `/api/public?id=...` (Supabase) | `publicStore.ts:107-120`; `api/public.js:17-41` |
| P28 | Fallback data | Payload null → `scenes` context + `buildPublicFolders` | `:276-305` |
| P29 | Favorit tamu | `toggleFavorite` → localStorage `virtour360.favorites` | `AppContext.tsx:779-785` |
| P30 | Tidak ada sort/filter kategori/paginasi URL | Hanya substring judul + View more | `:367-369` |

---

## 3. Detail per Area

### 3.1 Header aplikasi (`PublicPortfolioView.tsx:67-116`)

Header adalah `<header>` sticky (`top-0 z-30 h-16`), latar `bg-white/95 backdrop-blur`, border bawah abu.

| Elemen | Implementasi | Fungsi nyata |
|---|---|---|
| **Logo** | `<button title="Kembali ke Home" onClick={() => navigate("home")}>` berisi `<Logo360 tone="dark" size={28} />` | `navigate()` menulis `window.location.hash = "#/home"` (`navigation.ts:12-14`); `Root.Shell` mendengar `hashchange` dan merender `PublicHomeView` (`Root.tsx:33-37,46-54`). Logo SVG: cincin + orbit `globe-spin` + teks "360", disusul teks "virtour360" (`Logo360.tsx:17-47`). |
| **Kolom search** | `<div class="h-9 w-64 rounded-full bg-slate-100">` + ikon `Search` + `<input placeholder="Cari karya⬦">` + tombol `X` muncul hanya jika `query` tidak kosong | `onChange` → `setQuery`, value terkontrol. Filter diterapkan di `:367` dan dipakai di `:368-369`. Karakter "⬦" di placeholder adalah literer sumber (tampil sebagai kotak kecil di screenshot). Tidak ada debounce, tidak ada sinkronisasi ke URL. |
| **Create** (cyan) | `onClick={() => setAuthOpen(true)}` | Membuka `AuthModal` ("Masuk ke Virtour360"). **Unik:** di Home, Create sudah login → `navigate("studio")`; di Portfolio tetap memaksa modal auth walau sudah login. |
| **Studio** (pink `#d1005c`) | `onClick={() => (userName ? navigate("studio") : onLogin())}` | Jika `user?.name` ada → hash `#/studio`; jika tamu → `setAuthOpen(true)`. |
| **Bell** | Hanya dirender jika `userName` | `notify("Tidak ada notifikasi baru.")` → toast global di `Root.tsx:58-62` selama 2,6 detik (`AppContext.tsx:277-281`). |
| **Masuk / nama** | Teks `userName ?? "Masuk"`, truncation `max-w-32` | `onClick={onLogin}` → `setAuthOpen(true)`. Tidak membuka `ProfileModal` (modal profil hanya dipakai Studio, `App.tsx:435`). |

**Observasi live (desktop 1280px):** logo + teks, placeholder search, tiga tombol kanan terlihat. **Observasi mobile 390px:** `Create`, `Studio`, `Masuk` berada di `right = 505 / 602 / 682 px` di luar viewport (`innerWidth = 390`) — tombol tidak dapat diklik pada layar sempit (lihat §7).

---

### 3.2 Hero profil (`PublicPortfolioView.tsx:118-150,374-381`)

Struktur: `<div id="portfolio-author" class="flex flex-col items-center bg-white px-4 py-10">`.

**Identitas**

```ts
const sharedUid = publicUidFromHash()                       // "1x2m270p3j"
const projectName = publicData?.folders?.[0]?.name
                 ?? publicData?.scenes?.[0]?.project?.title ?? null
const displayName = sharedUid ? projectName ?? "Project Virtour360" : ...
const displayInitials = sharedUid ? (projectName ?? "Project").slice(0, 2).toUpperCase() : ...
```

- Avatar: `size-24`, `bg-emerald-200`, border putih 4px, inisial `TH` — hasil `("The Gallery").slice(0,2).toUpperCase()`. Bukan inisial user (`payload.profile.initials` = `"A"`, `profile.ts` = `"aw"`).
- Nama: **"The Gallery"** — dari `folders[0].name`, bukan `profile.name`.
- Badge: `by Project · /p/1x2m270p3j` dengan ikon `Folder`, gaya `bg-cyan-50 text-cyan-700`. Jika bukan link publish, badge berubah menjadi `@virtour360` (`:131-139`).

**Statistik (4 kolom, `gap-8 sm:gap-10`)**

| Label | Sumber | Nilai live | Keterangan |
|---|---|---|---|
| Posts | `posts.length` (`:377`) | **8** | `postCards` statis 8 item; `uploaded` scene = 0 |
| Tours | `tours.length` (`:378`) | **6** | `tourCards` statis 6 item |
| Views | string literal `"1313"` (`:122`) | **1313** | **Hardcode**, bukan dari payload/API. Field `views` di `creators[].posts[]` (mis. "12 post") tidak dipakai di sini. |
| Likes | `favorites.length` (`:379`) | **0 → 1** saat heart diklik | Berasal dari context + localStorage, bukan jumlah like server. |

`id="portfolio-author"` dipakai bottom nav tab **Author**.

---

### 3.3 Section "Project & folder" (`:385-454`)

Dirender hanya jika `!selected && !!publicData?.folders?.length`. Karena hash `#/p/...` tidak cocok dengan pola `#/portfolio/<id>` (`navigation.ts:26-29`), `selected = null` → section tampil.

- Judul: `SectionTitle` = ikon `Folder` + "Project & folder" (`:152-158`).
- Sub-teks: **`3 folder dipublikasikan · klik untuk melihat scene di dalamnya`** (jumlah dari `publicData.folders.length`).
- Data folder live (dari `/api/public?id=1x2m270p3j`):

| Folder | Deskripsi | Tag (ditampilkan `slice(0,3)`) | Cover | Scene |
|---|---|---|---|---|
| The Gallery | Ruang pamer utama dengan pencahayaan alami dan artefak pilihan. | 360°, Photography, WebGL | `/media/thumbnails/entrance_hall.jpg` | `atrium` → badge **1 scene** |
| Creative Room | Ruang kerja kreatif tempat ide, sketsa, dan prototipe dibentuk. | Tour, Storytelling, UI | `/media/thumbnails/art_studio.jpg` | `studio` → **1 scene** |
| Sunset Terrace | Area terbuka dengan panorama langit dan cakrawala yang luas. | 360°, Grading, Hospitality | `/media/thumbnails/hotel_room.jpg` | `terrace` → **1 scene** |

Sumber tag/deskrisi: `project` pada `src/data/scenes.ts:34-40,76-82,111-117`. `buildPublicFolders()` (`publicStore.ts:82-105`) mengelompokkan scene berdasarkan `slug(project.title)` dan menghasilkan `id` `folder-the-gallery`, `folder-creative-room`, `folder-sunset-terrace`, `description = first.description` bila hanya 1 scene, serta `sceneIds`.

**Apa yang terjadi saat diklik:**
1. `setOpenFolder(open ? null : folder.id)` (`:400`) → accordion **eksklusif** (hanya satu folder terbuka). Klik lagi menutup.
2. Chevron `transition-transform rotate-180` saat open (`:418`).
3. Panel dalam `animate-fade-up` berisi grid `Card` untuk tiap `sceneIds` yang berhasil dicari di `sourceScenes` (`:420-447`). Badge jumlah memakai `scenes.length` hasil filter, bukan `folder.sceneIds.length` mentah.
4. Klik thumbnail kartu scene → `DetailModal`; tekan **Jelajahi 360°** → `PublicViewerModal` dengan `scenes={sourceScenes}` dan `sceneId=scene.id` → **tur 3 scene**. Terverifikasi: overlay "VIRTUAL TOUR / Atrium — The Gallery / **1 / 3 scene**", panah prev/next kanan-bawah, panah kuning di panorama, hint bawah.

---

### 3.4 Section "360° posts — The Gallery" (`:462-483`)

- Judul mengikuti identitas: `sharedUid ? "360° posts — The Gallery" : "360° posts by <INISIAL>"`.
- Susunan data (`:307-313`): `basePosts = [...uploaded, ...postCards]`. `uploaded` = scene dengan `id.startsWith("pano-")` (hasil upload user). `postCards` 8 item hardcode (`:36-45`): Atrium — The Gallery (4▣), Studio — Creative Room (1▣), Terrace — Sunset View (2▣), 2BR MASTER BEDROOM, Living Room 360, Trungtamyte, CT05 20260512 OVERVIEW 1, 0512a.
- **Tampil awal 4 kartu** (`posts.slice(0,4)` di `:368`), grid `auto-fill minmax(min(100%,220px),1fr)` → 4 kolom di 1280px, 1 kolom (310px) di 390px.
- **View more** muncul hanya jika `posts.length > 4`; toggle `allPosts` → 8 kartu dan label berubah **View less**. Terverifikasi via CDP: `4 → 8 → 4`.
- **Kartu (`Card`, `:160-197`)**:
  - gambar `aspect-[4/3]`, `object-cover`, efek `pano-drift` saat hover + `group-hover:scale-105`;
  - tombol heart kanan-atas → `toggleFavorite(id)` (judul berubah "Simpan ke favorit" ↔ "Hapus dari favorit", ikon diisi saat favorit);
  - badge hijau **360°** kiri-bawah, badge gelap **`{count} ▣`** kanan-bawah;
  - badge komentar `MessageCircle {comments}` kanan-atas bawah heart (hanya untuk tour card yang punya `comments`, mis. ED CXL 20261119 = 2, Tienich ID CXL 20261024 = 8);
  - klik gambar **atau** judul → `setDetail(item)`.
- **DetailModal (`:199-227`)** — terverifikasi dengan screenshot `assets/02-portfolio-detail-modal.png`: gambar preview 208px, judul "Atrium — The Gallery", sub-teks "Panorama 360° · 4 scene", tombol pink **"Jelajahi 360° →"**, tombol **Simpan** (berubah **Favorit** bila sudah difavoritkan), X, dan klik backdrop untuk menutup.
- **Klik "Jelajahi"** menutup modal dan membuka `PublicViewerModal`. Untuk kartu post demo `sceneId` tidak ada → viewer **single panorama** tanpa counter/arrows; hint tetap menyebut "klik panah kuning pindah scene" (lihat §7).
- **`Lightbox.tsx` tidak terlibat** di halaman publik; komponen itu hanya dipakai Studio (`App.tsx:451`).

---

### 3.5 Banner promosi "JELAJAHI →" (`:485-497`)

Blok `max-w-[620px]` di antara posts dan tours:

- kiri 2/5: gradient `from-fuchsia-600 via-pink-600 to-cyan-400` + garis diagonal berulang;
- kanan 3/5: latar `#d1005c`, teks **"Karya 360° untuk teman — dibuat dengan senang, tanpa biaya."**, tombol outline putih **"JELAJAHI →"**.
- Klik tombol → `navigate("home")`. Terverifikasi CDP: `location.hash` berubah `#/home`, `#home-root` ada, `#portfolio-root` hilang.

---

### 3.6 Section "Virtual tours — The Gallery" (`:499-520`)

- Judul: `sharedUid ? "Virtual tours — The Gallery" : "Virtual tours by <INISIAL>"`.
- Data: `baseTours = [...uploaded (id "tour-"+id), ...tourCards]` (`:314-320`). Enam tour demo (`:47-54`): 2BR CXL 20261119, 4BR CXL 20261119, TienichTrongNha CXL 20261119, ED CXL 20261119, ED CXL 20261113, Tienich ID CXL 20261024.
- Tampil awal **3 kartu** (`tours.slice(0,3)`), grid min 280px → 3 kolom di desktop. **View more** → 6 kartu, label **View less** (terverifikasi CDP: 3 → 6).
- Kartu memakai komponen `Card` yang sama. Field `likes` ada di data (1 atau 0) tetapi **tidak dirender** di kartu; yang tampil hanya heart favorit + badge komentar bila ada.
- Klik kartu → DetailModal → viewer. Karena `tourCards` tidak punya `sceneId`, viewer bersifat single-panorama.

---

### 3.7 "Lokasi & kontak" (`:522-528`)

Kartu putih border abu dengan ikon `MapPin` biru:

- Judul: **Lokasi & kontak**
- Isi live: **Jakarta, Indonesia · hello@ardhana.studio**
- Sumbernya **data lokal** `src/data/profile.ts:7-8`, bukan `publicData.profile` (meski nilai email di payload sama). `website`, `bio`, `role`, dan `stats` dari `profile.ts` **tidak ditampilkan** di halaman portfolio.
- `id="portfolio-map"` — target tab **Map** pada bottom nav. Tidak ada peta sungguhan (Google Maps/Leaflet), hanya kartu teks ini.

---

### 3.8 "Share your world in 360" + CTA (`:530-540`)

- Judul: **Share your world in 360**
- Sub-teks: *"Turn this dead-end into your next discovery by publishing your own panorama."*
- Tombol cyan **"Upload your own 360 →"** → `setAuthOpen(true)`.
- Terverifikasi CDP: klik tombol memunculkan `AuthModal` dengan judul **"Masuk ke Virtour360"**, tab Login/Register, dan catatan "Publik bisa melihat karya tanpa login. Masuk diperlukan untuk menyimpan & mengunggah 360°." (`AuthModal.tsx:50-151`). Modal ini **bukan** `UploadModal`; setelah login/register berhasil pengguna diarahkan ke `navigate("studio")` (`AuthModal.tsx:34-47`).

---

### 3.9 Bottom nav (`:229-256`)

Pill fixed `bottom-6 left-1/2 -translate-x-1/2`, latar `bg-white/90 backdrop-blur`, empat tombol:

| Tab | Ikon | Aksi | Target | scrollTop terukur (CDP) |
|---|---|---|---|---|
| Home | `Home` | `scrollTo()` → `#portfolio-root.scrollTo({top:0})` | puncak halaman | **0** |
| Map | `MapPin` | `scrollTo("portfolio-map")` | kartu Lokasi & kontak | **1559** |
| Author | `User` | `scrollTo("portfolio-author")` | hero profil | **64** |
| Explore | `Compass` | `scrollTo("portfolio-explore")` | section 360° posts | **1063** |

Semua memakai `scrollIntoView({behavior:"smooth",block:"start"})`. **Tidak ada satu pun yang mengganti view/route**, tidak ada state aktif/selected (semuanya abu-abu, hanya berubah saat hover). Di Home, bottom nav berbeda labelnya: Home / Jelajahi / Author / Explore, dengan Author yang benar-benar `navigate("portfolio")` (`PublicHomeView.tsx:367-372`).

---

## 4. Pencarian, Filter, Sortir, Pagination, Empty State

| Aspek | Perilaku |
|---|---|
| **Pencarian** | Hanya `item.title.toLowerCase().includes(query.trim().toLowerCase())` (`:367`). Berlaku untuk post dan tour, **tidak** untuk folder/deskripsi/tag. |
| **Urutan filtering** | `shownPosts = (allPosts ? posts : posts.slice(0,4)).filter(matches)` (`:368`). Artinya filter diterapkan **setelah** pemotongan 4/3 awal. Contoh: mencari `"0512a"` (post ke-8) menghasilkan 0 kartu sebelum View more ditekan. |
| **Info hasil** | Baris `Hasil pencarian "<q>" — N post, M tour.` (`:456-460`). N/M dihitung dari array **lengkap** (`posts.filter(matches).length`), sehingga bisa tidak sinkron dengan kartu yang tampil. Terverifikasi: query `"studio"` → `Hasil pencarian "studio" — 1 post, 0 tour.` + 1 kartu "Studio — Creative Room" + empty state tour. |
| **Hapus query** | Tombol `X` di dalam search (`:95`), terverifikasi mengembalikan value `""`. |
| **Sortir** | **Tidak ada** kontrol sortir (newest/popular/az). Urutan mengikuti array: uploaded dulu, lalu urutan hardcode. |
| **Filter kategori** | **Tidak ada** di portfolio (berbeda dengan Home yang punya `CATEGORIES` + filter, `PublicHomeView.tsx:21,324-339`). |
| **Pagination** | Hanya tombol **View more / View less** (toggle boolean `allPosts`/`allTours`). Tidak ada nomor halaman, infinite scroll, atau query string. |
| **Empty state** | `"Tidak ada post yang cocok."` (`:475`) dan `"Tidak ada tour yang cocok."` (`:512`). Tidak ada empty state untuk folder (sectionnya langsung tidak dirender). Tidak ada skeleton loading untuk fetch publik. |

---

## 5. Responsive & Mobile

- Kontainer konten: `mx-auto max-w-[1200px] px-4 pb-28 sm:px-6 lg:px-8` (`:383`); section memakai `p-6` dan kartu `rounded-2xl`.
- Grid: `repeat(auto-fill, minmax(min(100%,220px),1fr))` untuk post & scene folder; `minmax(min(100%,280px),1fr)` untuk tour (`:421,464,501`).
- Hero stats memakai `gap-8 sm:gap-10`; CTA bawah memakai `flex-col ... sm:flex-row`.
- Animasi `pano-drift`, `globe-spin`, `fade-up` menghormati `prefers-reduced-motion` (`theme.css:60-77,196-218`).

**Observasi nyata pada 390×844 (Emulation CDP):**

| Pengukuran | Nilai |
|---|---|
| `innerWidth` / `scrollWidth` | 390 / 390 (tidak ada horizontal scroll pada dokumen; kontainer `overflow-y-auto` memotong) |
| Lebar kolom search | 256 px (`w-64`) |
| Posisi tombol Create / Studio / Masuk | `right = 505 / 602 / 682 px` → **di luar viewport**, tidak bisa diklik |
| Grid post | 1 kolom, 310 px |
| Bottom nav | `left 22`, `right 368`, lebar 347 px — muat, namun rapat |

Screenshot: `assets/02-portfolio-mobile.png`.

---

## 6. Teknik Rendering & Sumber Data

### 6.1 Alur data

```
#/p/1x2m270p3j
   │
   ├─ publicUidFromHash()                       publicStore.ts:76-80
   │     regex /^#\/p\/([^/?]+)/ → "1x2m270p3j"
   │
   ├─ loadPublicPayload(uid)                    publicStore.ts:107-120
   │     GET /api/public?id=1x2m270p3j (cache: no-store)
   │        └─ api/public.js:30-41 → Supabase tabel virtour_state
   │           id = "virtour:pub:1x2m270p3j", fallback "virtour:public"
   │           service role key tersimpan di Vercel Function, bukan browser
   │
   ├─ fallback bila payload null                PublicPortfolioView.tsx:276-299
   │     profile (lokal) + scenes (AppContext) + buildPublicFolders(scenes)
   │
   ├─ sourceScenes = publicData.scenes?.length ? publicData.scenes : scenes   :301-305
   ├─ uploaded     = sourceScenes.filter(id startsWith "pano-")              :306
   ├─ basePosts    = uploaded + 8 postCards                                  :307-313
   ├─ baseTours    = uploaded + 6 tourCards                                  :314-320
   └─ selected     = creators.find(creatorFromHash()) → null untuk #/p/...   :322-325
         └─ posts = creatorPosts.length ? creatorPosts : basePosts           :362
```

`isServerMode = import.meta.env.VITE_USE_SERVER_DB === "1"` (`supabase.ts:30`). Jika tidak aktif, `loadPublicPayload` mengembalikan `null` dan seluruh halaman memakai data lokal — itulah sebabnya halaman tetap berfungsi penuh tanpa Supabase.

Payload live yang terverifikasi (diringkas): `uid`, 3 `scenes` (`atrium`, `studio`, `terrace` lengkap dengan hotspot), 3 `folders`, `profile` (nama `"awe"`, inisial `"A"`, email `hello@ardhana.studio`), 5 `creators`, `updatedAt: "2026-11-22T13:46:19.311Z"`.

### 6.2 Cara statistik dihitung

- **Posts** = `posts.length` = 8 (bukan jumlah scene payload = 3).
- **Tours** = `tours.length` = 6.
- **Views** = konstanta `"1313"` — **tidak dihitung dari data mana pun**.
- **Likes** = `favorites.length` dari `AppContext`, key `virtour360.favorites` (`AppContext.tsx:123,234,779-785`). Klik heart langsung menaikkan angka ini (terverifikasi 0 → 1, localStorage menjadi `["post-0"]`).

### 6.3 Tanpa login vs setelah login

| Aksi | Tamu (tidak login) | Setelah login |
|---|---|---|
| Melihat hero, folder, post, tour, lokasi | ✅ | ✅ |
| Accordion folder, View more, search, bottom nav | ✅ | ✅ |
| Like/favorit (heart) | ✅ tersimpan di localStorage (guest id stabil, `AppContext.tsx:190-198`) | ✅ tersimpan di localStorage + disinkron ke Supabase bila remote (`:323-392`) |
| Card → DetailModal → viewer 360° | ✅ penuh (termasuk tur multi-scene) | ✅ sama |
| Tombol **Create** | Buka AuthModal | **Tetap buka AuthModal** (quirk) |
| Tombol **Studio** | Buka AuthModal | Navigasi ke `#/studio` |
| Bell | Tidak tampil | Tampil, klik → toast |
| Tombol **Masuk** / nama | Buka AuthModal | Tetap buka AuthModal (bukan menu profil) |
| **Upload your own 360** | Buka AuthModal | Tetap buka AuthModal; setelah login diarahkan ke Studio |
| `ProfileModal` | Tidak tersedia | Tidak tersedia di halaman ini (hanya di Studio) |

`Root.tsx:41-42` mengunci `#/studio` dan `#/dashboard` dengan `LoginRequired`, tetapi itu di luar halaman portfolio.

### 6.4 Viewer publik (`PublicViewerModal.tsx:18-179`)

- Dua mode: **single panorama** bila `scenes` kosong (`:29-41`) dan **tur multi-scene** bila ada (`:43-81`).
- Plugin: `VirtualTourPlugin` (`dataMode:"client"`, `renderMode:"2d"`, transisi `16rpm`/fade/rotasi) + `MarkersPlugin`.
- `links` dari hotspot `type:"scene"` + `targetSceneId`; marker HTML `.hs-marker` untuk hotspot non-scene (warna/efek/bentuk/label dari `style`).
- `startNodeId` = `sceneId` bila valid, else scene pertama; event `node-changed` memperbarui judul & counter "N / total scene".
- Navigasi: klik panah kuning, klik marker bertarget, fallback klik `[data-hs-id]`, tombol ChevronLeft/Right, keyboard ←/→, Escape untuk tutup (`:85-140,163-172`).
- Hint bawah (`:174-176`): "Geser untuk melihat 360° · scroll zoom · klik panah kuning pindah scene · Esc keluar".
- Terverifikasi dua screenshot: `assets/02-portfolio-viewer.png` (single panorama, tanpa counter) dan `assets/02-portfolio-viewer-tour.png` (tur, counter **1 / 3 scene**, panah prev/next).

---

## 7. Verifikasi Langsung terhadap Aplikasi Live

### 7.1 DOM/render (Chromium headless)

Teks tampil persis:

```
virtour360 | Cari karya⬦ | Create | Studio | Masuk
TH
The Gallery
by Project · /p/1x2m270p3j
8 Posts | 6 Tours | 1313 Views | 0 Likes
Project & folder
3 folder dipublikasikan · klik untuk melihat scene di dalamnya
The Gallery / Creative Room / Sunset Terrace (masing-masing "1 scene")
360° posts — The Gallery
Atrium — The Gallery (4▣) | Studio — Creative Room (1▣) | Terrace — Sunset View (2▣) | 2BR MASTER BEDROOM
View more
Karya 360° untuk teman — dibuat dengan senang, tanpa biaya. | JELAJAHI →
Virtual tours — The Gallery
2BR CXL 20261119 | 4BR CXL 20261119 | TienichTrongNha CXL 20261119
Lokasi & kontak — Jakarta, Indonesia · hello@ardhana.studio
Share your world in 360 — Upload your own 360 →
Home | Map | Author | Explore
```

### 7.2 Hasil klik otomatis (CDP)

| Pengujian | Hasil |
|---|---|
| Accordion folder "Creative Room" | 1 kartu scene ("Studio — Creative Room") muncul, chevron `rotate-180`; klik lagi → 0 kartu |
| Search `"studio"` | Info `Hasil pencarian "studio" — 1 post, 0 tour.`; 1 kartu post; empty state tour muncul; tombol X mengosongkan input |
| Heart kartu pertama | Likes **0 → 1**, `localStorage["virtour360.favorites"] = ["post-0"]`, judul tombol jadi "Hapus dari favorit" |
| Klik thumbnail → DetailModal | Judul + "Panorama 360° · 4 scene" + "Jelajahi 360°" tampil |
| Klik "Jelajahi 360°" | `.psv-container` + `<canvas>` ada; hint "Geser untuk melihat 360° · scroll zoom · klik panah kuning pindah scene · Esc keluar"; X menutup viewer |
| View more posts | 4 → 8 kartu, label "View less"; View less → 4 |
| View more tours | 3 → 6 kartu (2BR, 4BR, TienichTrongNha, ED 20261119, ED 20261113, Tienich ID), label "View less" |
| Bottom nav | scrollTop Home 0, Author 64, Explore 1063, Map 1559; **hash tidak berubah** |
| Tombol Studio (tamu) | AuthModal "Masuk ke Virtour360" + tab Login/Register + catatan publik |
| CTA Upload | AuthModal sama |
| Banner JELAJAHI | `hash = "#/home"`, `#home-root` muncul, `#portfolio-root` hilang |

### 7.3 Screenshot

| File | Isi |
|---|---|
| `assets/02-portfolio-desktop.png` | Tampilan awal desktop 1280px (hero + folder + 4 post + banner + 3 tour) |
| `assets/02-portfolio-mobile.png` | Tampilan 390px (menunjukkan tombol header terpotong) |
| `assets/02-portfolio-accordion-viewmore.png` | Folder Creative Room terbuka + post diperluas 8 kartu |
| `assets/02-portfolio-detail-modal.png` | DetailModal kartu "Atrium — The Gallery" |
| `assets/02-portfolio-viewer.png` | Viewer single-panorama |
| `assets/02-portfolio-viewer-tour.png` | Viewer tur 3 scene + counter "1 / 3 scene" |

---

## 8. Limitations / Catatan Penting

1. **Browser in-app tidak tersedia** pada sesi ini; verifikasi UI memakai Edge headless + CDP. Perilaku mouse/hover asli (mis. transisi `group-hover`) hanya diturunkan dari CSS, bukan diuji dengan pointer sungguhan.
2. **Views = 1313 hardcode** (`PublicPortfolioView.tsx:122`). Tidak ada analytics/view counter dari Supabase di halaman publik.
3. **Post/tour demo statis** (8 + 6) mendominasi halaman; payload publish hanya menyumbang 3 scene (muncul di folder + viewer). Angka Posts/Tours di hero karenanya tidak merefleksikan project yang dipublish.
4. **Create dan Upload tetap membuka AuthModal meski sudah login** (`:99-101,537-539`); tombol "Masuk" juga menampilkan nama user tetapi tetap membuka modal login. `ProfileModal` tidak bisa diakses dari sini.
5. **Filter search setelah slice**: hasil pencarian bisa kosong untuk item di luar 4/3 kartu pertama, sementara baris info menghitung dari array penuh. Folder tidak ikut dicari.
6. **"Map" bukan peta**: hanya scroll ke kartu "Lokasi & kontak".
7. **Header tidak responsive**: pada 390px tombol Create/Studio/Masuk berada di luar viewport. Folder badge "1 scene" juga terpotong di mobile. Tidak ada menu hamburger.
8. **Hint viewer menyesatkan** pada mode single-panorama: tetap menyebut "klik panah kuning pindah scene" walau tidak ada scene lain (tidak ada counter/arrows).
9. **`item.likes` pada tour card tidak dirender**; hanya badge komentar yang tampil.
10. **Tidak ada** sortir, filter kategori, paginasi bernomor, deep-link per post/tour, tombol share per kartu, skeleton loading, atau halaman 404 khusus (hash tak dikenal → Home).
11. `useEffect` keyboard di `PublicViewerModal.tsx:132-140` tidak punya dependency array — listener dipasang ulang tiap render (aman, tapi tidak optimal).
12. `src/config/theme.ts` adalah tema gelap untuk Studio; halaman publik memakai kelas Tailwind terang (`#f7f9fc`, `#eef2f8`, `#d1005c`) sehingga file tema itu tidak relevan di sini.
13. `updatedAt` dari payload tidak ditampilkan di UI.
14. Tag yang tampil dibatasi 3 per folder (`folder.tags.slice(0,3)`); tag keempat seperti `UI` memang tidak terlihat.

---

## 9. Referensi File & Baris

| File | Baris | Peran |
|---|---|---|
| `src/views/PublicPortfolioView.tsx` | 24-54 | Konstanta `THUMBS`, `PANOS`, `postCards` (8), `tourCards` (6) |
| | 67-116 | `Header` (logo, search, Create/Studio/Bell/Masuk) |
| | 118-150 | `ProfileHeader` (avatar, nama, badge, stats) |
| | 152-158 | `SectionTitle` |
| | 160-197 | `Card` (thumbnail, heart, badge 360°/count/komentar) |
| | 199-227 | `DetailModal` (Jelajahi / Simpan) |
| | 229-256 | `FloatingNav` (Home/Map/Author/Explore) |
| | 258-299 | State + `hashchange` + `loadPublicPayload`/fallback |
| | 301-369 | `sourceScenes`, `uploaded`, `basePosts`, `baseTours`, identitas, filter |
| | 371-381 | Render Header + ProfileHeader |
| | 385-454 | Section Project & folder (accordion) |
| | 456-460 | Baris info pencarian |
| | 462-483 | Section 360° posts + View more |
| | 485-497 | Banner JELAJAHI |
| | 499-520 | Section Virtual tours + View more |
| | 522-540 | Lokasi & kontak + Share your world |
| | 543-562 | DetailModal, PublicViewerModal, FloatingNav |
| `src/lib/publicStore.ts` | 4-53 | Tipe `PublicProfile`, `PublicFolder`, `PublicCreator`, `PublicPayload` |
| | 55-80 | `slug`, `makePublicUid`, `publicShareUrl`, `publicUidFromHash` |
| | 82-105 | `buildPublicFolders` (grouping per `project.title`) |
| | 107-120 | `loadPublicPayload` (GET `/api/public`) |
| | 122-150 | `publishPublicPayload` (POST) |
| `api/public.js` | 3-10,17-41 | `PUBLIC_ID`, `projectId`, handler GET (Supabase) |
| | 43-55 | handler POST (upsert) |
| `src/lib/supabase.ts` | 23-35 | `supabase`, `isServerMode`, `isRemote` |
| `src/lib/navigation.ts` | 1-29 | `currentView`, `navigate`, `navigateCreator`, `creatorFromHash` |
| `src/Root.tsx` | 10-18,28-65 | Lazy view + Shell + AuthModal/UploadModal/toast |
| `src/components/ui/Logo360.tsx` | 12-49 | Logo SVG + teks "virtour360" |
| `src/components/ui/Lightbox.tsx` | 4-29 | Lightbox (tidak dipakai di portfolio) |
| `src/components/ui/AccordionSection.tsx` | 10-29 | Accordion generik (tidak dipakai di portfolio; folder memakai state sendiri) |
| `src/components/auth/AuthModal.tsx` | 50-151 | Modal "Masuk ke Virtour360" yang dipicu header/CTA |
| `src/components/auth/ProfileModal.tsx` | 7-168 | Pengaturan akun (hanya dipakai Studio, `App.tsx:435`) |
| `src/components/viewer/PublicViewerModal.tsx` | 18-121 | Inisialisasi Viewer + VirtualTourPlugin + marker |
| | 123-140 | `go(±1)` dan hotkey Arrow/Escape |
| | 142-178 | Overlay judul, counter, tombol tutup/prev/next, hint |
| `src/context/AppContext.tsx` | 117-128 | Key localStorage (`virtour360.favorites`, dll.) |
| | 190-198 | `getGuestId` (identitas tamu stabil) |
| | 224-265 | State user/favorites + `identityKey` |
| | 779-785 | `toggleFavorite` |
| | 875-902 | `scenes` gabungan (statis + upload + override) |
| `src/data/profile.ts` | 3-16 | Lokasi/email/website/bio (lokal) |
| `src/data/creators.ts` | 23-29 | 5 kreator lokal (dipakai rute `#/portfolio/<id>`) |
| `src/data/scenes.ts` | 6-121 | 3 scene + `project.title`/tags asal folder |
| `src/data/examples.ts` | 18-49,104-158 | Contoh panorama & scene (dipakai Home/viewer) |
| `src/styles/theme.css` | 43-48,64-77,200-218 | `animate-fade-up`, `globe-spin`, `pano-drift` |
| `scripts/seed-supabase.mjs` | 42-94,134-173 | Seed 5 kreator + payload `virtour:public` |
| `FEATURE_DOCS/01-routing-navigasi.md` | 314-329,359-383 | Konteks `sharedUid` vs `creatorId` & viewer publik |

---

## 10. Kesimpulan Singkat

Halaman publik Virtour360 adalah halaman statis-tampil-dinamis: **identitas project** diambil dari folder hasil publish, **statistik sebagian hardcode**, **konten grid sebagian hardcode**, dan **interaksi (accordion, pencarian, like, viewer, scroll nav) sepenuhnya sisi klien**. Pengunjung tanpa akun sudah bisa menjelajahi seluruh fitur kecuali masuk ke Studio; login hanya mengubah perilaku tombol Studio/Bell dan sinkronisasi favorit. Kekurangan utama yang teramati adalah header yang tidak responsive, search yang memfilter setelah pemotongan kartu, dan angka Views yang tidak nyata.
