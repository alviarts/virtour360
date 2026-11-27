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
- **Fakta:** Supabase **belum terhubung** — repository hanya punya `.env.example`, tanpa `.env`. Aplikasi berjalan lokal.
- **Perbaikan:**
  - `listPublishedPayloads()` membaca semua kunci `virtour360.published:*` (mode lokal) atau `/api/public?list=1` (mode server).
  - `watchPublishedChanges()` mendengarkan `storage` event lintas tab, custom event `virtour360:published` saat publish, `postgres_changes` Supabase bila klien tersedia, plus polling 4 s (lokal) / 12 s (server).
  - `api/public.js` kini mendukung `GET /api/public?list=1` hanya untuk baris `virtour:pub:%`.
  - Kartu publish nyata menuju `#/p/<uid>`; kartu bawaan diberi badge **Contoh** dan menuju `#/u/<slug>`. Badge **Live · N tour dipublish** + tombol Segarkan.
- **QA:** feed menampilkan 2 publish sungguhan (`/p/awe/ruang-qa-dua-010433`, `/p/awe/ruang-qa-utama-585i5i`) dan 5 kartu Contoh. Menambah payload + men-dispatch event menaikkan hitungan 2 → 3 dalam 700 ms. Klik kartu publish membuka viewer 360°.

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
- **QA:** tanpa login → `#/u/awe`; setelah login → `#/u/awe-693f28`. Keduanya menampilkan `360° posts — awe` dan `Virtual tours — awe`.

## 8. Dashboard tetap "perlu login" setelah logout
- **Fakta:** ini guard yang bekerja (`Root.tsx` menampilkan `LoginRequired` bila `view` privat dan `user === null`), bukan bug sesi. Namun pengalaman user membingungkan karena hash masih `#/dashboard`.
- **Perbaikan:** semua call site `logout()` kini mengikuti dengan `navigate("home")` — Dashboard, Studio (account popover), Home, dan header marketing.
- **QA:** klik avatar → Keluar di `#/dashboard` menghasilkan `location.href = .../ #/home`, `virtour360.session = null`, dan tidak ada teks "Dashboard perlu login".

## 9. Bug tambahan yang ketemu saat QA
- Pratinjau Dashboard gagal memuat tekstur setelah reload (`ERR_FILE_NOT_FOUND` pada blob URL). Penyebab: cleanup effect AppContext me-revoke URL tetapi tidak mengosongkan `urlCache`, sehingga mount kedua (StrictMode) memakai URL mati. Perbaikan: `urlCache.clear()` dan `assetUrls.current.clear()` setelah revoke.
- Publish project baru sempat mewarisi UID global project lama; sudah diperbaiki sebelumnya (`existingUid={activeProject ? activeProject.publishedUid ?? null : publishedUid}`) dan diverifikasi ulang: project baru "QA Tiga" mendapat slug unik `awe/tour-6x2459`, sedangkan publish ulang "Project QA Dua" tetap `awe/ruang-qa-dua-010433`.

## Verifikasi akhir
- `npm run typecheck` ✅
- `npm test` — 46/46 ✅
- `npm run build` ✅
- Browser sweep 21 rute: 0 error console, 0 `src=""`, 0 gambar rusak, 0 overflow horizontal ✅
- End-to-end: login → pindah project → pratinjau → collapse per grup → salin link → publish per project → feed Customers → klik tour → kembali ke profil → logout → Home ✅
