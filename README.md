# Virtour360° — Replika Panoee Studio

Portofolio virtual tour 360° dengan tiga tampilan utama yang meniru ekosistem Panoee:

| View | Route | Deskripsi |
|---|---|---|
| **Studio / Editor** | `#/studio` (default) | Editor tour gelap: sidebar scene, mini-map, toolbar, panel inspector |
| **Dashboard** | `#/dashboard` | Backend: nav Panoee, filter, kartu project Published, notifikasi |
| **Public Portfolio** | `#/portfolio` | Frontend setelah publish (ala `panoee.live`): profil, statistik, grid 360° posts & virtual tours |

Dibangun dengan React 19, Vite 8, Tailwind CSS v4, dan Photo Sphere Viewer 5.

## Jalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

## Build produksi

```bash
npm run build
npm run preview
```

Output ada di `dist/`.

## Deploy ke Vercel

### Cara 1 — Vercel CLI (paling cepat)

```bash
npm i -g vercel
vercel login
vercel            # preview
vercel --prod     # produksi
```

Karena `vercel.json` sudah berisi `framework: vite`, `buildCommand`, dan
`outputDirectory`, Vercel akan mendeteksi semuanya otomatis.

### Cara 2 — Dashboard Vercel

1. Push folder ini ke repository GitHub.
2. Di Vercel → **Add New → Project**, import repo tersebut.
3. Biarkan preset **Vite** (terdeteksi otomatis).
4. Fields yang terisi otomatis dari `vercel.json`:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Klik **Deploy**.

### Catatan Vercel

- Tidak ada environment variable yang wajib diisi.
- Semua panorama disimpan lokal di `public/media/` sehingga tidak bergantung
  pada CDN eksternal saat runtime.
- `vercel.json` sudah menambahkan SPA rewrite dan header cache untuk aset media.

## Struktur

```
src/
├── components/  # layout, viewer, panel, UI primitif
├── data/        # konten portofolio (scene, hotspot, profil)
├── hooks/       # lifecycle viewer, fullscreen, hotkey
├── lib/         # helper graph & format
├── styles/      # token tema + override viewer
└── types/       # tipe data tour
```

Lihat `docs/PLAN.md` untuk rencana lengkap dan `docs/ASSETS.md` untuk panduan
menyiapkan panorama equirectangular sendiri.

## Navigasi antar tampilan

- Di **Studio**: klik avatar `aw` di kiri atas → Dashboard.
- Di **Dashboard**: klik logo Panoee → Studio; klik "View Public Profile" → Public Portfolio.
- Di **Public Portfolio**: klik tombol "Studio" → Studio.
- Atau ubah hash URL langsung: `#/studio`, `#/dashboard`, `#/portfolio`.

## Kontrol Studio

| Aksi | Cara |
|---|---|
| Pindah scene | Klik thumbnail di sidebar / panah 3D di panorama / Arrow Left-Right |
| Reset tampilan | Tombol "Default view" / `R` |
| Zoom | Wheel / tombol +/- / `+` `-` |
| Layar penuh | Tombol di toolbar bawah / `F` |
| Tambah hotspot | Tombol "+ Hotspot" (mode lokal, belum tersimpan) |
