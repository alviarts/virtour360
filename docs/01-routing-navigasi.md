# Dokumentasi Fitur — Routing & Navigasi Virtour360 (Replika Panoee)

> **Tanggal:** 2026-11-23  
> **Sumber utama:** `C:\Users\visual works\Documents\rea\virtour360`  
> **Aplikasi live:** https://virtour360real.vercel.app/#/p/1x2m270p3j  
> **Status verifikasi:** Source dibaca langsung (file-file relevan tercantum di §11). Aplikasi live diverifikasi lewat endpoint `GET /api/public?id=1x2m270p3j` (mengembalikan 3 scene, 3 folder, 5 kreator, UID sesuai). Browser in-app tidak terhubung pada sesi researcher, sehingga verifikasi UI interaktif live tidak dapat dilakukan; perilaku UI diturunkan dari source dan dicocokkan dengan recon awal (profil "The Gallery", stat 8 Posts / 6 Tours / 1313 Views / 0 Likes, 3 folder, bottom nav Home/Map/Author/Explore) — **semuanya cocok** dengan logika di `PublicPortfolioView.tsx`.

---

## 1. Ringkasan Eksekutif

Virtour360 **tidak menggunakan library router** (tidak ada `react-router-dom` di `package.json:15-28`). Sistem routing dibangun manual di atas **hash URL** (`window.location.hash`) dengan pola `#/...`. Seluruh aplikasi adalah **SPA satu halaman**: server hanya mengirim satu `index.html` untuk semua path berkat rewrite Vercel (`vercel.json:6`). Perubahan hash memicu `hashchange`, lalu `Root.Shell` memetakan hash ke salah satu dari **4 view**: `home`, `portfolio`, `studio`, `dashboard`.

Navigasi dibagi dalam 3 lapisan:

| Lapisan | Mekanisme | Contoh |
|---|---|---|
| Routing utama (view) | Hash + `hashchange` | `#/home`, `#/p/<uid>`, `#/studio` |
| Parameter dalam view | Regex terhadap hash yang sama | `#/portfolio/<creatorId>`, `#/p/<uid>` |
| State UI | React state lokal + `localStorage` (AppContext) | query, kategori, tab, filter, scene aktif, favorit |

---

## 2. Daftar Fitur Routing & Navigasi

| No | Fitur | Deskripsi Singkat | Referensi |
|---|---|---|---|
| F1 | Hash router manual | `currentView()` memetakan hash ke 4 view tanpa library router | `src\lib\navigation.ts:3-10` |
| F2 | Navigasi programatik | `navigate()`, `navigateCreator()`, `navigateHash()` mengubah `window.location.hash` | `src\lib\navigation.ts:12-23` |
| F3 | Hashchange listener | `Root.Shell` sinkron saat hash berubah (back/forward browser termasuk) | `src\Root.tsx:33-37` |
| F4 | 7 pola rute | `#/`, `#/home`, `#/portfolio`, `#/portfolio/:id`, `#/p/:uid`, `#/studio`, `#/dashboard` + fallback | `src\lib\navigation.ts:1-29`, `src\lib\publicStore.ts:71-80` |
| F5 | Deep link publish | `#/p/<uid>` memuat project publik per-UID dari `/api/public?id=<uid>` | `src\lib\publicStore.ts:71-80,108-120`; `api\public.js:30-41` |
| F6 | Deep link kreator | `#/portfolio/<creatorId>` memilih kreator di Home → Portfolio | `src\lib\navigation.ts:21-29`; `src\views\PublicPortfolioView.tsx:267,322-325` |
| F7 | Lazy loading view | 3 view public di-`lazy()` + `Suspense fallback={<Loader/>}` | `src\Root.tsx:10-18,46-55` |
| F8 | Proteksi rute | `studio` & `dashboard` menampilkan `LoginRequired` jika `user === null` | `src\Root.tsx:31,41-42`; `src\components\auth\LoginRequired.tsx:7-46` |
| F9 | Redirect pasca-login | Setelah login/register berhasil → `navigate("studio")` | `src\components\auth\AuthModal.tsx:34-47` |
| F10 | Fallback rute tak dikenal | Hash yang tidak cocok → render `PublicHomeView` (tanpa mengubah URL) | `src\lib\navigation.ts:9` |
| F11 | Header Home | Nav Jelajahi/Kategori (scroll), Portofolio (route), Create/Studio/Masuk (route atau auth) | `src\views\PublicHomeView.tsx:110-155` |
| F12 | Header Portfolio | Logo→Home, search "Cari karya", Create, Studio, Masuk/avatar | `src\views\PublicPortfolioView.tsx:67-116,373` |
| F13 | Bottom/floating nav | Home/Map/Author/Explore (scroll ke section) di 2 view public | `src\views\PublicHomeView.tsx:367-372`; `src\views\PublicPortfolioView.tsx:229-256,562` |
| F14 | CTA "JELAJAHI" | Tombol di banner → `navigate("home")` | `src\views\PublicPortfolioView.tsx:485-497` |
| F15 | "View more"/"View less" | Toggle `allPosts` / `allTours` (state lokal, bukan route) | `src\views\PublicPortfolioView.tsx:264-265,476-482,513-519` |
| F16 | "Browse more" | Reset kategori + query di Home (state lokal) | `src\views\PublicHomeView.tsx:217` |
| F17 | Search tidak di URL | Query pencarian disimpan di `useState`, tidak di query string | `PublicHomeView.tsx:25,190-195`; `PublicPortfolioView.tsx:260,89-95` |
| F18 | State lintas view | `AppContext` membagi user, scenes, favorites, activeSceneId, modals, toast | `src\context\AppContext.tsx:55-113,904-958` |
| F19 | State di localStorage | 12 key `virtour360.*` + session + token auth | `src\context\AppContext.tsx:117-128`; `src\lib\authToken.ts` |
| F20 | Viewer publik | `PublicViewerModal` dengan VirtualTourPlugin, node/link/marker, panah & keyboard | `src\components\viewer\PublicViewerModal.tsx:18-179` |
| F21 | Viewer studio | `TourViewer` + MiniMap, side menu, tour graph, kotak prev/next | `src\components\viewer\TourViewer.tsx:104-240`; `src\App.tsx:325-380` |
| F22 | Hotspot navigasi | Hotspot `type:"scene"` + `targetSceneId` berpindah node; `type:"link"` → `window.open` | `src\hooks\useTourViewer.ts:180-194`; `PublicViewerModal.tsx:55-57,92-112` |
| F23 | Hotkey viewer | Arrow kiri/kanan, `R`, `+`/`-`, `F` (studio); Esc + Arrow (publik) | `src\hooks\useHotkeys.ts:12-45`; `PublicViewerModal.tsx:132-140` |
| F24 | Loading state | `Loader` Suspense + spinner "Menyiapkan panorama" saat viewer belum ready | `src\Root.tsx:20-26`; `src\App.tsx:406-413` |
| F25 | Fallback data publik | Gagal fetch / tidak ada payload → data lokal (scenes statis + profil) | `src\views\PublicPortfolioView.tsx:276-305`; `api\public.js:30-41` |
| F26 | SPA rewrite Vercel | Semua path → `/index.html`; cache immutable untuk `/media/*` | `vercel.json:6-13` |
| F27 | Embed URL | Kode iframe mengarah ke `/#/portfolio` | `src\components\auth\EmbedModal.tsx:4,8` |

---

## 3. Cara Kerja Router (Hash-Based)

### 3.1 Pemetaan view (`src\lib\navigation.ts:1-10`)

```ts
export type View = "home" | "studio" | "dashboard" | "portfolio"

export function currentView(): View {
  const hash = window.location.hash.replace(/^#\/?/, "")
  if (hash.startsWith("dashboard")) return "dashboard"
  if (hash.startsWith("studio")) return "studio"
  if (hash.startsWith("portfolio") || hash.startsWith("p/")) return "portfolio"
  if (hash.startsWith("home") || hash === "") return "home"
  return "home"
}
```

**Poin penting:**
- Prefix `#/` atau `#` dihapus dengan regex `/^#\/?/`, jadi `#home`, `#/home`, dan `#/` semua dikenal.
- Pencocokan memakai **`startsWith`**, bukan equal. Konsekuensinya `#/portfolioApaSaja` tetap dianggap `portfolio`, dan `#/p/anything` juga `portfolio`. Tidak ada validasi ketat.
- Urutan pengecekan: `dashboard` → `studio` → `portfolio`/`p/` → `home` → fallback `home`.
- **Tidak ada normalisasi URL**: hash tak dikenal tetap tertulis di address bar, hanya tampilannya yang jadi Home.

### 3.2 Fungsi navigasi (`src\lib\navigation.ts:12-29`)

| Fungsi | Output hash | Dipakai di |
|---|---|---|
| `navigate("home")` | `#/home` | App.tsx:293, LoginRequired.tsx:34, PublicPortfolioView.tsx:84,493, PublicHomeView.tsx:360,370 |
| `navigate("portfolio")` | `#/portfolio` | PublicHomeView.tsx:118,360,370; DashboardView.tsx:159,242; App.tsx:275 |
| `navigate("studio")` | `#/studio` | PublicHomeView.tsx:123,130; DashboardView.tsx:23,139; App.tsx (via AuthModal:47) |
| `navigate("dashboard")` | `#/dashboard` | App.tsx:272; LeftSidebar.tsx:149 |
| `navigateCreator(id)` | `#/portfolio/<id>` | PublicHomeView.tsx:310 |
| `navigateHash(path)` | bebas (mis. `#/p/x`) | **Helper tersedia tetapi tidak dipakai** di source saat ini |

`publicShareUrl(uid)` (`src\lib\publicStore.ts:71-74`) membentuk `${origin}/#/p/${encodeURIComponent(uid)}`; `publicUidFromHash()` (`:77-80`) membaca balik dengan regex `/^#\/p\/([^/?]+)/` + `decodeURIComponent`.

### 3.3 Daftar rute lengkap

| Hash | View yang dirender | Param yang dibaca | Catatan |
|---|---|---|---|
| `#/` atau kosong | `PublicHomeView` | — | Default. `currentView()` mengembalikan `home`. |
| `#/home` | `PublicHomeView` | — | Hash yang ditulis `navigate("home")`. |
| `#/portfolio` | `PublicPortfolioView` | `creatorFromHash()` → `null` | Profil publik default / hasil publish terakhir. |
| `#/portfolio/<creatorId>` | `PublicPortfolioView` | `creatorId` (decode URI) | Kreator dipilih dari kartu di Home. `creatorPosts` menggantikan `basePosts`. |
| `#/p/<uid>` | `PublicPortfolioView` | `uid` | **Link publish per project**. `displayName` = `folders[0].name` (mis. "The Gallery"), badge `by Project · /p/<uid>`. |
| `#/studio` | `App` (editor) | `activeSceneId` dari context (bukan URL) | Butuh login. |
| `#/dashboard` | `DashboardView` | — | Butuh login. |
| `#/apa-saja` | `PublicHomeView` | — | Fallback senyap, URL tidak diubah. |

### 3.4 Deep link & refresh

Karena router berbasis hash:

1. Browser **tidak pernah mengirim hash ke server**. Permintaan untuk `https://virtour360real.vercel.app/#/p/1x2m270p3j` dikirim sebagai `GET /`.
2. `vercel.json:6` melakukan rewrite `/(.*)` → `/index.html`, sehingga SPA shell selalu tersedia (terverifikasi: `webfetch` ke root mengembalikan HTML dengan judul "Virtour360 — Studio Virtual Tour").
3. React mount → `Root.Shell` memanggil `currentView()` → `portfolio`.
4. `PublicPortfolioView` mount → `loadPublicPayload(publicUidFromHash())` (`src\views\PublicPortfolioView.tsx:276-299`) → `GET /api/public?id=1x2m270p3j`.
5. Endpoint (`api\public.js:30-41`) mencari state `virtour:pub:<uid>` di tabel `virtour_state`, fallback ke `virtour:public`; mengembalikan payload.
6. Halaman merender profil "The Gallery" (dari `folders[0].name`), 3 folder, 8 post + 6 tour, stat 1313 Views (hardcoded di `PublicPortfolioView.tsx:122`), Likes = `favorites.length` (0 untuk pengunjung baru).

**Refresh di `#/studio` / `#/dashboard`:** setelah SPA mount, `isPrivate && !user` → `LoginRequired` (`src\Root.tsx:31,41-42`). Jika session token masih valid, `AppProvider` memulihkan user via `GET /api/auth` (`src\context\AppContext.tsx:283-298`) sebelum render, sehingga rute privat langsung terbuka.

**Back/forward browser:** `hashchange` → `setView(currentView())` (`Root.tsx:33-37`) dan `setCreatorId(creatorFromHash())` (`PublicPortfolioView.tsx:270-274`). Keduanya bereaksi, jadi tombol back browser bekerja antar view.

---

## 4. Struktur Halaman / View — Kapan Dirender

### 4.1 Pohon render

```
src\main.tsx:5  createRoot(#root).render(<Root/>)
└── src\Root.tsx:67-73  <AppProvider>            ← state global
    └── src\Root.tsx:28-65  <Shell>
        ├── isPrivate && !user  → <LoginRequired area="Studio|Dashboard"/>
        ├── view === "studio"   → <App/>           ← editor (tidak lazy)
        ├── view === "dashboard"→ <Suspense><DashboardView/></Suspense>
        ├── view === "portfolio"→ <Suspense><PublicPortfolioView/></Suspense>
        └── else (home/fallback)→ <Suspense><PublicHomeView/></Suspense>
        ├── <AuthModal/>  (selalu terpasang; render null jika !authOpen)
        ├── <UploadModal/> (selalu terpasang)
        └── toast fixed bottom-20 (jika toast !== null)
```

### 4.2 Tabel view

| View | Komponen | Lazy? | Kapan dirender | Fungsi utama |
|---|---|---|---|---|
| Home | `PublicHomeView` | Ya (`Root.tsx:16-18`) | `hash` kosong/`home`/tak dikenal | Hero, typed search placeholder, Trending, Kreator, Kategori, CTA, footer, floating nav, `PublicViewerModal` |
| Portfolio | `PublicPortfolioView` | Ya (`Root.tsx:13-15`) | `portfolio`, `p/...`, `portfolio/:id` | Header + search, profil/stat, folder publish, 360° posts, banner JELAJAHI, virtual tours, lokasi & kontak, share, `DetailModal`, `PublicViewerModal`, `FloatingNav` |
| Dashboard | `DashboardView` | Ya (`Root.tsx:10-12`) | `dashboard` **dan** sudah login | KPI, tab live/studio, filter grid/list, kartu project, `— View Public Profile` |
| Studio | `App` | Tidak | `studio` **dan** sudah login | `TopBar`, `LeftSidebar`, `TourViewer`, `RightPanel`, `SettingsPopover`, popover account/suggestions, modals (Profile/Embed/Publish/MediaPicker/Lightbox) |

### 4.3 Catatan struktur

- `App.tsx` adalah **editor penuh** (bukan sekadar viewer): `AppShell` membungkus TopBar + sidebar + viewer + inspector. Mode `preview` (`App.tsx:109,223,325,365-367,382`) menyembunyikan chrome editor dan memberi tombol "Keluar pratinjau" di viewer.
- `DashboardView.openProject()` (`src\views\DashboardView.tsx:137-140`) melakukan `setActiveSceneId(scene.id)` **lalu** `navigate("studio")` — ini jembatan state antar-view yang penting: scene yang diklik di dashboard langsung aktif di editor.
- `useTourViewer` juga menyinkronkan `options.activeSceneId` dari context ke node viewer (`src\hooks\useTourViewer.ts:439-446`).

---

## 5. Navigasi Antar Tampilan

### 5.1 Header Public Home (`src\views\PublicHomeView.tsx:110-155`)

| Elemen | Aksi | Rute/EFek | Baris |
|---|---|---|---|
| Logo360 | `scrollTo("home-root")` | Scroll ke atas (bukan ganti rute) | 112-114 |
| "Jelajahi" | `scrollTo("home-explore")` | Scroll ke Trending | 116 |
| "Kategori" | `scrollTo("home-categories")` | Scroll ke kategori | 117 |
| "Portofolio" | `navigate("portfolio")` | `#/portfolio` | 118 |
| "Create" | `user ? navigate("studio") : setAuthOpen(true)` | `#/studio`atau modal login | 122-128 |
| "Studio" | sama seperti Create | `#/studio` atau modal login | 129-135 |
| Bell | `notify("Tidak ada notifikasi baru.")` | Toast | 137-140 |
| Avatar/initials + nama | `navigate("dashboard")` | `#/dashboard` | 141-153 |
| "Masuk" (guest) | `setAuthOpen(true)` → sukses → `#/studio` | Modal → studio | 141-153, `AuthModal.tsx:47` |
| Tombol "Cari" | `scrollTo("home-explore")` | Scroll, bukan submit | 197-199 |

### 5.2 Header Public Portfolio (`src\views\PublicPortfolioView.tsx:67-116`)

| Elemen | Aksi | Baris |
|---|---|---|
| Logo360 | `navigate("home")` → `#/home` ("Kembali ke Home") | 84-86 |
| Input search "Cari karya" | `onQuery(setQuery)` — filter lokal `posts`/`tours` | 87-96, 367-369 |
| Tombol X di search | `onQuery("")` | 95 |
| "Create" | `setAuthOpen(true)` (selalu buka modal, bukan langsung studio) | 99-101, 373 |
| "Studio" | `userName ? navigate("studio") : onLogin()` | 102-104 |
| Bell (jika login) | toast | 105-109 |
| Nama user / "Masuk" | `onLogin()` → `setAuthOpen(true)` | 110-112 |

> Perbedaan penting: Create di **Home** sudah login → langsung Studio; Create di **Portfolio** selalu membuka modal auth (`PublicPortfolioView.tsx:373`).

### 5.3 Header Dashboard (`src\views\DashboardView.tsx:148-209`)

| Elemen | Aksi | Baris |
|---|---|---|
| BrandLogo | `navigate("studio")` → `#/studio` | 21-27, 151 |
| Nav "Project" | `notify(...)` (tetap di halaman) | 153-160 |
| Nav "Media" | `setUploadOpen(true)` | 153-160 |
| Nav "Portofolio" | `navigate("portfolio")` → `#/portfolio` | 153-160 |
| "New Project" | `setUploadOpen(true)` | 178-183 |
| Avatar (popover) | Login/logout; popover di `184-206` | 184-206 |
| "— View Public Profile" | `navigate("portfolio")` → `#/portfolio` | 242-244 |

### 5.4 Studio — popover account (`src\App.tsx:258-312`)

| Menu | Aksi | Baris |
|---|---|---|
| Pengaturan akun | `setProfileOpen(true)` | 266-268 |
| Unggah panorama 360° | `openUpload()` | 269-271 |
| Buka Dashboard | `navigate("dashboard")` | 272-274 |
| Kembali ke Portofolio user | `navigate("portfolio")` | 275-277 |
| Embed portofolio | `setEmbedOpen(true)` (iframe `/#/portfolio`) | 278-280, `EmbedModal.tsx:8` |
| Salin link publish | `publicShareUrl(publishedUid)` → clipboard | 281-292 |
| Kembali ke Home | `navigate("home")` | 293-295 |
| Keluar / Masuk-Daftar | `logout()` / `setAuthOpen(true)` | 296-310 |

`publishedUid` diambil dari `localStorage.getItem("virtour360.publishedUid")` saat mount (`App.tsx:117-119`) dan disimpan lagi setelah publish (`:443-447`).

### 5.5 Bottom nav / floating nav

**Home** (`PublicHomeView.tsx:367-372`) — semua tombol adalah **scroll**, bukan rute:

| Tombol | Target |
|---|---|
| Home | `scrollTo("home-root")` |
| Jelajahi | `scrollTo("home-explore")` |
| Author | `navigate("portfolio")` ← **satu-satunya yang ganti rute** |
| Explore | `scrollTo("home-categories")` |

**Portfolio** (`PublicPortfolioView.tsx:229-256`) — semua **scroll** dalam `#portfolio-root`:

| Tombol | Target (`id`) |
|---|---|
| Home | scroll ke atas `#portfolio-root` |
| Map | `portfolio-map` ("Lokasi & kontak", baris 522-528) |
| Author | `portfolio-author` (ProfileHeader, baris 126) |
| Explore | `portfolio-explore` (360° posts, baris 462) |

### 5.6 Breadcrumb, tombol kembali, CTA, "View more"

| Elemen | Lokasi | Perilaku |
|---|---|---|
| Breadcrumb eksplisit | — | **Tidak ada.** Tidak ada komponen breadcrumb di source. |
| "Kembali ke Home" | Logo di Header Portfolio (`PublicPortfolioView.tsx:84`) | `navigate("home")` + `title`/`aria-label` |
| "Kembali ke publik" | `LoginRequired.tsx:33-38` | `navigate("home")` |
| "Kembali ke publik" | `AuthModal.tsx:138-144` | Tutup modal saja (tetap di view saat ini) |
| "Kembali ke Portofolio user" | `App.tsx:275-277` | `navigate("portfolio")` |
| "JELAJAHI →" | `PublicPortfolioView.tsx:485-497` | `navigate("home")` |
| "View more"/"View less" (posts) | `PublicPortfolioView.tsx:476-482` | toggle `allPosts`; tampil jika `posts.length > 4` |
| "View more"/"View less" (tours) | `PublicPortfolioView.tsx:513-519` | toggle `allTours`; tampil jika `tours.length > 3` |
| "Browse more →" | `PublicHomeView.tsx:217` | `setCategory("Semua"); setQuery("")` |
| "View Public Profile" | `DashboardView.tsx:242-244` | `navigate("portfolio")` |
| "Upload your own 360 →" | `PublicHomeView.tsx:350-352`; `PublicPortfolioView.tsx:537-539` | `setAuthOpen(true)` |

### 5.7 Matriks transisi antar view

| Dari \ Ke | Home | Portfolio | Studio | Dashboard |
|---|---|---|---|---|
| Home | — | Nav "Portofolio", footer, bottom "Author", kartu kreator (`navigateCreator`) | Create/Studio (login) | Avatar (login) |
| Portfolio | Logo, "JELAJAHI" | — | Tombol Studio (login) | — (lewat Studio → account) |
| Studio | Account → "Kembali ke Home" | Account → "Kembali ke Portofolio user" | — | Account → "Buka Dashboard", LeftSidebar `moreOpen` |
| Dashboard | via LoginRequired "Kembali ke publik" | "View Public Profile", nav "Portofolio" | Logo, `openProject()` | — |

---

## 6. Parameter URL, Query/Hash, dan State

### 6.1 Apa yang **ada di URL**

Hanya **hash**, dengan dua bentuk parameter:

```js
// src\lib\publicStore.ts:77-80
window.location.hash.match(/^#\/p\/([^/?]+)/)          // → uid project publish

// src\lib\navigation.ts:26-29
window.location.hash.match(/^#\/portfolio\/([^/?]+)/)  // → id kreator
```

Keduanya memakai `decodeURIComponent`. Tidak ada penggunaan `?` / `URLSearchParams` untuk state aplikasi di seluruh source. (Tanda `?` justru dipakai sebagai negasi lookahead `[^/?]+` agar param berhenti sebelum query string.)

### 6.2 Apa yang **tidak ada di URL** (state lokal / global)

| State | Tempat | Baris | Hilang saat refresh? |
|---|---|---|---|
| `query` pencarian Home | `useState` di PublicHomeView | `:25` | Ya |
| `category` Home | `useState` | `:26` | Ya |
| `typed` (efek mengetik placeholder) | `useState` + interval | `:30,34-63` | Ya |
| `exploring` / `exploringScenes` (viewer modal) | `useState` | `:27-28` | Ya |
| `query`, `detail`, `exploring` Portfolio | `useState` | `:260-262` | Ya |
| `allPosts`, `allTours`, `openFolder` | `useState` | `:264-266` | Ya |
| `creatorId` | `useState` + `hashchange` | `:267,270-274` | **Tidak** (berasal dari hash) |
| `sharedUid` | dibaca langsung dari hash saat render | `:328` | **Tidak** |
| `tab`, `view`, `source`, `category`, `showNotice`, `accountOpen` Dashboard | `useState` | `:113-119` | Ya |
| `activeSceneId` | `AppContext` (awal `"atrium"`) | `AppContext.tsx:252` | Ya (kecuali di-set ulang dari Dashboard) |
| `user` | `localStorage virtour360.session` + token | `AppContext.tsx:225,283-298` | Tidak |
| `favorites` | `localStorage virtour360.favorites` | `AppContext.tsx:123,234,779-785` | Tidak |
| `hotspotOverrides`, `mediaOverrides`, `effectsByScene`, `groups`, `sceneOrder`, `sceneGroupOverrides`, `imageQuality` | `localStorage` | `AppContext.tsx:121-128` | Tidak |
| `publishedUid` | `localStorage virtour360.publishedUid` | `App.tsx:117-119,443-447` | Tidak |
| `preview`, `settingsOpen`, `showMiniMap`, `showSideMenu`, `showGraph`, modals | `useState` di App | `App.tsx:106-121` | Ya |
| `authOpen`, `uploadOpen`, `replaceSceneId`, `toast` | `AppContext` (React state) | `AppContext.tsx:255-258` | Ya |

### 6.3 State sharing antar view

`AppProvider` (`src\context\AppContext.tsx:224-958`) membungkus `Shell`, sehingga **semua view** berbagi instance yang sama:

- `scenes` (gabungan `staticScenes` + panorama upload + override hotspot/media/audio/grup, diurutkan `sceneOrder`) — `:875-902`.
- `setActiveSceneId` → dipakai `DashboardView.openProject` agar scene pilihan ikut ke Studio.
- `user` / `setAuthOpen` → dipakai semua header untuk memutuskan route vs login.
- `favorites` / `toggleFavorite` → dipakai Card di Home & Portfolio; `Likes` di profil = `favorites.length`.
- `notify` → toast global di `Root.tsx:58-62`.
- Viewer state (scene aktif, hotspot, view) **tidak** dibagikan ke URL; hanya lewat context + event Photo Sphere Viewer.

Mode remote (Supabase) menambah `identityKey = user ? "user:<email>" : "guest:<guestId>"` (`AppContext.tsx:262-265`) dengan sinkronisasi debounce 800 ms (`:366-392`).

### 6.4 Perilaku `sharedUid` vs `creatorId` di Portfolio (`PublicPortfolioView.tsx:322-365`)

```ts
const selected = remoteCreator ?? localCreator ?? null
const sharedUid = publicUidFromHash()
const projectName = publicData?.folders?.[0]?.name ?? publicData?.scenes?.[0]?.project?.title ?? null
const displayName = sharedUid ? projectName ?? "Project Virtour360"
                              : selected?.name ?? publicData?.profile.name ?? user?.name ?? "Kreator Virtour360"
const posts = creatorPosts.length ? creatorPosts : basePosts
```

Artinya:
- `#/p/<uid>` → identitas **project** (folder pertama), bukan profil user. Inilah sebabnya recon menampilkan "The Gallery" walaupun `profile.name` di payload adalah `"awe"`.
- `#/portfolio/<creatorId>` → identitas **kreator** dari `publicData.creators` atau `LOCAL_CREATORS`.
- `#/portfolio` (tanpa param) → profil hasil publish / user login / fallback "Kreator Virtour360".

---

## 7. Loading, Fallback, 404, Redirect, Proteksi Rute

| Skenario | Perilaku | Referensi |
|---|---|---|
| View public lazy belum termuat | `<Loader/>`: "Memuat⬦" (grid penuh, bg zinc-950) | `Root.tsx:20-26,46` |
| Viewer Photo Sphere belum `ready` | Overlay spinner + teks "Menyiapkan panorama⬦" di area editor | `App.tsx:406-413` |
| Transisi antar scene di studio | `transitionOptions.showLoader: true`, efek fade + rotasi | `useTourViewer.ts:134-139` |
| Hash tidak dikenal | Render Home, **tanpa redirect URL** (bukan 404) | `navigation.ts:9` |
| Halaman 404 khusus | **Tidak ada.** Tidak ada komponen/route NotFound di source. | (seluruh `src`) |
| `#/studio` / `#/dashboard` tanpa login | `<LoginRequired area="..."/>` + tombol "Masuk sekarang" & "Kembali ke publik" | `Root.tsx:31,41-42`; `LoginRequired.tsx:7-46` |
| Login/register berhasil | Modal ditutup, toast, `navigate("studio")` | `AuthModal.tsx:39-47` |
| Session token tidak valid saat restore | `setAuthToken("")`, user tetap null → rute privat terkunci | `AppContext.tsx:283-298` |
| `loadPublicPayload()` gagal / payload null | Portfolio memakai fallback: profil dari `user ?? "Ardhana Wicaksono"`, `scenes` dari context, `folders: buildPublicFolders(scenes)` | `PublicPortfolioView.tsx:276-299`; `publicStore.ts:108-120` |
| Home tidak ada payload | Tetap menampilkan `ITEMS` + `LOCAL_CREATORS` | `PublicHomeView.tsx:79-93,270-282` |
| API tanpa env Supabase | GET → `200 { payload: null }`; POST → `500` | `api\public.js:20-26` |
| UID publish tidak ada di DB | Endpoint fallback ke state lama `virtour:public` (`PUBLIC_ID`) | `api\public.js:3,30-41` |
| UID mengandung karakter aneh | `projectId()` membersihkan ke `[a-zA-Z0-9-_]`, max 40 char | `api\public.js:5-10` |
| Marker/scene tujuan tidak ada | `onNotify("Scene tujuan tidak ditemukan.")` / catch di `goToScene` | `useTourViewer.ts:185-187,492-497` |
| Gyroskop tidak tersedia | Toast "Gyroskop tidak tersedia di perangkat/browser ini." | `useTourViewer.ts:545-558`; `App.tsx:94-98` |
| Audio gagal diputar | Toast "Audio tidak dapat diputar di browser ini." | `TourViewer.tsx:93-102` |
| localStorage penuh/diblokir | `readJSON`/`persist` menelan error | `AppContext.tsx:130-145` |
| Ganti akun | Workspace lokal dibersihkan agar tidak mewarisi data akun lama | `AppContext.tsx:173-188,403-483` |

---

## 8. Interaksi Navigasi di Viewer

### 8.1 Viewer publik — `PublicViewerModal` (`src\components\viewer\PublicViewerModal.tsx`)

Dipakai oleh Home (`:374-382`) dan Portfolio (`:553-561`).

**Konstruksi node** (`:43-74`):
- `VirtualTourPlugin` dengan `dataMode:"client"`, `renderMode:"2d"`.
- `links` berasal dari hotspot `type === "scene"` + `targetSceneId` → `{ nodeId, position:{yaw,pitch} }` (`:55-57`).
- Marker untuk hotspot non-scene dirender sebagai HTML `.hs-marker` dengan warna/efek/bentuk/label dari `style` (`:58-70`).
- `startNodeId` = `sceneId` jika valid, else node pertama (`:72`).
- Transisi: `speed:"16rpm"`, `effect:"fade"`, `rotation:true` (`:73`).

**Navigasi:**
| Interaksi | Implementasi | Baris |
|---|---|---|
| Klik panah 3D kuning (link antar scene) | Native VirtualTourPlugin `links` | 55-57 |
| Klik marker bertarget scene | `select-marker` → `tourPlugin.setCurrentNode(target)` | 92-99 |
| Fallback klik marker (event PSV tidak terpicu) | `closest("[data-hs-id]")` → cari hotspot → `setCurrentNode` | 101-112 |
| Tombol ChevronLeft/Right (muncul jika `scenes.length > 1`) | `go(±1)` dengan modulo wrapping | 123-130, 163-172 |
| Keyboard ArrowLeft/ArrowRight | `go(∓1)` | 132-140 |
| Keyboard Escape | `onClose()` | 132-135 |
| Perubahan node | Event `node-changed` → update `currentTitle` & `currentIndex` | 85-90 |
| Info "1 / 3 scene" | `currentIndex + 1 / scenes.length` | 150-152 |
| Hint bawah | "Geser untuk melihat 360° · scroll zoom · klik panah kuning pindah scene · Esc keluar" | 174-176 |

> Catatan: `useEffect` keyboard di `:132-140` **tanpa dependency array**, sehingga listener dipasang/dilepas setiap render — aman tetapi tidak optimal.

### 8.2 Viewer studio — `TourViewer` + `useTourViewer`

| Interaksi | Implementasi | Referensi |
|---|---|---|
| Klik thumbnail sidebar | `LeftSidebar onSelect={tour.goToScene}` | `App.tsx:314-321` |
| Kotak "360 berikutnya" (prev/next) | `prevScene`/`nextScene` dihitung modulo dari `currentIndex`; tombol disabled jika tidak ada | `App.tsx:158,368-371`; `TourViewer.tsx:187-212` |
| Panah di panorama (VirtualTourPlugin link) | `onNodeChanged` → `setCurrentSceneId` + `options.onSceneChange(id)` → `setActiveSceneId` | `useTourViewer.ts:174-179`; `App.tsx:148-150` |
| Hotspot `scene` → pindah node | `select-marker` → `tour.setCurrentNode(targetSceneId)` | `useTourViewer.ts:180-188` |
| Hotspot `link` → buka tab baru | `window.open(spot.href, "_blank", "noopener,noreferrer")` | `useTourViewer.ts:189-192` |
| Hotspot lain → panel inspector | `setSelectedHotspot(spot)` | `useTourViewer.ts:193` |
| ArrowLeft/ArrowRight | `goRelative(-1/+1)` → `tour.goToScene(next.id)` | `App.tsx:178-193`; `useHotkeys.ts:19-24` |
| `R` / `r` | `tour.resetView()` | `useHotkeys.ts:25-28`; `useTourViewer.ts:499-503` |
| `+` / `=` dan `-` | `zoomBy(±6)` | `useHotkeys.ts:29-35`; `useTourViewer.ts:512-518` |
| `F` / `f` | `toggleFullscreen()` | `useHotkeys.ts:36-39`; `App.tsx:156` |
| Mini-map | `onSeek={tour.rotateTo}` mengarahkan yaw | `TourViewer.tsx:112`; `useTourViewer.ts:505-510` |
| Side menu (opsi settings) | Daftar scene cepat → `onSelectScene(item.id)` | `TourViewer.tsx:114-129`; `App.tsx:114-116,354` |
| Tour graph (opsi settings) | Rantai scene `A → B → C`, klik → `onSelectScene` | `TourViewer.tsx:131-150` |
| Place hotspot | `startPlacement(type, icon)` → klik panorama → `placeHotspot()` | `useTourViewer.ts:239-313,464-490,567-578`; `App.tsx:160-176,197-212` |
| Drag hotspot | pointerdown pada `[data-hs-id]` → update marker langsung → simpan saat pointerup | `useTourViewer.ts:315-407` |
| Undo | `undoEdit()` (maks 20 riwayat) | `AppContext.tsx:611-617,649-660`; `App.tsx:205-206` |
| Pilih hotspot dari RightPanel | `selectHotspotById` → `viewer.animate({yaw,pitch})` | `useTourViewer.ts:580-585`; `App.tsx:386-392` |
| Keluar pratinjau | `onExitPreview` → `setPreview(false)` | `TourViewer.tsx:162-169`; `App.tsx:367` |

---

## 9. Verifikasi terhadap Aplikasi Live

Endpoint publik dikonfirmasi (2026-11-23):

```
GET https://virtour360real.vercel.app/api/public?id=1x2m270p3j
→ { uid: "1x2m270p3j",
    scenes: [atrium, studio, terrace],
    folders: [The Gallery, Creative Room, Sunset Terrace],
    profile.name: "awe",
    creators: [creator-1 … creator-5],
    updatedAt: "2026-11-22T13:46:19.311Z" }
```

Penjelasan recon awal vs source:

| Recon | Penjelasan berdasarkan source |
|---|---|
| Profil "The Gallery" | `displayName = folders[0].name` karena `sharedUid` aktif (`PublicPortfolioView.tsx:328-336`) |
| 8 Posts | `postCards.length = 8` (`:36-45`) + 0 upload → `posts.length` |
| 6 Tours | `tourCards.length = 6` (`:47-54`) |
| 1313 Views | String hardcoded di `ProfileHeader` (`:122`) |
| 0 Likes | `favorites.length` = 0 untuk pengunjung tanpa session (`:379`) |
| 3 folder | Dari `payload.folders`, dirender di `:385-454` |
| Header "Cari karya", Create/Studio/Masuk | `Header()` di `:87-112` |
| Bottom nav Home/Map/Author/Explore | `FloatingNav()` di `:229-256` |

Root URL mengembalikan SPA shell (judul "Virtour360 — Studio Virtual Tour"), konsisten dengan rewrite `vercel.json:6`.

---

## 10. Catatan Keterbatasan & Temuan

1. **Tanpa library router.** Tidak ada nested route, route guard deklaratif, atau `Link`. Semua navigasi = assignment `window.location.hash`. Back/forward bekerja karena `hashchange`, bukan karena history API.
2. **`startsWith` terlalu longgar.** `navigation.ts:5-8`: hash `#/dashboardX` → Dashboard, `#/pXYZ` → Portfolio. Tidak ada validasi format UID/ID di `currentView()`.
3. **Fallback tanpa redirect.** Hash salah tetap di address bar; hanya konten yang jadi Home. Tidak ada 404.
4. **Perpindahan UID sesi yang sama tidak memuat ulang data.** `PublicPortfolioView` hanya memanggil `loadPublicPayload(publicUidFromHash())` saat mount (`:276-299`, deps `[]`). Jika hash berubah dari `#/p/A` ke `#/p/B` **tanpa view unmount** (mis. dari dalam portfolio), `publicData` masih milik A walaupun `sharedUid`/badge berubah. Hal yang sama berlaku untuk perubahan `creatorId` yang tidak ada di `publicData.creators`.
5. **`p/` dan `portfolio/` berbagi view tetapi berbeda semantics.** `#/p/:uid` = project publish; `#/portfolio/:id` = kreator. Keduanya masuk `PublicPortfolioView`, jadi tidak ada halamankhusus "project viewer" terpisah.
6. **Scene aktif tidak pernah masuk URL.** Refresh di Studio selalu kembali ke `activeSceneId` awal `"atrium"` (`AppContext.tsx:252`), bukan scene terakhir. Tidak bisa deep-link ke scene tertentu.
7. **Query pencarian, filter, tab, dan ekspansi card tidak bisa di-bookmark.** Semuanya `useState` lokal.
8. **Tidak ada breadcrumb.** "Kembali" hanya tersedia lewat logo, CTA, atau tombol eksplisit yang disebut di §5.6.
9. **Bottom nav di Portfolio bukan navigasi antar-view** — semuanya `scrollIntoView`. Di Home, hanya "Author" yang benar-benar berpindah rute.
10. **`navigateHash()` tidak terpakai** (`navigation.ts:16-18`) — helper siap pakai untuk hash bebas, tetapi tidak ada caller.
11. **Listener keyboard di `PublicViewerModal` dipasang tiap render** (tanpa deps array, `:132-140`), potensi duplikasi listener jika ada render cepat.
12. **Proteksi rute bersifat UI-only.** `LoginRequired` menyembunyikan konten, bukan pengaman data; RLS di `supabase/schema.sql:28-37` sengaja permisif (`using (true)`) untuk demo 2–5 orang dan README `:105-106` memperingatkannya.
13. **Mode tanpa DB tetap lengkap untuk navigasi**, tetapi link publish `#/p/<uid>` tidak menghasilkan data baru (API mengembalikan `payload:null` → fallback lokal), sehingga "Salin link publish" hanya muncul jika `publishedUid` tersimpan (`App.tsx:281`).
14. **Verifikasi browser live tidak dilakukan** karena desktop browser tidak terhubung ke sesi subagent; temuan UI bersumber dari source + endpoint API + recon awal yang diberikan. Jika diperlukan, verifikasi lanjutan sebaiknya mengecek: klik logo Portfolio → `#/home`, tombol Studio guest → modal auth → `#/studio`, dan panah prev/next di viewer.

---

## 11. Indeks Referensi File

| File | Peran routing/navigasi | Baris kunci |
|---|---|---|
| `src\main.tsx` | Entry point | 5 |
| `src\Root.tsx` | Router switch, lazy, guard, listener, toast | 1-73 |
| `src\App.tsx` | Editor/studio, account nav, viewer, hotkeys, loading | 103-454 |
| `src\lib\navigation.ts` | `View`, `currentView`, `navigate`, `navigateCreator`, `creatorFromHash` | 1-29 |
| `src\lib\publicStore.ts` | UID, share URL, hash parser, fetch publish | 63-80, 108-150 |
| `src\views\PublicHomeView.tsx` | Home header, search, floating nav, viewer trigger | 23-385 |
| `src\views\PublicPortfolioView.tsx` | Portfolio header, folder, View more, JELAJAHI, map, viewer | 67-565 |
| `src\views\DashboardView.tsx` | Dashboard nav, openProject → studio | 19-27,112-335 |
| `src\components\viewer\PublicViewerModal.tsx` | Viewer publik, node/link/marker, panah, Esc | 18-179 |
| `src\components\viewer\TourViewer.tsx` | MiniMap, side menu, graph, prev/next, placement HUD | 104-240 |
| `src\hooks\useTourViewer.ts` | Event node/marker, goToScene, sync activeSceneId, hotkey helpers | 94-622 |
| `src\hooks\useHotkeys.ts` | Arrow/R/+/-/F | 12-45 |
| `src\context\AppContext.tsx` | State global, localStorage, auth, scenes | 55-113,117-128,224-958 |
| `src\components\auth\AuthModal.tsx` | Redirect pasca-login → studio | 34-47 |
| `src\components\auth\LoginRequired.tsx` | Guard UI untuk Studio/Dashboard | 7-46 |
| `src\components\auth\EmbedModal.tsx` | iframe `/#/portfolio` | 4,8 |
| `src\components\layout\LeftSidebar.tsx` | "Buka Dashboard" | 145-150 |
| `vercel.json` | SPA rewrite + cache media | 6-13 |
| `api\public.js` | GET/POST payload publik per UID | 3-58 |
| `supabase\schema.sql` | Tabel `virtour_state`, `virtour_users`, RLS demo | 4-37 |
| `package.json` | Daftar dependensi (tanpa react-router) | 15-28 |
| `README.md` | Tabel route & panduan navigasi | 5-10,130-139,156-172 |

---

*Dokumen ini hanya mendokumentasikan perilaku yang ada di source. Tidak ada perubahan source code yang dilakukan saat proses dokumentasi.*
