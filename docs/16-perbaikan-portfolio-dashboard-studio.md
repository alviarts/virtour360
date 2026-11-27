# Perbaikan Portfolio, Dashboard, Studio, dan Responsivitas

## Rute profil baru
- Portofolio user kini memakai rute **`#/u/<username>-<6 char uid>`**, unik per akun/sesi (`profileSlug` di `src/lib/navigation.ts`).
- `#/u/<slug>` dirender `PublicPortfolioView`; judul & badge mengikuti slug/akun.
- Semua tautan "Portofolio" di Home, Dashboard, dan Studio diarahkan ke `navigateProfile(user?.name, user?.uid)`.
- `#/p/<uid>` tetap dipakai untuk **tour publik per project**.

## Portfolio (`#/portfolio`, `#/u/<slug>`)
- Logo header memakai `tone="white"` → wordmark & mark putih di atas panel gelap.
- Badge profil mengikuti username: `@{username}` (fallback `@demo`), bukan `@virtour360`.
- Tanpa user/demo, judul halaman = **Demo Portofolio**.
- Folder tanpa cover memakai thumbnail fallback agar kartu tidak berantakan.
- CTA **Hubungi** kini benar-benar bisa diklik → scroll ke bagian kontak (`#portfolio-contact`).
- Bottom nav **Map** diarahkan ke kontak; **Author** ke bagian author.

## Dashboard (`#/dashboard`)
- Nama akun di popover berubah ke putih.
- Pill "Portofolio Pribadi" diganti **URL publik** `/p/<uid>` yang bisa diklik.
- Nav **Portofolio** menuju URL username (`#/p/<uid>`), bukan halaman portofolio generik.
- Card "Catatan / Portofolio untuk teman" diganti panel **Free usage**: project unlimited, 3 GB storage, tanpa watermark.
- Project card menampilkan status **draft / review / published** dengan tiga warna + `<select>` untuk mengubahnya.

## Studio (`#/studio`)
- Slug publish otomatis memakai format **`username/alamat-tour`** agar tidak tabrakan; parser hash `#/p/...` kini menerima satu segmen lagi.
- HUD yaw/pitch di toolbar diperkecil (`h-7`, `text-[10px]`, padding lebih rapat).
- Command palette `⌘K` dan sidebar personal (Pulse · Scene saya · Favorit) tetap aktif.

## Home (`#/home`)
- Spacing menu Contact diperlebar menjauh dari tombol login.
- Visual tiga seksi fitur kini **demo portofolio pengguna** (posts, tours, published link), bukan duplikat UI Studio di atas.
- Seksi tours memakai JPG asli user `public/media/panoramas/layout_1.jpg` dengan narasi "Turn your 360 JPG into a live tour → Live visual studio".
- Visual publish: panorama menjadi **latar penuh** (`z-index: auto`) dan seluruh caption/status melayang di atasnya (`z-10`), tidak gepeng dan tidak bertabrakan.
- Tombol **Live layout_1.jpg** (di bawah paragraf seksi tours) dan badge **Live visual studio** di visual membuka viewer 360° penuh dengan panorama `layout_1.jpg`.
- Chat thread muncul **satu per satu saat scroll** dan **mengetik per huruf** (`Typed`, 16 ms per huruf + caret); pesan berikut mulai setelah pesan sebelumnya selesai. Kartu agent juga stagger (260–350 ms) dengan durasi diacak. `prefers-reduced-motion` menampilkan teks penuh seketika.
- Visual fitur tinggi minimum 280px di mobile + panorama `200%` agar tidak gepeng.
- Responsivitas: hero `px-3 sm:px-4`, grid fitur `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, stage wrapper padding 60/32/28/18px, sidebar Studio tersembunyi di mobile.

## Aset per project
- `StoredPanorama` dan `StoredAsset` kini punya `projectId`.
- Upload panorama/audio/gambar dicatat dengan `activeProject.id`.
- `scenes` hanya memasukkan panorama milik project aktif; mode demo hanya memakai scene bawaan.
- Modal Upload menampilkan "Panorama project ini", bukan semua panorama lama.

Verifikasi: Studio demo hanya menampilkan Atrium/Studio/Terrace — tidak ada lagi `rumah` / `layout_2` dari project sebelumnya.

## Mobile & misc
- `TourStage`: grid mobile 2 kolom, inspector hanya muncul di ≥640px, panorama mobile `auto 100%` (tidak gepeng) dan desktop `180% 100%`.
- Header Home: saat login menampilkan avatar + nama user + tombol **Keluar** (bukan "Log in"); tombol auth lebih dekat ke kiri di mobile (`ml-2 md:ml-10`).
- Dashboard: seluruh kartu project bisa diklik untuk pindah project ke Studio; select status tidak memicu navigasi.
- Portfolio: gambar `blob:` rusak diganti fallback; CTA **Hubungi** kini menuju `#/contact`.

## Publish per-project & QA (putaran terakhir)
- `Project.publishedUid` menyimpan alamat publish unik **per project**. Publish ulang memakai UID project itu, project lain tidak bisa menimpa.
- Slug default PublishModal sekarang `username/nama-scene-kode-acak` (6 karakter) supaya beda project tidak saling menimpa.
- Dashboard: klik kartu project **memindahkan project aktif ke Studio** (sesuai permintaan terakhir). Pratinjau 360° tetap tersedia lewat tombol mata eksplisit; tombol **Buka Studio**, publish, dan hapus tetap ada. Badge status memakai status asli (Draft / Dalam review / Dipublikasi).
- `getProjectScenes(projectId)` di AppContext mengambil scene project mana pun tanpa mengubah `activeProject`.
- Thumbnail upload disimpan sebagai **data URL** (`StoredPanorama.thumbnail`) supaya tetap tampil setelah refresh; scene lama yang hanya punya `blob:` tetap dapat fallback.
- Portofolio user memuat **hanya payload project yang benar-benar dipublish** milik user (bukan payload global terakhir), judul bagian memakai nama lengkap (`360° posts — <nama>`), bukan inisial.

## Verifikasi
Typecheck, `npm test` (46/46), dan build lolos. Browser: logo putih, badge `@demo`, CTA `Hubungi` menuju `#portfolio-contact`, folder fallback termuat. Putaran QA terakhir: klik kartu Dashboard pindah project, tombol mata membuka pratinjau, tidak ada error console pada modal pratinjau setelah perbaikan cache blob URL.

## Perbaikan QA lanjutan
- `urlCache` dikosongkan setelah `revokeObjectURL` pada cleanup AppContext. Tanpa ini, StrictMode/dev mount kedua memakai blob URL yang sudah dicabut → pratinjau dashboard gagal memuat tekstur (`ERR_FILE_NOT_FOUND`).
- Sidebar Studio: collapse sekarang **per grup**. Menu cepat `Collapse`/`Expand` mengubah semua grup sekaligus; satu chevron hanya menutup grup itu.
- Salin link/kode embed memakai `src/lib/clipboard.ts` dengan fallback `execCommand("copy")` + notifikasi; tidak lagi mengklaim "tersalin" saat clipboard ditolak browser.
- Tombol kembali di `#/p/<uid>` mengarah ke `#/u/<slug>` pemilik tour (dengan suffix UID bila pemilik sedang login), bukan ke Home.
- Setelah Keluar dari Header/Dashboard/Studio/account popover, aplikasi menuju `#/home`.
