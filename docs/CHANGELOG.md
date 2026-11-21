# Changelog — Virtour360

Semua perubahan dicatat di sini. Format: tanggal, area, perubahan, alasan.

## 2026-11-20 — Fondasi & tiga tampilan
- **Project**: scaffold Vite 8 + React 19 + TypeScript + Tailwind v4 + Photo Sphere Viewer 5.
- **Studio** (`src/App.tsx`): editor 360° — sidebar scene, mini-map, toolbar atas/bawah, inspector kanan.
- **Dashboard** (`src/views/DashboardView.tsx`): nav, filter, kartu project, notifikasi.
- **Public Portfolio** (`src/views/PublicPortfolioView.tsx`): profil, statistik, grid 360° posts & virtual tours.
- **Routing** (`src/Root.tsx`): hash router untuk ketiga tampilan.
- **Aset**: panorama lokal di `public/media/`, thumbnail generated via ffmpeg, favicon.
- **Deploy**: `vercel.json` ditambahkan (rewrite SPA + cache header).

## 2026-11-20 — Fitur interaksi (audit agent)
- **Hotspot**: tambah via tombol/klik panorama, edit judul/deskripsi/target/URL, hapus, undo, persist.
- **Viewer**: kualitas/kompas/gyroskop, mini-map klik+drag, indikator yaw (bug radian diperbaiki).
- **Studio**: pratinjau tanpa panel, Published, saran aksi nyata, camera/expand thumbnail,
  Select post, Replace, upload audio `.mp3` + player, hapus scene, modal profil.
- **Dashboard**: search + filter benar-benar menyaring, grid/list mengubah layout,
  kartu upload bisa dihapus/dibuka, tab Live/Studio.
- **Public Portfolio**: search, favorit persist, detail kartu, View more/less, stat Likes dinamis.
- **Auth**: validasi, sesi persist, ubah profil & password.
- **Bug fix**: `speed: "600ms"` → `speed: 600` (PSV menolak satuan ms).

## 2026-11-20 — Branding
- **Nama**: semua "Panoee" → "Virtour360" di UI, README, PLAN, banner, judul halaman.
- **Logo**: komponen `src/components/ui/Logo360.tsx` (cincin + orbit + angka 360),
  dipakai di Dashboard (pink) & Public (dark). Favicon diganti ke logo 360.

## 2026-11-20 — Database opsional (Supabase)
- `src/lib/supabase.ts`: klien opsional + penolakan secret key pada env `VITE_*`.
- `src/lib/remoteStore.ts`: baca/tulis state, upload/remove panorama.
- `src/lib/db.ts`: `StoredPanorama.url` untuk URL Storage.
- `src/context/AppContext.tsx`: sinkron state (debounce 800ms), identity per user/tamu.
- `supabase/schema.sql`: tabel `virtour_state` + bucket `panoramas`.
- `.env.example`, README: panduan env var.

## 2026-11-20 — Public view & Home
- **Public Home** (`src/views/PublicHomeView.tsx`): route default `#/`, hero, pencarian,
  trending panoramas, filter kategori, CTA, footer, floating nav.
- **Public Viewer** (`src/components/viewer/PublicViewerModal.tsx`): menjelajahi 360°
  layar penuh langsung dari kartu, tanpa masuk Studio.
- **Backend publik** (`api/public.js`): `/api/public` dibaca pengunjung tanpa login,
  ditulis saat tombol Published ditekan.
- **Routing**: default berubah dari Studio ke Home.

## 2026-11-20 — Penyimpanan berbasis login
- `api/auth.js` + `api/_auth.js`: register/login di database, password di-hash scrypt
  di server, sesi token bertanda tangan (HMAC), ubah profil & password.
- `api/state.js`: state privat dipaksa ke `user:<email>` dari token (isolasi antar user).
- `supabase/schema.sql`: ditambah tabel `virtour_users` — harus dijalankan ulang.
- `src/lib/authToken.ts`: penyimpanan & pembacaan token.
- `AppContext`: auth async via `/api/auth`, pemulihan sesi saat mount, token dikirim ke `/api/state`.
- `AuthModal`/`ProfileModal`: submit async.

## 2026-11-20 — Mode tamu (diperjelas)
- Upload panorama tidak lagi memaksa login; pesan "Mode tamu aktif".
- Tombol "Lanjut sebagai tamu" di modal login & pengaturan akun.
- Identitas tamu stabil (`guest:<id>`) di localStorage.

## 2026-11-21 — Hapus fitur tak terjangkau & efek scene nyata
- **Dihapus**: AI Edit 360, Model 3D, Grid, Analitik (placeholder disabled tanpa backend/aset).
- **Ditambah** (`src/lib/effects.ts` + `AppContext` + inspector):
  Levelling (roll), Nadir, Quick Fix (preset natural/warm/cool/mono),
  Custom Fix (brightness/contrast/saturate), Staging Day To Dusk,
  Filter Processing (hue/grayscale/sepia), Sun light — semuanya diterapkan
  langsung ke kanvas viewer via CSS filter + `sphereCorrection`, tersimpan per scene
  dan ikut tersinkron di state remote.
- **Bug fixing**: build rusak akibat edit bertahal (import tak terpakai) diperbaiki.

## 2026-11-22 — Seed 5 user dummy & panorama 360° gratis
- `scripts/seed-supabase.mjs`: bootstrap schema + 5 user dummy (password `demo1234`)
  + payload publik `virtour:public` berisi 5 kreator dengan panorama gratis
  (Pannellum demo: alma, bma-1, cerro-toco-0, from-tree, jfk).
- `src/lib/publicStore.ts`: `PublicCreator`/`PublicCreatorPost` ditambahkan ke payload.
- `PublicHomeView`: section kreator memakai data dari database bila tersedia,
  fallback ke 6 kreator lokal bila backend belum dikonfigurasi.
- **Verifikasi**: 5 user di `virtour_users`, hash password cocok `demo1234`,
  5 kreator & 5 panorama di `virtour:public`. Kredensial tidak disimpan di file.

## 2026-11-22 — Revisi komentar user (tamu/public, multi-user, gating, navigasi)
- **Hapus konsep "tamu"**: semua label UI jadi "publik"/"Kembali ke publik";
  modal login tidak lagi menawarkan "Lanjut sebagai tamu".
- **Banyak user di Home**: section baru "Kreator & karya mereka" — 6 kreator,
  tiap kreator 1 post gambar 360° dengan avatar & jumlah post.
- **Gating upload**: tombol Create/Upload di Home & Public Portfolio sekarang
  membuka modal login (publik tidak bisa mengunggah sembarangan); submit upload
  tanpa user juga dialihkan ke login.
- **Viewer Studio**: box navigasi "360 berikutnya / sebelumnya" dengan thumbnail
  & panah, klik untuk pindah scene.
- **Menu akun Studio**: tambah "Kembali ke Portofolio user" dan "Kembali ke Home".

## 2026-11-22 — Foldering hasil publish
- `src/lib/publicStore.ts`: ditambah `PublicFolder` + `buildPublicFolders()` yang
  mengelompokkan scene per **project** (slug dari `project.title`), lengkap dengan
  cover, deskripsi, tag, tahun, dan daftar `sceneIds`.
- Payload publish sekarang memuat field `folders` (kompatibel dengan payload lama
  yang belum punya folder — di-backfill saat dimuat).
- Public Portfolio menampilkan section **"Project & folder"**: satu kartu folder per
  project, bisa dibuka untuk melihat scene di dalamnya; adapun mode lokal memakai
  fallback folder dari scene setempat.

## 2026-11-22 — Perbaikan workflow user & public
- **Workflow user**: setelah register/login berhasil, otomatis navigasi ke `#/studio`
  dengan toast "Selamat datang di Studio" (sebelumnya modal hanya ditutup).
- **Workflow public**: Home sekarang memuat `loadPublicPayload()` dan menampilkan
  panorama hasil tombol **Published** lebih dulu, dengan kategori "Publish";
  dimuat ulang saat jendela mendapat fokus.
- **Publish feedback**: toast sukses/gagal saat menekan Published.
- Validasi browser: daftar → Studio ✅, Published → Portfolio ✅, Publish tampil di Home ✅.

## 2026-11-21 — Deployment ulang ke GitHub/Vercel
- Deploy produksi: https://virtour360-lemon.vercel.app
- Alias lama `portfolio-360-lemon.vercel.app` tetap aktif.
- Perbaikan: BOM di `vercel.json` dihapus, `.vercel` link di-rebuild.
