# QA/QC workflow lanjutan & perbaikan (setelah commit `1d4a885`)

Dokumen ini mencatat pengecekan satu per satu terhadap masukan browser dan perbaikan yang dilakukan, lalu di-push ke `origin/main`.

## 1. Dropdown nav Product & Resources
- **Masalah:** dropdown hanya ada di Home. Di `#/product`, `#/resources`, `#/customers`, `#/pricing`, `#/contact`, tombol Product/Resources tidak punya submenu.
- **Perbaikan:** `src/views/MarketingViews.tsx` memakai state `menu` + `onMouseEnter`/`onMouseLeave` dengan panel absolut. Product → Studio, Scene & hotspot, Publish & embed, Pricing. Resources → Documentation, Quick start, Fitur & batasan, Syarat & ketentuan, Kebijakan privasi, Changelog.
- **QA:** hover Product menampilkan 4 entri; hover Resources menampilkan 6 entri; klik "Syarat & ketentuan" mengarah ke `#/resources/terms` dengan halaman dan 4 bagian isi.

## 2. Isi Resources/dokumentasi
- **Masalah:** tiap subpath hanya satu paragraf; tidak ada rules/TNC/daftar fitur.
- **Perbaikan:** 9 dokumen dengan struktur `intro` + bagian (paragraf, bullet, catatan):
  `documentation`, `quick-start`, `hotspot-guide`, `embed-share`, `community`, `changelog`, `features`, `terms`, `privacy`.
  Isi diselaraskan dengan fitur nyata: 9 tipe hotspot (point, chevron, image, article, video, sound, link, compact, product), rute `#/dashboard`, `#/studio`, `#/u/<slug>`, `#/p/<uid>`, paket gratis 3 GB, dan mode lokal/Supabase.
- **QA:** 9 rute dirender dengan `h1`, beberapa `h2`, 676–1994 karakter isi, 0 error console, 0 gambar rusak.

## 3. Customers realtime & status Supabase
- **Masalah:** kartu berasal dari `LOCAL_CREATORS` statis; klik kartu menuju Home.
- **Fakta awal:** repository hanya punya `.env.example`, tanpa `.env`. Setelah kredensial publishable diberikan, Supabase **sudah terhubung** (lihat bagian 10).
- **Perbaikan:**
  - `listPublishedPayloads()` menggabungkan baris `virtour:pub:*` dari Supabase dengan kunci `virtour360.published:*` lokal, deduplikasi berdasarkan UID asli dan UID tersanitasi; mode server tetap memakai `/api/public?list=1`.
  - `watchPublishedChanges()` mendengarkan `storage` event lintas tab, custom event `virtour360:published` saat publish, `postgres_changes` Supabase, serta polling 2,5 s (Supabase) / 4 s (lokal) / 12 s (server).
  - `api/public.js` kini mendukung `GET /api/public?list=1` hanya untuk baris `virtour:pub:%`.
  - `loadPublicPayload()` mencari baris Supabase bila tidak ada salinan lokal; `publishPublicPayload()` menulis `virtour:pub:<uid>` dan memberi peringatan bila panorama masih berupa `blob:`.
  - Kartu publish nyata menuju `#/p/<uid>` dengan badge **Supabase** atau **Lokal**; kartu bawaan diberi badge **Contoh**. Badge **Live · N tour dipublish** + tombol Segarkan.
- **QA:** feed menampilkan 4 tour Supabase (`/p/kamar-kos`, `/p/0b5q6r150p`, `/p/1x2m270p3j`, `/p/3u30714v4p`) + 2 publish lokal + 5 kartu Contoh. Klik kartu publish membuka viewer 360°.

## 4. Klik kartu Dashboard
- **Masalah:** setelah perubahan sebelumnya, klik kartu membuka pratinjau; user meminta klik kartu **pindah project**.
- **Perbaikan:** `onClick` kartu & cover memanggil `openProjectById(project.id)` (`setActiveProject` + `navigate("studio")`). Pratinjau dipindah ke tombol mata `Pratinjau 360° project ini`.
- **QA:** klik kartu "Project QA Dua" mengubah `virtour360.activeProject` dan membuka Studio dengan project itu; tidak ada modal. Klik tombol mata membuka modal pratinjau dengan canvas.

## 5. Collapse grup Studio
- **Masalah:** satu boolean `collapsed` menutup/buka **semua** grup sekaligus.
- **Perbaikan:** `collapsedGroups: Record<string, boolean>` di `LeftSidebar.tsx`. Chevron grup hanya mengubah `label` itu; tombol cepat `Collapse`/`Expand` mengubah semua grup; "Pulihkan tampilan" mengosongkan state.
- **QA:** dua grup ("Uncategory", "aw") — menutup "Uncategory" membuat chevronnya `up` sementara "aw" tetap `down`. Tombol cepat mengubah keduanya menjadi `up`, lalu `down` lagi.

## 6. Salin link tidak berfungsi
- **Masalah:** `navigator.clipboard.writeText` gagal di context non-secure/iframe, error ditelan, UI tetap menampilkan centang.
- **Perbaikan:** `src/lib/clipboard.ts` — coba `navigator.clipboard`, lalu fallback textarea + `document.execCommand("copy")`. Dipakai di `PublishModal` (link + embed), `EmbedModal`, dan "Salin link publish" di `App.tsx`. Gagal → notifikasi untuk salin manual, bukan centang palsu.
- **QA:** klik "Salin link" memunculkan toast "Link disalin."; klik "Copy Code" memunculkan "Kode embed disalin." + label "Tersalin".

## 7. Tombol Home di tour publish
- **Masalah:** tombol mengarah ke `#/home`; user ingin kembali ke portofolio user.
- **Perbaikan:** `PublicTourView.tsx` memakai `navigateProfile(ownerName, ownerUid)`; `ownerName` dari `payload.profile.name`/slug, `ownerUid` dipakai bila user login sebagai pemilik. Tombol dan `onClose` viewer memakai handler yang sama, teks "Portofolio".
- **QA:** tanpa login → `#/u/awe`; setelah login → `#/u/awe-ea8520` (UID turunan email karena kolom `uid` belum ada di tabel Supabase). Keduanya menampilkan `360° posts — awe` dan `Virtual tours — awe`.

## 8. Dashboard tetap "perlu login" setelah logout
- **Fakta:** ini guard yang bekerja (`Root.tsx` menampilkan `LoginRequired` bila `view` privat dan `user === null`), bukan bug sesi. Namun pengalaman user membingungkan karena hash masih `#/dashboard`.
- **Perbaikan:** semua call site `logout()` kini mengikuti dengan `navigate("home")` — Dashboard, Studio (account popover), Home, dan header marketing.
- **QA:** klik avatar → Keluar di `#/dashboard` menghasilkan `location.href = .../ #/home`, `virtour360.session = null`, dan tidak ada teks "Dashboard perlu login".

## 9. Bug tambahan yang ketemu saat QA
- Pratinjau Dashboard gagal memuat tekstur setelah reload (`ERR_FILE_NOT_FOUND` pada blob URL). Penyebab: cleanup effect AppContext me-revoke URL tetapi tidak mengosongkan `urlCache`, sehingga mount kedua (StrictMode) memakai URL mati. Perbaikan: `urlCache.clear()` dan `assetUrls.current.clear()` setelah revoke.
- Publish project baru sempat mewarisi UID global project lama; sudah diperbaiki sebelumnya (`existingUid={activeProject ? activeProject.publishedUid ?? null : publishedUid}`) dan diverifikasi ulang: project baru "QA Tiga" mendapat slug unik `awe/tour-6x2459`, sedangkan publish ulang "Project QA Dua" tetap `awe/ruang-qa-dua-010433`.

## 10. Koneksi Supabase dengan publishable key
- **Input user:** URL project, publishable key `sb_publishable_...`, serta host/port/database/user Postgres. Hanya URL + publishable key yang dipakai browser; kredensial DB langsung tidak dipakai dan tidak disimpan.
- **Perubahan:** `.env` lokal (di-`gitignore`) berisi `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. `supabase.ts` menerima format `sb_publishable_` karena bukan `sb_secret_`/service-role.
- **Perbaikan data:** `publishPublicPayload()` sekarang upsert ke `virtour_state` dengan id `virtour:pub:<uid>` (kompatibel dengan `api/public.js`); `loadPublicPayload()` bisa membaca baris itu; `listPublishedPayloads()` menggabungkan remote + lokal; feed menyebut sumbernya.
- **Keamanan:** state remote sengaja menyimpan `users: []` di mode klien. QA mengonfirmasi row `user:awe@gmail.com` tidak mengandung password plaintext. Hanya panorama dengan public URL yang ikut disinkron.
- **QA Supabase:** REST `virtour_state`/`virtour_users` → 200; `supabase-js` membaca 5 baris `virtour:pub:*`; publish uji `qa-browser-write-zzz9` → `ok: true`, muncul di feed, lalu dihapus; sisipan baris uji lewat REST menaikkan hitungan 6 → 7 dalam ≤5,5 detik via polling, penghapusan kembali ke 6; websocket Realtime terhubung (`wss://.../realtime/v1/websocket`) namun event belum masuk <1,8 detik karena tabel belum masuk publication.
- **Belum selesai di sisi Dashboard Supabase:** bucket `panoramas` belum ada (`NoSuchBucket`) dan `virtour_state` perlu ditambahkan ke `supabase_realtime` publication. Query SQL ada di `docs/19-koneksi-supabase.md`. Sampai dijalankan, upload panorama memakai fallback lokal dan feed memakai polling 2,5 detik.

## 11. Semua akun dipindah ke Supabase
- **Permintaan:** "semuanya supabase dong, bahkan user:password:email".
- **Keputusan:** tidak memakai Supabase Auth/GoTrue karena project mengaktifkan konfirmasi email dan signup kena `429 email rate limit exceeded`. Akun disimpan di tabel `virtour_users` yang sudah ada, memakai `password_hash` scrypt format `salt:hash` yang identik dengan `api/_auth.js`.
- **Perubahan:** `src/lib/authRemote.ts` baru (hash/verifikasi scrypt via `@noble/hashes`, CRUD `virtour_users`, UID turunan SHA-256 bila kolom `uid` belum ada, migrasi akun lokal sekali saat login). `AppContext` memakai fungsi itu untuk register/login/profile/password dan memvalidasi sesi ke Supabase saat mount. `logout()` ikut menghapus sisa `virtour360.users`. `ProfileModal` kini menyebut Supabase bila `isRemote`.
- **Kompatibilitas:** hash scrypt lama di tabel (salt hex dipakai sebagai string UTF-8) diverifikasi dengan benar di browser — akun `awe@gmail.com` langsung bisa login tanpa dibuat ulang.
- **QA akun uji:** daftar `qa-supabase@example.com` lewat UI → baris dibuat, `plain: false`; profil diubah → nama remote `QA Supabase Pro`; password diubah → hash berubah `2a1ba936…` → `1685df44…`; password lama ditolak, baru diterima; akun uji dihapus (`DELETE 204`).
- **QA regresi:** logout → login ulang stabil, `virtour360.users = null`, 0 error console; sweep 10 rute 0 error/gambar rusak/overflow.

## Verifikasi akhir
- `npm run typecheck` ✅
- `npm test` — 46/46 ✅
- `npm run build` ✅
- Browser sweep 10 rute pasca-auth: 0 error console, 0 `src=""`, 0 gambar rusak, 0 overflow horizontal ✅
- End-to-end: login → pindah project → pratinjau → collapse per grup → salin link → publish per project → feed Customers → klik tour → kembali ke profil → logout → Home ✅
