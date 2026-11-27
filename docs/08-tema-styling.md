# 08 — Tema, Styling, Efek, dan Lokalisasi Virtour360

> Dokumentasi berbasis pembacaan source (bukan asumsi). Semua referensi ditulis dalam bentuk `path:baris`.
> Source: `C:\Users\visual works\Documents\rea\virtour360`
> Live yang dicek: <https://virtour360real.vercel.app/#/p/1x2m270p3j> (HTML shell terverifikasi via HTTP; lihat Catatan Batasan).

---

## Ringkasan eksekutif

| Pertanyaan | Jawaban singkat |
|---|---|
| Apakah ada sistem desain terpusat? | **Ya, sebagian.** Token TS di `src/config/theme.ts`, token CSS/Tailwind v4 di `src/styles/theme.css`. Namun mayoritas warna/spacing ditulis inline lewat kelas utilitas Tailwind (zinc/amber/sky/pink), bukan memakai token CSS. |
| Apakah ada pemilih tema/skin tour? | **Tidak.** Tidak ada UI, tipe data, atau field payload untuk memilih tema/skin/warna tour/branding/credit. Lihat Bagian 2. |
| Apakah ada dark/light mode toggle? | **Tidak.** `color-scheme: dark` dan `<html class="dark">` bersifat statis. Halaman publik ("Home"/"Portfolio") memakai gaya terang (white/slate) lewat kelas Tailwind, tapi itu **dua skin per-halaman**, bukan mode yang bisa diganti pengguna. |
| Apakah ada i18n / multi-bahasa? | **Tidak.** `react-i18next` hanya disebut di dokumen reverse-engineering Panoee (`docs/RESEARCH.md:9`), bukan dependency. Semua string hardcode Bahasa Indonesia (sebagian Inggris). `index.html:2` → `lang="id"`. |
| Efek apa yang benar-benar ada? | Roll/levelling + 6 CSS filter (brightness, contrast, saturate, hue, grayscale, sepia) + nadir badge + autorotate + transisi `fade`. **Tidak ada** little planet, green screen, partikel, vignette khusus, atau rotating-per-scene selain autorotate/spin marker. |
| library ikon | `lucide-react@^1.77.0` (`package.json:24`) + ikon SVG inline untuk marker (`src/hooks/useTourViewer.ts:26-40`). |

---

## 1. Sistem desain

### 1.1 Token TypeScript — `src/config/theme.ts:1-26`

```ts
color: {
  background:    "#09090b"  // ink-950
  panel:         "#18181b"  // ink-900
  surface:       "#27272a"  // ink-800
  surfaceHover:  "#3f3f46"  // ink-700
  border:        "#27272a"
  borderStrong:  "#3f3f46"
  text:          "#fafafa"
  textMuted:     "#a1a1aa"
  textSubtle:    "#71717a"
  accent:        "#facc15"  // amber/kuning (aksi aktif, marker default)
  primary:       "#0ea5e9"  // sky/blue (Publish, scene/link)
  brand:         "#ec4899"  // pink (Dashboard, logo)
}
size:   { topbar: 56, sidebar: 240, inspector: 260 }
radius: { control: 8, card: 12, panel: 14 }
```

Catatan penting: objek `theme` ini **hanya dipakai untuk `size`** di aplikasi (`TopBar.tsx:12,55,102`; `RightPanel.tsx:19,175`; `TourViewer.tsx:3,107`). Token `color` dan `radius` saat ini tidak dikonsumsi komponen mana pun — warna/radius berasal dari kelas Tailwind. Ini adalah "token yang terdokumentasi tetapi tidak sepenuhnya dipakai".

### 1.2 Token CSS / Tailwind v4 — `src/styles/theme.css:1-41`

- Tailwind v4 diaktifkan via plugin Vite (`vite.config.ts:3,6`), **tanpa file `tailwind.config.*`** — tidak ada konfigurasi breakpoint/tema kustom. Breakpoint memakai default Tailwind (sm 640, md 768, lg 1024, xl 1280, 2xl 1536).
- `@theme` (`theme.css:3-13`) mendefinisikan:
  - `--color-ink-950: #09090b`, `--color-ink-900: #18181b`, `--color-ink-850: #1f1f23`, `--color-ink-800: #27272a`, `--color-ink-700: #3f3f46`
  - `--color-accent: #facc15`, `--color-primary: #0ea5e9`, `--color-brand: #ec4899`
  - `--font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`
- Global `:root` (`theme.css:15-23`): `color-scheme: dark`, font `var(--font-sans)`, background `var(--color-ink-950)`, teks `#fafafa`, `font-synthesis: none`, `text-rendering: optimizeLegibility`, `-webkit-font-smoothing: antialiased`.
- Reset/utility (`theme.css:25-41`): `box-sizing: border-box`, `html/body/#root` 100% + margin 0, `body { overflow: hidden }`, `button { cursor: pointer }`, `::selection` kuning-hitam, `.hide-scrollbar`, `.thin-scrollbar` (thumb 6px, `#3f3f46`).

### 1.3 Tipografi, spacing, radius, shadow

- **Font**: Inter via CSS variable; **tidak ada** `@font-face` / Google Fonts import — jadi Inter hanya dipakai bila terpasang di sistem, sisanya fallback system-ui (`theme.css:12`).
- **Ukuran teks dominan**: `text-[10px]` (label mikro/metadata), `text-[11px]` (body panel), `text-xs` (12px, kontrol & toolbar), `text-sm` (judul modal), `text-3xl`/`sm:text-4xl` (hero, `PublicHomeView.tsx:175`). Komponen `Badge` memakai `text-[10px]`.
- **Spacing**: skala 4px Tailwind (px-1/2/3, gap-1.5/2/3, py-1.5, h-8/h-9/h-10, h-12, px-4, p-5, py-24 → `lg:py-32` hero). Gutter halaman: `px-4 sm:px-6 lg:px-8`. Maksimal konten: 1120px (Home), 1200px (Portfolio), 1400px → `min-[112.5rem]:max-w-[1640px]` (Dashboard, `DashboardView.tsx:211`).
- **Radius**: `rounded-lg` (8px) untuk kontrol/kartu panel, `rounded-xl` (12px) untuk kartu/popover, `rounded-2xl` (16px) untuk modal, `rounded-full` untuk pill toolbar & avatar. Token `radius` di `theme.ts` (8/12/14) tidak dipakai langsung.
- **Shadow/efek kaca**: `shadow-2xl` pada modal/popover; `shadow-xl` pada toast; `backdrop-blur`, `backdrop-blur-md` pada navbar pill, minimap, side menu, toolbar; `ring-1 ring-amber-400/40` pada kartu scene aktif. Override PSV menambah `box-shadow: 0 10px 30px rgba(0,0,0,.5)` pada tooltip (`psv-overrides.css:23`).

### 1.4 Komponen UI primitif (`src/components/ui/`)

| Komponen | File | Props / varian | Perilaku & gaya |
|---|---|---|---|
| `Button` | `Button.tsx:1-43` | `variant: "white" \| "ghost" \| "blue" \| "amber" \| "outline"` (default `ghost`), `size: "sm" \| "md"` (default `md`), `icon?: ReactNode`, `children`, + semua `ButtonHTMLAttributes` | `inline-flex`, `gap-2`, `rounded-lg`, `font-medium`, `transition-colors`, `focus-visible:ring-2 focus-visible:ring-white/30`, `disabled:opacity-50`. Varian: white=`bg-white text-black hover:bg-zinc-200`; ghost=`bg-transparent text-zinc-50 hover:bg-white/10`; blue=`bg-sky-500 text-white`; amber=`text-amber-400 hover:bg-amber-400/10`; outline=`border-zinc-700 text-zinc-300`. Size sm=`h-8 px-3 text-xs`, md=`h-9 px-3 text-xs`. **Catatan**: komponen ini tidak dipakai di file lain (semua tombol ditulis inline). |
| `Badge` | `Badge.tsx:1-14` | `tone?: "zinc" \| "amber" \| "blue"` (default zinc), `children` | `inline-flex rounded border px-1.5 py-0.5 text-[10px]`. Dipakai di `RightPanel.tsx:346` untuk tipe hotspot (scene→blue, lainnya→amber). |
| `AccordionSection` | `AccordionSection.tsx:1-29` | `title: string`, `children`, `defaultOpen?: boolean` (default false) | State `open` lokal. Header `<button>` h-12 dengan `ChevronDown` (lucide) berputar 180° (`duration-200`). Konten yang terbuka memakai `animate-fade-up`. Digunakan 10× di inspector (`RightPanel.tsx:197-331`). |
| `Lightbox` | `Lightbox.tsx:1-29` | `src`, `title`, `onClose` | Overlay `fixed inset-0 z-[110] bg-black/85 backdrop-blur`; klik luar atau tombol X menutup; `Escape` via `window.keydown` (`Lightbox.tsx:5-11`); gambar `alt={title}`, `max-h-[75vh] object-contain shadow-2xl`. Dipakai untuk thumbnail (`App.tsx:451`). |
| `Logo360` | `Logo360.tsx:1-49` | `tone?: "pink" \| "dark" \| "white"` (default pink), `showText?: boolean` (default true), `size?: number` (default 30), `className` | SVG 40×40: elips orbit berputar (`.globe-spin`), lingkaran `r=15.5`, teks "360". Warna: pink=`#d1005c`, dark=`#0f172a`, white=`#fafafa` (`Logo360.tsx:13`). Teks "virtour360" (`text-lg font-bold tracking-tight`); svg `aria-hidden="true"`. Dipakai di Home (`PublicHomeView.tsx:113,358`), Portfolio (`PublicPortfolioView.tsx:85`), Dashboard/footer. |

### 1.5 Ikon

- `lucide-react` dipakai luas (chevron, X, plus, camera, music, map pin, settings, maximize, trash, external link, dll). Contoh import: `RightPanel.tsx:2-18`, `TopBar.tsx:1-11`, `BottomToolbar.tsx:2`, `TourViewer.tsx:2`.
- Ikon marker hotspot adalah SVG inline buatan sendiri di `src/hooks/useTourViewer.ts:26-40` (`point, info, project, link, image, video, sound, product, star, heart`) dengan `stroke="currentColor"`, bukan dari lucide. Pemetaan tipe→ikon di `App.tsx:161-174` (mengadaptasi 9 label Panoee: Point/Chevron/Image/Article/Video/Sound/Link/Compact/Product).
- `Badge`, `Button`, `Logo360`, `Lightbox` tidak memakai ikon pihak ketiga selain lucide di `AccordionSection`/`Lightbox`.

---

## 2. Tema tour / skin / branding / credit

### 2.1 Temuan penting: tidak ada pemilih tema tour

Telah diperiksa: `src/types/tour.ts`, `src/config/theme.ts`, `src/config/tour.config.ts`, `src/lib/publicStore.ts`, `src/components/auth/PublishModal.tsx`, `src/components/layout/RightPanel.tsx`, `src/App.tsx`, `api/`. **Tidak ditemukan** field atau UI untuk:

- memilih skin/tema tour (classic/graph3d, terang/gelap, preset warna),
- mengubah warna dasar/latar/aksen tour,
- mengunggah logo kustom,
- mengatur teks credit/watermark kustom,
- menyimpan preferensi tema di payload publish.

`tourConfig` (`src/config/tour.config.ts:1-12`) hanya berisi: `defaultZoom: 70`, `minFov: 30`, `maxFov: 100`, `transitionSpeed: "18rpm"`, `renderMode: "3d"`, `loadingLabel: "Menyiapkan panorama…"`. Tidak ada `theme`.

Payload publish (`PublishModal.tsx:44-60` → `publishPublicPayload`) hanya berisi `profile`, `scenes`, `folders`, `creators`, `updatedAt`. Tidak ada `theme`/`branding`.

Status viewer "classic vs graph3d" milik Panoee (`docs/RESEARCH.md:65`) **tidak** diimplementasikan sebagai toggle, meski ada 3 view options lain (lihat 2.4).

### 2.2 Warna yang "effective" (de facto) per area

| Area | Latar | Teks | Aksen | Referensi |
|---|---|---|---|---|
| Studio (`#/studio`) | `bg-zinc-950` (#09090b), panel `bg-zinc-900` (#18181b) | `text-zinc-50` | amber #facc15 (aktif/roll/marker), sky #0ea5e9 (Publish, scene), pink #ec4899 (brand) | `AppShell.tsx:13`, `RightPanel.tsx:174`, `TopBar.tsx:128`, `theme.css:9-11` |
| Dashboard (`#/dashboard`) | gelap, kartu `bg-[#0c1612]` (hijau sangat gelap) | zinc-50 | amber (pill "Portofolio Pribadi"), pink (logo) | `DashboardView.tsx:43,69,172` |
| Public Home / Portfolio | **terang**: `bg-white`, border `slate-200`, teks `slate-900/500` | slate | slate-900 (CTA), rose (favorit) | `PublicHomeView.tsx:158,209,226`, `PublicPortfolioView.tsx:383` |
| Viewer PSV | `.psv-container { background:#09090b; font-family: var(--font-sans) }` | `#fafafa` | amber (marker default), sky (marker scene) | `psv-overrides.css:2-5,62-83` |

Jadi aplikasi memiliki **dua "skin" implisit**: gelap untuk Studio/Dashboard/viewer, terang untuk halaman publik — keduanya hardcode, bukan pilihan pengguna.

### 2.3 Branding & logo

- Nama produk "Virtour360" konsisten sejak `docs/CHANGELOG.md:25-28` (dulu Panoee).
- `Logo360` dipakai di header publik & footer (`PublicHomeView.tsx:113,358`; `PublicPortfolioView.tsx:85`).
- Favicon `/favicon.svg` dan `meta theme-color #09090b` (`index.html:6,8`).
- Judul halaman statis: `Virtour360 — Studio Virtual Tour` (`index.html:9`) — tidak berubah di halaman publik/viewer.
- QR code publish memakai warna `dark:#09090b, light:#ffffff` (`PublishModal.tsx:39`).
- Embed iframe `title="Virtour360 Virtual Tour"` (`PublishModal.tsx:35`; `EmbedModal.tsx:8`).

### 2.4 Credit / watermark / label branding di viewer

Ketiga elemen ini bersifat **tetap**, tidak bisa dikonfigurasi:

1. **Badge nadir**: teks `VIRTour360` di tengah bawah viewer, muncul hanya jika `showNadir` (`TourViewer.tsx:214-218`). `showNadir` diturunkan dari `currentEffects.nadir` (`App.tsx:146,364`). Jadi "nadir" di aplikasi ini adalah **label overlay**, bukan penutup gambar pole bawah sungguhan. Ditegaskan juga di `docs/VALIDATION.md:89` ("NADIR menampilkan badge").
2. **Credit bar Studio** (desktop only, `lg:block`): `{user name} · {project.title} · {year}` di kanan bawah, `pointer-events-none text-[10px] text-zinc-600` (`App.tsx:415-417`).
3. **Caption PSV**: `caption: scenes[0]?.name ?? "Virtual Tour"` (`useTourViewer.ts:153`) — nama scene pertama, bukan credit.

### 2.5 Cara (de facto) menerapkan gaya ke viewer

Karena tidak ada theme API, "penerapan tema" terjadi lewat 4 jalur:

1. **CSS override global** — `src/index.css:1-7` mengimpor berturut: `theme.css` → CSS core PSV + 4 plugin → `psv-overrides.css` (override terakhir, jadi menang).
2. **Kelas marker dinamis** — `markerConfig()` (`useTourViewer.ts:42-63`) menyuntik HTML dengan CSS var `--hs-color`, `hs-<effect>`, `hs-shape-<shape>`, opacity, rotate. Versi publik ada di `PublicViewerModal.tsx:58-70`.
3. **Filter kanvas langsung** — `canvas.style.filter = effectsToCss(options.effects)` + `sphereCorrection.roll` (`useTourViewer.ts:427-437`).
4. **Inset layout** — `TourViewer` `<main>` memakai `left: theme.size.sidebar, right: theme.size.inspector` atau `{0,0}` saat preview/fullscreen (`TourViewer.tsx:105-108`; `App.tsx:365`).

Pengaturan yang benar-benar bisa diubah pengguna di viewer (bukan tema): kualitas (hemat/standar/tinggi), kompas, gyroskop, Mini-map, Side menu, Tour graph — `SettingsPopover` di `App.tsx:39-101`, dipasang ke viewer lewat `settingsContent` (`App.tsx:342-358`).

---

## 3. Override CSS Photo Sphere Viewer — `src/styles/psv-overrides.css:1-90`

Import order di `src/index.css:1-7` memastikan override ini dimuat **setelah** CSS PSV bawaan.

| Selektor | Perubahan | Baris |
|---|---|---|
| `.psv-container` | `font-family: var(--font-sans)`, `background: #09090b` | 2-5 |
| `.psv-loader` | overlay `rgba(9,9,11,.72)` + `backdrop-filter: blur(6px)` | 7-10 |
| `.psv-loader-content` | teks `#fafafa`, 12px, `letter-spacing .02em` | 12-16 |
| `.psv-tooltip` | `background #18181b !important`, `color #fafafa !important`, border `1px #3f3f46`, radius 8px, shadow `0 10px 30px rgba(0,0,0,.5)`, font sans | 18-25 |
| `.psv-tooltip::after` | `border-top-color:#18181b !important` (arrow tooltip) | 27-29 |
| `.hotspot` | 34×34, grid center, radius penuh, bg `rgba(9,9,11,.72)`, border `1px rgba(250,250,250,.22)`, ring `0 0 0 6px rgba(250,250,250,.06)`, blur 4px, transisi 160ms, cursor pointer | 32-46 |
| `.hotspot::before` | ring dalam `inset:-6px`, border `rgba(250,250,250,.12)` | 48-54 |
| `.hotspot:hover` | `scale(1.12)`, bg `rgba(250,250,250,.16)`, border `rgba(250,250,250,.5)` | 56-60 |
| `.hotspot--info::after`, `.hotspot--project::after` | titik kecil kuning `#facc15` di kanan atas | 62-72 |
| `.hotspot--scene::after` | titik kecil biru `#0ea5e9` | 74-83 |
| `.psv-virtual-tour-arrow` | opacity `.75 !important`, transisi opacity/transform 160ms; hover opacity 1 + `scale(1.08)` | 85-90 |

**Catatan penting:** kelas `.hotspot` / `.hotspot--info` ini tampaknya adalah gaya warisan. Marker yang benar-benar dirender oleh aplikasi memakai struktur `.hs-marker > .hs-dot` yang didefinisikan di `theme.css:95-194`, dengan kelas `hs-*` untuk efek/bentuk. Jadi override `.hotspot` mungkin tidak pernah kena marker aktif — perlu diverifikasi visual (lihat Batasan).

**Yang TIDAK di-override**: navbar PSV (`navbar: false` di `useTourViewer.ts:147` dan `PublicViewerModal.tsx:33,75` — jadi navbar memang dimatikan, bukan di-style), panel settings PSV (plugin `SettingsPlugin` tetap aktif tapi panel tidak dipakai; settings aplikasi memakai popover sendiri), tombol fullscreen PSV, dan layout mobile PSV. Tidak ada aturan `@media` di `psv-overrides.css`.

Konfigurasi viewer terkait: `touchmoveTwoFingers: true`, `mousewheelCtrlKey: false` (`useTourViewer.ts:151-152`), kompas ukuran 48px (`:143`), autorotate pitch 5deg / speed 2rpm (`:142`), renderMode `3d` (studio) vs `2d` (publik, `PublicViewerModal.tsx:49`).

---

## 4. Efek visual — mana yang benar-benar ada

### 4.1 Model data — `src/lib/effects.ts:1-48`

```ts
interface SceneEffects {
  roll: number; brightness: number; contrast: number; saturate: number;
  hue: number; grayscale: number; sepia: number; nadir: boolean
}
defaultEffects = { roll:0, brightness:100, contrast:100, saturate:100,
                   hue:0, grayscale:0, sepia:0, nadir:false }
```

`normalizeEffects()` (`:25-27`) menggabungkan default dengan patch. State disimpan per scene di `effectsByScene` (`AppContext.tsx:91,235`), key localStorage `virtour360.effects` (`AppContext.tsx:124`), ikut remote state Supabase (`AppContext.tsx:337-339,374`). Diubah lewat `setSceneEffects`/`resetSceneEffects` (`AppContext.tsx:791`).

### 4.2 Penerapan nyata — `src/hooks/useTourViewer.ts:427-437`

`effectsToCss()` (`effects.ts:30-40`) menghasilkan:
`brightness(X%) contrast(X%) saturate(X%) hue-rotate(Xdeg) grayscale(X%) sepia(X%)`, lalu diterapkan ke `.psv-canvas-container` via inline `style.filter`. `roll` diterapkan lewat `viewer.setOption("sphereCorrection", { roll })` (dibungkus try/catch). Efek dihitung ulang saat `isReady`, `currentSceneId`, atau `options.effects` berubah.

### 4.3 Preset — `src/lib/effects.ts:42-48`

| Preset | Parameter |
|---|---|
| `natural` | brightness 100, contrast 100, saturate 100, hue 0, grayscale 0, sepia 0 |
| `warm` | 105 / 105 / 115 / −8 / 0 / 12 |
| `cool` | 102 / 108 / 105 / +10 / 0 / 0 |
| `dusk` | 82 / 118 / 130 / −18 / 0 / 8 |
| `mono` | 105 / 115 / 100 / 0 / **grayscale 100** / 0 |

UI inspector `RightPanel.tsx:238-298` memetakan preset ini ke panel: Levelling (roll −20…20° + tombol "Level this scene"), Nadir (checkbox), Quick Fix (`natural/warm/cool/mono`, `dusk` difilter keluar), Custom Fix (brightness 50–150, contrast 50–150, saturate 0–200), "Staging Day To Dusk" (tombol `effectPresets.dusk`), Filter Processing (hue −180…180, grayscale 0–100, sepia 0–100), "Sun light" (brightness + tombol Hangat/Dingin + "Reset semua efek").

### 4.4 Matriks fitur efek yang diminta

| Fitur | Ada? | Bukti / keterangan |
|---|---|---|
| **Autorotate** | ✅ | `AutorotatePlugin` (`useTourViewer.ts:5,142,158,520-530`); tombol di `BottomToolbar.tsx:41-51` menampilkan yaw/pitch/zoom dan toggle; pitch 5°, speed 2rpm. |
| **Transition / fade** | ✅ | `VirtualTourPlugin.transitionOptions = { showLoader:true, speed:"18rpm", effect:"fade", rotation:true }` (`useTourViewer.ts:134-139`; konstanta `tourConfig.transitionSpeed`, `tour.config.ts:7`). Publik: `speed:"16rpm", effect:"fade", rotation:true` (`PublicViewerModal.tsx:73`). Juga `animate-fade-up` untuk UI (`theme.css:43-48`). |
| **Rotating (marker orbit/globe)** | ✅ (sebagian) | Efek marker `hs-spin`, `hs-rotate`, `hs-bounce` (`theme.css:85-93`); rotate per-marker −360…360° (`useTourViewer.ts:57`); logo orbit `.globe-spin` 24s (`theme.css:64-77`); hero `.hero-360` slow-pan 90s (`:50-62`). **Ini bukan "rotating panorama" selain autorotate.** |
| **Vignette** | ❌ | Tidak ada selector/filter `vignette`, tidak ada radial-gradient overlay gelap di viewer. Gradient yang ada hanya di header viewer publik (`PublicViewerModal.tsx:146`) dan peta lokasi inspector (`RightPanel.tsx:636`) — bukan vignette panorama. |
| **Green screen / chroma key** | ❌ | Tidak ada kode/UI. |
| **Partikel** | ❌ | Tidak ada canvas partikel / library partikel di `package.json`. |
| **Little planet (stereographic projection)** | ❌ | PSV tidak dikonfigurasi dengan proyeksi khusus; `Viewer` memakai default rectilinear. Tidak ada opsi little planet. |
| **Filter warna (brightness/contrast/saturate/hue/grayscale/sepia)** | ✅ | Lihat 4.2–4.3. |
| **Levelling / roll** | ✅ | `sphereCorrection.roll` + slider (`RightPanel.tsx:243`). |
| **Nadir** | ⚠️ | Hanya badge teks "VIRTour360", bukan penutup nadir gambar (`TourViewer.tsx:214-218`; `VALIDATION.md:89`). |
| **Kompas / Gyroskop** | ✅ | Plugin PSV; toggle di `App.tsx:73-80`. Gyroskop butuh HTTPS/localhost (pesan di `App.tsx:95`). |

**Catatan efek publik**: `PublicViewerModal` **tidak** menerima/apply `effectsByScene` — marker memakai `h.style?.color` default `#facc15` (`PublicViewerModal.tsx:64-66`). Jadi filter warna/roll yang diatur di Studio **tidak ikut ke viewer publik**. Demikian pula payload publish tidak membawa `effects` (`PublishModal.tsx:54-60`).

### 4.5 Animasi & micro-interaction (CSS) — `src/styles/theme.css`

| Kelas/keyframes | Fungsi | Baris | Reduced-motion |
|---|---|---|---|
| `fade-up` / `.animate-fade-up` | opacity 0→1 + translateY 8px→0, 260ms ease-out | 43-48 | tidak dimatikan |
| `slow-pan` / `.hero-360` | background-position 0→200%, 90s linear infinite (hero panorama) | 50-58 | ✅ mati (60-62) |
| `slow-spin` / `.globe-spin` | rotate 0→360°, 24s linear infinite (orbit logo) | 64-77 | ✅ mati (75-77) |
| `hs-pulse` | scale 1→1.15 + box-shadow ring, 1.8s | 80-83, 89 | ✅ (196-198) |
| `hs-blink` | opacity 1↔.25 step-end, 1.2s | 84, 90 | ✅ |
| `hs-spin` | rotate 360°, 4s linear | 85, 91 | ✅ |
| `hs-bounce` | translateY −6px, 1.4s | 86, 92 | ✅ |
| `hs-rotate` | rotateY 360°, 5s linear | 87, 93 | ✅ |
| `pano-drift` | object-position 20%→80%→20%, 22s, **default paused**, jalan saat `.group:hover` / `:hover` | 200-218 | ✅ (216-218) |
| `caret-blink` / `.typing-caret` | caret placeholder pencarian, 1s step-end | 220-226 | tidak dimatikan |

`hs-marker`, `hs-dot`, `hs-hud` (reticle + label koordinat mengikuti cursor), `hs-drag-ghost` ada di `theme.css:95-169`; bentuk marker via `clip-path` (square/diamond/star/hexagon/triangle/heart) di `:171-177`; label ellipsis + hover di `:179-194`.

Micro-interaction lain memakai Tailwind `transition-colors`/`transition-transform` (hover tombol, chevron accordion `duration-200`, kartu `group-hover:scale-105`, spinner `animate-spin`).

### 4.6 Loading / empty / error state visual

- **Loading awal viewer**: overlay `bg-zinc-950/70 backdrop-blur-sm` + spinner `size-8 animate-spin border-t-amber-400` + teks "Menyiapkan panorama⬦" (`App.tsx:406-413`). Konstanta serupa ada di `tour.config.ts:11` (`loadingLabel`), tapi overlay memakai string hardcode sendiri.
- **PSV loader**: di-override jadi gelap-blur (`psv-overrides.css:7-16`).
- **Route lazy loading**: `Loader()` → "Muat⬦" di tengah, bg zinc-950 (`Root.tsx:20-26`).
- **Toast notifikasi**: `fixed bottom-20 left-1/2 z-[120] animate-fade-up ... shadow-xl` (`Root.tsx:58-62`); pesan sukses/gagal dari publish, hotspot, audio, dll.
- **Empty state hotspot inspector**: dot pink + teks "Pilih hotspot pada panorama, atau tambah hotspot baru…" + ikon `MousePointerClick` (`RightPanel.tsx:591-599`).
- **Empty state pencarian sidebar**: filter scene tanpa hasil → daftar kosong (tidak ada ilustrasi khusus).
- **Error visual**: tidak ada halaman error dedicated. Gagal audio → toast "Audio tidak dapat diputar di browser ini." (`TourViewer.tsx:97`); scene tujuan hilang → toast "Scene tujuan tidak ditemukan." (`useTourViewer.ts:186`); gyroskop gagal → toast (`useTourViewer.ts:556`); panorama ERR_ABORTED pernah terjadi dan diperbaiki dengan memo (CHANGELOG 2026-11-22:87-88).
- **Prefers-reduced-motion**: dihormati untuk 6 animasi (lihat tabel atas). Tidak ada reduced-motion untuk `animate-fade-up`, spinner, dan `typing-caret`.

---

## 5. Responsive design & breakpoint

### 5.1 Breakpoint yang dipakai (Tailwind default, tidak ada config kustom)

| Breakpoint | Lebar | Pemakaian |
|---|---|---|
| `sm` | ≥640px | nav desktop di Home (`PublicHomeView.tsx:115`); grid media picker 2→3 kolom (`MediaPickerModal.tsx:29`); minimap muncul (`MiniMap.tsx:26`); padding/gutter naik; layout row pada CTA/profile |
| `md` | ≥768px | tombol Polygon di toolbar (`BottomToolbar.tsx:90`); pill "Portofolio Pribadi" & Changelog di Dashboard (`DashboardView.tsx:172,175`) |
| `lg` | ≥1024px | zoom +/- toolbar (`BottomToolbar.tsx:97`); box "360 berikutnya" (`TourViewer.tsx:189`); credit bar Studio (`App.tsx:415`); padding hero `lg:py-32` |
| `min-[112.5rem]` | ≥1800px | Dashboard max-width 1400→1640px (`DashboardView.tsx:211`) |

### 5.2 Perilaku per perangkat

- **Mobile (<640px)**: nav Home tersembunyi → tombol akses cepat/floating nav; minimap **disembunyikan** (`MiniMap.tsx:26`); toolbar bawah `max-w-[calc(100%-24px)]` dengan scroll horizontal + `.hide-scrollbar` (`BottomToolbar.tsx:39-40`) sehingga tidak overflow; tombol Polygon, zoom, credit bar, dan navigasi prev/next scene hilang. Hero `px-4 py-24`, judul `text-3xl`.
- **Tablet (640–1023px)**: minimap tampil (fixed `left:264px top:100px w-80`), nav Home tampil, tapi zoom controls & box next-scene masih hidden.
- **Desktop (≥1024px)**: semua elemen Studio tampil. Layout Studio bersifat **fixed** (bukan flex responsive): TopBar `h-14` dengan area kiri `width: theme.size.sidebar` (240) dan kanan `width: theme.size.inspector` (260); `<main>` viewer `left:240 right:260` (`TourViewer.tsx:107`); RightPanel `fixed right-0 top-14 w-260` (`RightPanel.tsx:174-175`). Karena itu **tidak ada penyesuaian lebih lanjut di layar sempit untuk Studio** — sidebar+inspector tetap 500px. Sudah diverifikasi di changelog bahwa Home tidak overflow di 1062px (`docs/CHANGELOG.md:111,114`).
- **Fullscreen/preview**: saat `preview` atau fullscreen, `inset={{left:0,right:0}}` (`App.tsx:365`), panel disembunyikan (`App.tsx:223,382`), viewer mengisi seluruh layar; tombol "Keluar pratinjau" di kiri atas (`TourViewer.tsx:162-169`).
- **Sentuh**: `touchmoveTwoFingers: true`, `mousewheelCtrlKey: false` (`useTourViewer.ts:151-152`); tombol gyro muncul tapi butuh perangkat bersensor + HTTPS/localhost.

### 5.3 Dark/light mode

- Tidak ada toggle. `:root { color-scheme: dark }` (`theme.css:16`) + `<html lang="id" class="dark">` (`index.html:2`).
- `class="dark"` di html **tidak ada gunanya fungsional** di Tailwind v4 di sini karena tidak ada satu pun kelas `dark:` di source (hasil grep: 0). Halaman publik tetap terang karena memakai kelas `bg-white text-slate-*` eksplisit, bukan karena light mode.
- Kontras utama: teks `#fafafa` di atas `#09090b` (≈19:1) sangat baik; teks muted `#a1a1aa`/`#71717a` di atas panel gelap masih memadai untuk label kecil; teks `text-zinc-600` pada `text-[10px]` (`App.tsx:415`, `RightPanel.tsx:314`) berisiko kontras rendah. `::selection` kuning-hitam (`theme.css:33`).

---

## 6. Bahasa / lokalisasi

- **Bahasa UI dominan: Bahasa Indonesia.** Contoh: "Menyiapkan panorama", "Klik gambar untuk menaruh hotspot", "Simpan perubahan", "Tampilkan label", "Terapkan senja", "Reset semua efek", "Layar penuh", "Publik — masuk untuk mengunggah", "Terima kasih sudah mampir!", "Portofolio Pribadi — dibuat untuk teman." (`App.tsx`, `RightPanel.tsx`, `BottomToolbar.tsx`, `DashboardView.tsx`).
- **String Inggris tersisa (hardcase, tidak konsisten)**: label tab inspector `"Scene" | "Hotspot" | "Location"` (`RightPanel.tsx:157-161`); accordion `"Config", "Levelling", "Nadir", "Quick Fix", "Custom Fix", "Staging Day To Dusk", "Filter Processing", "Sun light", "View", "Kualitas gambar"` (`RightPanel.tsx:197-331`); opsi kualitas `"Standard/High/Original"` (`:310-312`); `"Who has access"`, `"Draft/Public/Password"`, `"Cache"`, `"Embed"`, `"Integrate"`, `"Export"` di PublishModal; label picker `"Point, Chevron, Image, Article, Video, Sound, Link, Compact, Product"` (`BottomToolbar.tsx:36`); `"Side menu"`, `"Tour graph"`, `"Mini-map"`, `"View options"` (`App.tsx:82-88`); `"Virtual tour"`, `"scene"` di PublicViewerModal (`:148,151,175`); opsi hotspot value `info/project/link/scene` ditampilkan apa adanya di Badge (`RightPanel.tsx:346`).
- **Tidak ada i18n**: tidak ada `react-i18next`, `i18next`, `Intl`, dictionary, atau file locale. `docs/RESEARCH.md:9` hanya mencatat bahwa **Panoee** memakai react-i18next — itu bukan implementasi Virtour360 (lihat `docs/RESEARCH.md:144-148` untuk daftar yang sengaja tidak diimplementasikan).
- `lang="id"` statis di `index.html:2`; tidak ada deteksi `navigator.language`, tidak ada pemilih bahasa.
- Angka/koordinat memakai format khusus: `formatAngle` (`BottomToolbar.tsx:50`, `lib/format.ts`) dan derajat `°` di label slider; tidak ada `Intl.NumberFormat` untuk lokale.

---

## 7. Animasi, micro-interaction, empty/loading/error state

(Sudah dibahas detail di 4.5–4.6.) Ringkasan tambahan:

- **Transisi UI**: hampir semua interaksi memakai `transition-colors` 150ms default Tailwind; accordion Chevron `duration-200`; tooltip marker 150ms (`theme.css:180`); hover hotspot PSV 160ms (`psv-overrides.css:44`).
- **Drag marker**: ghost marker digerakkan via `transform: translate3d` + `requestAnimationFrame` tanpa re-render React (`useTourViewer.ts:239-313` HUD penempatan; `:315-407` drag marker). Ini micro-interaction paling "kustom" di aplikasi.
- **HUD penempatan**: reticle 40px + label koordinat `yaw X° · pitch Y°` mengikuti cursor, fallback teks "klik untuk menaruh hotspot" bila konversi koordinat gagal (`useTourViewer.ts:246,268-271`).
- **Toast**:Muncul di `bottom-20` dengan `animate-fade-up`, tidak auto-dismiss terlihat di kode `Root.tsx:58-62` (perlu dicek di Context apakah ada timer — tidak ditemukan di potongan yang dibaca; ini catatan ketidakpastian).
- **Hero search typing caret** (`theme.css:220-226`) dipasang pada placeholder pencarian kosong (CHANGELOG 2026-11-22:74).
- **Empty/loading/error**: lihat 4.6. Tidak ada skeleton loading; tidak ada error boundary React.

---

## 8. Aksesibilitas

### Yang sudah ada

| Aspek | Bukti |
|---|---|
| `lang="id"` | `index.html:2` |
| `meta viewport` | `index.html:5` |
| ARIA label pada tombol tutup modal | `Lightbox.tsx:21`, `AuthModal.tsx:62`, `ProfileModal.tsx:50`, `EmbedModal.tsx:28`, `UploadModal.tsx:91`, `PublishModal.tsx:88`, `MediaPickerModal.tsx:24`, `LeftSidebar.tsx:197` ("Hapus grup") |
| ARIA label search | `PublicHomeView.tsx:193` (`aria-label="Cari panorama, tempat, atau kreator"`) |
| ARIA label nav balik | `PublicPortfolioView.tsx:84` |
| SVG dekoratif disembunyikan | `Logo360.tsx:18` (`aria-hidden="true"`) |
| Alt text bermakna | `Lightbox.tsx:25` (`alt={title}`), `PublicHomeView.tsx:229,301`, `PublicPortfolioView.tsx:175,206`, `MiniMap.tsx:58`, `UploadModal.tsx:122`, `PublishModal.tsx:149` (QR code) |
| Focus ring | `Button.tsx:37` (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30`) — tetapi Button tidak dipakai; input lain hanya `outline-none` + `focus:border-zinc-500` (`RightPanel.tsx:525,534,544`) |
| Keyboard | Hotkeys `←/→` pindah scene, `R` reset, `+/-` zoom, `F` fullscreen (`useHotkeys.ts:12-45`), dengan guard agar tidak aktif saat fokus di INPUT/TEXTAREA/SELECT (`:16`). Esc menutup Lightbox & PublicViewerModal; PublicViewerModal juga ←/→ (`PublicViewerModal.tsx:132-140`) |
| Tombol native | Sebagian besar aksi memakai `<button type="button">` (Toolbar, TopBar, Accordion) |
| Kontras | Teks utama `#fafafa` di `#09090b` sangat tinggi; fokus ring putih 30% terlihat di atas gelap |
| Reduced motion | 6 animasi dimatikan (lihat 4.5) |

### Kekurangan / risiko

- Banyak tombol ikon hanya mengandalkan atribut `title` (tooltip), bukan `aria-label` — pembaca layar tidak selalu mengumumkan `title` dengan baik. Contoh: `BottomToolbar.tsx:98,101,118`, `TopBar.tsx:59,81,139`, `RightPanel.tsx:205,208,226`.
- Teks dekoratif memakai glyph Unicode `⬦` ("Menyiapkan panorama⬦", "Muat⬦", placeholder "https://⬦") — bukan ikon ber-ARIA, dan bisa terbaca aneh oleh screen reader.
- `aria-pressed` / `role="switch"` tidak dipakai pada toggle (autorotate, kompas, gyroskop, mini-map) — status hanya tersampaikan lewat warna (`BottomToolbar.tsx:45-47`).
- Accordion tidak memakai `aria-expanded` / `aria-controls` (`AccordionSection.tsx:15-25`).
- Modal tidak memakai `role="dialog"`, `aria-modal`, focus trap, atau fokus otomatis; overlay hanya `onClick` + Esc (Lightbox, PublishModal, AuthModal, dll.).
- Tab inspector tidak memakai `role="tablist"/"tab"/"tabpanel"` (`RightPanel.tsx:177-191`).
- Marker hotspot berupa HTML di dalam PSV tidak memiliki `role="button"`/`tabindex`; interaksi mengandalkan mouse/pointer PSV (`useTourViewer.ts:56-59`).
- Gambar thumbnail dekoratif memakai `alt=""` dengan benar di banyak tempat, tetapi beberapa `<img>` tanpa alt tidak ditemukan (semua punya atribut alt, baik kosong maupun bermakna).
- Teks `text-[9px]`/`text-[10px]` dengan `text-zinc-600` pada latar gelap berisiko melanggar kontras WCAG AA untuk teks kecil.
- Tidak ada skip-link, tidak ada landmark `<nav>` pada Studio (memakai `<header>/<aside>/<main>`, sudah baik), dan tidak ada `aria-live` pada toast notifikasi.

---

## Catatan batasan & metodologi

1. **Browser tidak terhubung.** Percobaan `tools.browser.tabs.open` / `tabs.list` menghasilkan `[browser.disconnected] No desktop browser is connected to this session`. Karena itu **tidak ada screenshot, snapshot aksesibilitas runtime, atau pengujian responsivitas langsung dengan ukuran viewport berbeda**. Tidak ada tool `setViewport` di katalog browser yang tersedia. Semua analisis responsivitas bersifat **statik dari kelas Tailwind & CSS media query**.
2. **Live site diverifikasi lewat HTTP biasa** (`webfetch https://virtour360real.vercel.app/`): mengembalikan shell SPA `<html lang="id" class="dark">`, `meta theme-color #09090b`, aset `/assets/index-B1Wh7yo8.js` & `/assets/index-DV6CUh07.css`, `<title>Virtour360 — Studio Virtual Tour</title>` — **konsisten dengan source**. Namun konten-after-hydration (warna aktual, screenshot) tidak bisa diverifikasi.
3. Tidak ada source code yang diubah. Dokumen ini hanya membaca.
4. Temporal: `docs/RESEARCH.md` dan `CHANGELOG.md` bertanggal 2026-11-20…22; Build/verifikasi lokal terakhir tercatat di `docs/VALIDATION.md:1-6`.
5. Ketidakpastian kecil: mekanisme auto-dismiss toast tidak terlihat di potongan `Root.tsx` (state `toast` kemungkinan diatur di `AppContext`); perlu konfirmasi jika document ini dipakai untuk QA detail.
6. Tidak ada file `tailwind.config.*`;ini bukan bug — Tailwind v4 memakai `@theme` di CSS + plugin Vite.

---

## Daftar file referensi cepat

| File | Peran |
|---|---|
| `src/config/theme.ts` | Token warna/size/radius TS (size yang dipakai) |
| `src/styles/theme.css` | Token CSS/Tailwind v4, global reset, semua keyframes & gaya marker |
| `src/styles/psv-overrides.css` | Overlap gaya Photo Sphere Viewer |
| `src/index.css` | Urutan import CSS (override terakhir) |
| `src/lib/effects.ts` | Model, preset, `effectsToCss` |
| `src/config/tour.config.ts` | Zoom/FOV/transisi/render mode viewer |
| `src/hooks/useTourViewer.ts` | Inisialisasi PSV + plugin, marker HTML, penerapan efek |
| `src/components/ui/{Button,Badge,AccordionSection,Lightbox,Logo360}.tsx` | Primitif UI |
| `src/components/viewer/{TourViewer,BottomToolbar,PublicViewerModal,MiniMap}.tsx` | Overlay viewer & kontrol |
| `src/components/layout/{TopBar,LeftSidebar,RightPanel,AppShell}.tsx` | Layout studio + inspector efek/point setup |
| `src/App.tsx` | Settings popover, credit bar, loading overlay, wiring efek |
| `src/Root.tsx`, `index.html`, `lib/navigation.ts` | Routing hash, lang, loader, toast |
| `docs/{RESEARCH,CHANGELOG,VALIDATION,PLAN}.md` | Konteks reverse-engineering Panoee & status validasi |
