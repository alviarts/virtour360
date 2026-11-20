# Rencana — Virtour360 Studio & Virtual Tour 360°

## Tujuan
Membangun website portofolio berupa **360° virtual tour interaktif** dengan tampilan
studio/editor dark-premium (dark, tipografi Inter,
panel zinc, aksen amber/blue/pink), dengan konten portofolio ourselves.

## Tiga permukaan (hasil analisis lanjutan)
Setelah login, referensi diperluas menjadi tiga tampilan yang harus direplikasi:

1. **Studio / Editor** — halaman editor scene
   Top bar 56px, sidebar 240px, inspector 260px, mini-map, toolbar pill.
2. **Dashboard Projects** — halaman dashboard proyek
   Top nav 64px (logo pink, menu Project/Media/Tools/Promotion/Enterprise, trial pill amber,
   Changelog, New Project pink), subheader Live/Studio, grid/list toggle, filter All, search,
   kartu project dengan badge "Published" hijau, notifikasi "Policy update", tombol gift.
3. **Public Portfolio** — halaman publik setelah publish (dari "View Public Profile")
   Theme terang, header putih (Search ⌘K, Create cyan, Studio pink), profil + statistik
   (Posts/Tours/Views/Likes), grid "360° posts" 4 kolom, banner promo pink, grid
   "Virtual tours" 3 kolom, floating bottom nav (Home/Map/Author/Explore).

Implementasi: `src/App.tsx` (studio), `src/views/DashboardView.tsx`,
`src/views/PublicPortfolioView.tsx`, router hash di `src/Root.tsx`.

## Referensi &riset
- Referensi awal → redirect ke halaman login (butuh login). Sudah diperiksa setelah login
  untuk menangkap detail UI studio.
- Referensi memakai **krpano** untuk viewer-nya; Virtour360 memakai **Photo Sphere Viewer** (three.js).
- Repo GitHub yang dipelajari:
  - `mistic100/Photo-Sphere-Viewer` — MIT, 2.4k★, TypeScript, plugin ecosystem lengkap.
  - `wishmerhill/libretours-360` — editor + viewer tour 360 self-hosted (GPL-3.0).
  - `KenTandrian/360-virtual-tour` — implementasi Vite + Pannellum (GPL-3.0).
  - `pannellum/pannellum` — viewer ringan, alternatif lebih sederhana.

## Keputusan stack
| Lapisan | Pilihan | Alasan |
|---|---|---|
| Build | Vite 8 + TypeScript | Cepat, HMR, output statis |
| UI | React 19 | Komponen modular, state viewer |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | Token tema konsisten, cepat |
| Viewer 360 | `@photo-sphere-viewer/core` 5.x + plugin | Virtual tour, marker, gallery, auto-rotate, kompas, gyro, VR |
| Ikon | `lucide-react` | Ikon konsisten, ringan |
| Font | Inter (self-host / Google Fonts) | Sama dengan referensi |

### Plugin PSV yang dipakai
- `virtual-tour-plugin` — node scene, transisi antar-scene, hotspot link
- `markers-plugin` — hotspot info / karya / kontak
- `gallery-plugin` — thumbnail scene
- `autorotate-plugin` — putar otomatis
- `compass-plugin` — kompas
- `gyroscope-plugin` — kontrol perangkat mobile
- `settings-plugin` — panel pengaturan kualitas
- `video-plugin` — opsional, panorama video

> Catatan: paket yang benar adalah `@photo-sphere-viewer/core` (v5). Paket lama
> `photo-sphere-viewer` berhenti di v4 dan tidak dipakai.

## Struktur folder
```
virtour360/
├── public/
│   ├── favicon.svg
│   └── media/
│       ├── panoramas/        # gambar equirectangular 2:1 (src asli)
│       ├── thumbnails/       # versi kecil untuk gallery / sidebar
│       └── brand/            # logo, avatar
├── src/
│   ├── main.tsx              # entry point
│   ├── App.tsx               # komposisi root
│   ├── index.css             # import tailwind + token tema
│   ├── types/
│   │   └── tour.ts           # Scene, Hotspot, TourConfig, Project
│   ├── data/
│   │   ├── profile.ts        # identitas & kontak pemilik portofolio
│   │   ├── scenes.ts         # daftar scene + hotspot + posisi kamera
│   │   └── projects.ts       # daftar karya untuk panel/info
│   ├── config/
│   │   ├── tour.config.ts    # konfigurasi PSV & viewer
│   │   └── theme.ts          # design token (warna, radius, shadow)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx      # grid layout 3 kolom
│   │   │   ├── TopBar.tsx        # logo, judul, aksi global
│   │   │   ├── Sidebar.tsx       # daftar scene / navigasi
│   │   │   └── StatusBar.tsx     # info scene, fps, kontrol
│   │   ├── viewer/
│   │   │   ├── TourViewer.tsx    # inisialisasi PSV + plugin
│   │   │   ├── ViewerToolbar.tsx # fullscreen, VR, auto-rotate, kompas
│   │   │   ├── HotspotLayer.tsx  # marker interaktif
│   │   │   ├── MiniMap.tsx       # peta scene (opsional)
│   │   │   └── SceneGallery.tsx  # thumbnail strip
│   │   ├── panels/
│   │   │   ├── SceneInspector.tsx# detail scene sedang dibuka
│   │   │   ├── ProjectCard.tsx   # kartu karya
│   │   │   ├── AboutPanel.tsx
│   │   │   └── ContactPanel.tsx
│   │   └── ui/
│   │       ├── Panel.tsx
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       └── SectionTitle.tsx
│   ├── hooks/
│   │   ├── useTourViewer.ts   # lifecycle PSV + state scene
│   │   ├── useFullscreen.ts
│   │   └── useHotkeys.ts
│   ├── lib/
│   │   ├── viewerFactory.ts   # build config PSV
│   │   ├── sceneGraph.ts      # helper navigasi scene
│   │   └── format.ts
│   └── styles/
│       ├── theme.css          # CSS variables (magenta/dark)
│       └── psv-overrides.css  # override styling viewer PSV
├── docs/
│   ├── PLAN.md                # file ini
│   └── ASSETS.md              # panduan menyiapkan panorama 2:1
├── .gitignore
├── README.md
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Prinsip struktur
- **Data terpisah dari UI** — semua konten (scene, hotspot, karya) di `src/data`.
  Menambah scene = edit satu file, bukan menyentuh komponen.
- **Viewer diisolasi** — seluruh logika Photo Sphere Viewer hanya di `src/components/viewer`
  + `src/hooks/useTourViewer.ts`, tidak bocor ke layout.
- **UI primitif di `src/components/ui`** — dipakai ulang, konsisten.
- **Aset di `public/media`** — path stabil, tidak di-hash Vite.
- **Token tema terpusat** — `src/config/theme.ts` + `src/styles/theme.css`.

## Model data (ringkas)
```ts
type Hotspot = {
  id: string
  type: "info" | "link" | "scene"
  pitch: number
  yaw: number
  title: string
  description?: string
  targetSceneId?: string
  href?: string
}

type Scene = {
  id: string
  name: string
  description: string
  panorama: string      // /media/panoramas/xxx.jpg
  thumbnail: string
  initialView: { pitch: number; yaw: number; zoom: number }
  hotspots: Hotspot[]
  project?: { title: string; role: string; year: string; tags: string[] }
}
```

## Rencana pengerjaan (phase)
1. **Fondasi** — scaffold Vite + React + TS, Tailwind v4, token tema, folder skeleton. ✅ (akan dibuat)
2. **Referensi UI** — cek ulang studio setelah login, samakan layout & palette.
3. **Viewer inti** — inisialisasi PSV, satu panorama, kontrol dasar.
4. **Multi-scene** — virtual-tour plugin, transisi, sidebar scene, gallery.
5. **Hotspot & konten** — marker info/project/link, panel detail.
6. **Polish** — animasi, glass panel, grid background, responsif, loading state.
7. **Verifikasi** — build produksi, cek di browser, screenshot perbandingan.

## Checklist kualitas
- [ ] Identik secara visual dengan referensi (warna, spacing, tipografi)
- [ ] Navigasi scene bebas & transisi halus
- [ ] Hotspot memiliki konten portofolio yang jelas
- [ ] Responsif di desktop & mobile
- [ ] Fullscreen + gyroskop + keyboard
- [ ] Loading state saat panorama berat dimuat
- [ ] `npm run build` sukses tanpa error
