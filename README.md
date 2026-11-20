# Virtour360 — Studio & Portofolio Virtual Tour 360°

Portofolio virtual tour 360° dengan tiga tampilan utama:

| View | Route | Deskripsi |
|---|---|---|
| **Public Home** | `#/` (default) | Landing page publik: hero, pencarian, trending panoramas, kategori |
| **Public Portfolio** | `#/portfolio` | Frontend setelah publish: profil, statistik, grid 360° posts & virtual tours |
| **Studio / Editor** | `#/studio` | Editor tour gelap: sidebar scene, mini-map, toolbar, panel inspector |
| **Dashboard** | `#/dashboard` | Backend: nav Virtour360, filter, kartu project Published, notifikasi |

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

## Database opsional (Supabase, untuk 2–5 orang)

Aplikasi **tetap berfungsi penuh tanpa database** (data tersimpan di browser).
Kalau ingin data bersama lintas device, ikuti langkah ini:

### Opsi A — Mode server (direkomendasikan)

Secret key **hanya disimpan di Vercel Function** (`api/state.js`), tidak pernah
dikirim ke browser. Koneksi memakai REST API Supabase, bukan Postgres port 5432.

1. SQL Editor → jalankan ulang isi `supabase/schema.sql`
   (tabel `virtour_users` untuk akun + `virtour_state` untuk data privat/publik)
2. Vercel → Settings → Environment Variables, isi:
   - `VITE_USE_SERVER_DB` = `1`
   - `SUPABASE_URL` = `https://<project-ref>.supabase.co`
   - `SUPABASE_SECRET_KEY` = secret/service key Supabase
3. Deploy ulang

Dengan mode server:
- **Akun tersimpan di database** (`virtour_users`): register/login via `/api/auth`,
  password di-hash dengan scrypt di server, sesi berupa token bertanda tangan
- **Data privat per user** (`user:<email>`): hotspot, favorit, media override
  tersinkron lintas device setelah login, dan tidak bisa dibaca user lain
- **Tombol Published** menyalin data ke state publik (`virtour:public`) yang
  dibaca pengunjung tanpa login lewat `/api/public`

File panorama tetap disimpan per-browser (metadata tidak disinkron agar tidak
muncul gambar rusak di device lain). Untuk panorama lintas device, pakai Opsi B.

### Opsi B — Mode klien (anon public key)

1. SQL Editor → jalankan `supabase/schema.sql`
2. Settings → API → ambil **Project URL** + **anon public** key (diawali `eyJ...`)
3. Isi `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`, lalu build/deploy ulang

Kelebihannya: panorama yang diunggah ikut tersimpan di Supabase Storage
(bucket `panoramas`) dan bisa dibuka dari device lain.

> ⚠️ Jangan pernah memasukkan `sb_secret_...`, `service_role`, atau password DB
> ke env berprefix `VITE_` — nilainya ikut ter-bundle ke browser.
> Aplikasi otomatis menolak secret key pada env klien.

> Catatan: policy di `schema.sql` sengaja permisif untuk demo 2–5 orang.
> Untuk produksi, ganti dengan aturan auth yang tepat.

## Mode tamu (tanpa login)

Login **tidak wajib**. Tanpa akun, pengguna tetap bisa:
- menjelajahi & memutar tur 360°
- menambah/mengedit/menghapus hotspot
- mengunggah panorama 360° (tersimpan di browser/IndexedDB)
- menyimpan favorit & mengatur scene

Identitas tamu dibuat otomatis (`guest:<id>` di localStorage) dan dipakai sebagai
kunci state di backend, sehingga data tamu tidak tercampur dengan user lain.
Saat login, kunci berubah menjadi `user:<email>` dan data dimuat ulang.
Tombol "Lanjut sebagai tamu" tersedia di modal login & pengaturan akun.

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

- Di **Public Home**: klik "Portofolio" / floating nav "Author" → Public Portfolio.
- Di **Public Portfolio**: klik "Studio" → Studio; klik logo → kembali ke Home.
- Di **Studio**: klik avatar `aw` di kiri atas → Dashboard.
- Di **Dashboard**: klik logo Virtour360 → Studio; klik "View Public Profile" → Public Portfolio.
- Atau ubah hash URL langsung: `#/home`, `#/portfolio`, `#/studio`, `#/dashboard`.

## Kontrol Studio

| Aksi | Cara |
|---|---|
| Pindah scene | Klik thumbnail di sidebar / panah 3D di panorama / Arrow Left-Right |
| Reset tampilan | Tombol "Default view" / `R` |
| Zoom | Wheel / tombol +/- / `+` `-` |
| Layar penuh | Tombol di toolbar bawah / `F` |
| Tambah hotspot | Tombol "+ Hotspot" (mode lokal, belum tersimpan) |
