# 10. Audit Backend & Status Implementasi — Virtour360

> **Objek audit:** `C:\Users\visual works\Documents\rea\virtour360`
> **Live:** https://virtour360real.vercel.app/#/p/1x2m270p3j
> **Tanggal audit:** 2026-11-23
> **Metode:** baca seluruh `docs/*.md`, `README.md`, konfigurasi, `src/lib/*`, `src/context/AppContext.tsx`, `api/*.js`, `supabase/schema.sql`, `scripts/*.mjs`, dan komponen view; verifikasi langsung ke endpoint live lewat HTTP (`GET /api/public`, `GET /api/state`, `GET /api/auth`).
>
> **Catatan verifikasi:** tool browser tidak terhubung ke sesi subagent ini (`[browser.disconnected]`), sehingga **console error dan network tab live tidak bisa diamati langsung** oleh auditor. Klaim "console error 0" bersumber dari `docs/QA.md` dan `docs/VALIDATION.md`. Data live yang dikutip di bawah adalah hasil fetch HTTP nyata ke endpoint produksi, bukan dugaan. Tidak ada source code yang diubah.

---

## 1. Ringkasan dokumentasi yang ada

| Dokumen | Isi / rencana | Sudah dibangun (klaim dokumen) | Belum / catatan audit |
|---|---|---|---|
| `docs/PLAN.md` | Tujuan: portofolio pribadi 360° **bukan produk komersial**; tiga permukaan (Studio, Dashboard, Public Portfolio); keputusan stack Vite 8 + React 19 + Tailwind v4 + PSV 5; daftar plugin PSV; struktur folder ideal; model data `Scene`/`Hotspot`; 7 phase + checklist kualitas. | Sebagian besar direalisasikan (tiga view, PSV, hotkey, responsive, build sukses menurut QA). | Struktur folder di PLAN sudah **melenceng dari kode aktual**: `src/data/projects.ts`, `Sidebar.tsx`, `StatusBar.tsx`, `viewerFactory.ts`, `src/styles/theme.css`, `psv-overrides.css`, `tsconfig.node.json` tidak ada. Plugin `gallery-plugin` dan `video-plugin` tidak terpasang di `package.json`. Checklist masih centang kosong (`[ ]`) walau QA menyatakan PASS. |
| `docs/RESEARCH.md` | Reverse engineering Panoee dari bundle JS: stack (React/Redux, krpano 1.21.2, Pusher, **PostHog**, S3), daftar endpoint API, model hotspot, alur editor & publish, koordinat klik `ath/atv`. | Bagian yang "diimplementasikan": grup scene, sort, kualitas gambar, embed, hotspot picker 9 jenis, drag marker, efek ikon/clip-path. | Section "Tidak diimplementasikan" tegas: krpano, Pusher, **PostHog**, pembayaran, domain kustom, SEO, AI Edit 360 tidak dipakai. Polygon/Lottie/callout/zoomRange masih "belum". Ini satu-satunya tempat PostHog disebut — bukan di kode aplikasi. |
| `docs/VALIDATION.md` (2026-11-20) | Uji interaksi lokal vs referensi; tabel PASS per fitur Studio/Dashboard/Home/Portfolio; tabel perbandingan. | Viewer, scene, mini-map, hotspot, upload, filter, profil PASS. | Menyatakan **AI Edit 360, Model 3D, Grid, Analitik dihapus** (alasan: butuh backend/aset). Leveling/nadir/filter hanya efek CSS + `sphereCorrection`, bukan image processing pixel-level. Sinkron lintas device hanya jika Supabase dikonfigurasi. |
| `docs/QA.md` (2026-11-22) | QA frontend + backend produksi; daftar bug yang sudah diperbaiki; QA tambahan reverse-engineering & penempatan hotspot. | `/api/public`, register/login, `/api/state` isolasi per user, env var produksi, `node --check`, build 2222 modul — PASS. 3 bug lama tercatat (ID state `virtour360:public` vs `virtour:public`, publish menghapus `creators`, restore kreator). | Target tertulis `virtour360real.vercel.app`. Tidak ada pengujian analitik/views karena memang tidak ada fitur tersebut. |
| `docs/CHANGELOG.md` | Catatan kronologis 2026-11-20 → 22: fondasi, branding, DB opsional, auth server, mode tamu (lalu dihapus), seed 5 user, folder publish, gating login, perbaikan workflow. | Sangat lengkap sebagai Riwayat perubahan. | **Entri terakhir menyebut produksi `https://virtour360-lemon.vercel.app` + alias `portfolio-360-lemon.vercel.app`**, bertentangan dengan QA/VALIDATION dan live saat ini (`virtour360real.vercel.app`). Perlu diselaraskan. |
| `docs/ASSETS.md` | Panduan panorama equirectangular 2:1, struktur `public/media/panoramas` + `thumbnails`, perintah ffmpeg, sumber demo PSV, batas ~10 MB/file, cache immutable. | Sesuai konfigurasi `vercel.json`. | Tidak menyebut panorama seed Pannellum yang dipakai `scripts/seed-supabase.mjs`, juga tidak menyebut ` artist_workshop.jpg` / `ballroom.jpg` yang ternyata dipakai kreator di payload live. |
| `README.md` | Instruksi lokal/build/deploy Vercel; **Opsi A mode server** (secret di Function) vs **Opsi B mode klien** (anon key + Storage); seed dummy; mode publik; struktur folder; kontrol Studio. | Panduan env paling akurat; peringatan secret `VITE_*` sudah benar. | Klaim "Tidak ada environment variable yang wajib diisi" benar untuk mode lokal, tapi halaman Publik hasil publish **hanya bekerja di Opsi A** (lihat temuan T-10). Baris "Kontrol Studio: Tambah hotspot (mode lokal, belum tersimpan)" sudah usang — hotspot kini tersimpan & tersinkron. |
| `FEATURE_DOCS/00-DOKUMENTASI-FITUR-LENGKAP.md` | Indeks 12 bagian, placeholder bagian 1–12 (termasuk file ini sebagai bagian 10). | Kerangka dokumentasi final sudah siap. | Ringkasan eksekutif dan bagian lain masih `_diisi setelah semua agent selesai_`. |

**Kesimpulan dokumentasi:** dokumentasi sangat kaya untuk fitur UI dan perbaikan hariannya, tetapi **tidak ada satu dokumen pun yang menjelaskan arsitektur backend secara utuh** (mode data, identitas state, alur publish, batasan analitik). Audit ini mengisi celah tersebut.

---

## 2. Arsitektur teknis keseluruhan

### 2.1 Stack

| Lapisan | Pilihan aktual (`package.json` / kode) | Bukti |
|---|---|---|
| Build | Vite `^8.3.8`, Node `>=20.19.0` | `package.json`, `vite.config.ts` |
| Bahasa | TypeScript `^7.0.2`, `strict`, `noUnusedLocals`, `moduleResolution: bundler` | `tsconfig.json` |
| UI | React `^19.3.1` + React DOM, `lucide-react ^1.77.0`, `qrcode ^1.5.4` | `package.json` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite ^4.3.5` (plugin, bukan PostCSS) | `vite.config.ts` |
| Viewer 360 | `@photo-sphere-viewer/core ^5.15.1` + plugin `virtual-tour`, `markers`, `autorotate`, `compass`, `gyroscope`, `settings` | `package.json` |
| Database | Supabase/Postgres via `@supabase/supabase-js ^2.119.2` (REST, bukan koneksi TCP di runtime) | `src/lib/supabase.ts`, `api/*.js` |
| Serverless | Vercel Functions (`api/auth.js`, `api/state.js`, `api/public.js`, helper `api/_auth.js`) | folder `api/` |
| Data lokal | `localStorage` (state & sesi) + IndexedDB `virtour360` v2 (`panoramas`, `assets`) | `src/lib/db.ts`, `AppContext.tsx` |
| Seed/maintenance | `pg ^8.23.1` (devDependency), script `.mjs` koneksi ke pooler Supabase | `scripts/*.mjs` |
| Build command | `tsc -b && vite build`, output `dist/` | `package.json`, `vercel.json` |

Tidak ada Netlify config. Tidak ada test runner / linter / CI config di repo. `vite.config.ts` hanya menaikkan `chunkSizeWarningLimit` ke 1200 karena bundle three.js/PSV besar.

### 2.2 Deployment (Vercel)

`vercel.json`: `framework: vite`, `buildCommand: npm run build`, `outputDirectory: dist`, SPA rewrite `/(.*) → /index.html`, header `Cache-Control: public, max-age=31536000, immutable` untuk `/media/(.*)`.

`.vercel/project.json` menautkan project `virtour360` (`prj_B8OsWTxWr6k3OF7gLXqAnpKvsLVe`, org `team_oCMOO9jlynGjR2qWavTmnChR`). Domain aktif hasil audit: `virtour360real.vercel.app` (QA & fetch live); CHANGELOG masih menyebut domain lama.

Routing adalah **hash-based** (`src/lib/navigation.ts`): `#/`, `#/home`, `#/portfolio`, `#/portfolio/<creatorId>`, `#/p/<uid>`, `#/studio`, `#/dashboard`. `#/p/...` sengaja dipetakan ke `portfolio` (baris 7), lalu `PublicPortfolioView` membaca UID dengan `publicUidFromHash()`.

### 2.3 Environment variable

| Var | Dipakai di | Fungsi | Catatan |
|---|---|---|---|
| `VITE_USE_SERVER_DB` | `src/lib/supabase.ts` (`isServerMode`) | `=== "1"` mengaktifkan mode server (`/api/*`) | `.env.example` mengisinya `0` di bawah komentar "MODE SERVER" (lihat T-6). QA menyebut produksi terpasang `1`. |
| `SUPABASE_URL` | `api/auth.js`, `api/state.js`, `api/public.js` | URL REST Supabase sisi server | Tanpa prefix `VITE_`, aman. |
| `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | `api/*.js` + `api/_auth.js` (HMAC secret) | Service key sekaligus kunci tanda tangan sesi | Fallback `"virtour360-dev"` bila kosong (T-7). |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts` | Mode klien: akses `virtour_state` + Storage langsung dari browser | Klien ditolak bila key mengandung `sb_secret_` / `service_role`. |
| `SEED_DB_HOST/PORT/USER/PASSWORD`, `SEED_DATABASE_URL` | `scripts/*.mjs` | Koneksi Postgres untuk seed/perbaikan data | Hanya `seed-supabase.mjs` yang benar-benar membaca env (dan `SEED_DATABASE_URL` tidak dipakai, lihat T-8). |

Mode efektif: `isRemote = isServerMode || supabase !== null` (`supabase.ts:32`). Jadi tiga konfigurasi: lokal murni, server (Opsi A), klien (Opsi B), atau keduanya aktif.

---

## 3. Backend & data layer

### 3.1 Model data (tabel)

| Objek | Lokasi | Isi |
|---|---|---|
| `virtour_users` | Supabase | `email` (PK), `name`, `initials`, `password_hash` (scrypt `salt:hash`), `created_at`. |
| `virtour_state` | Supabase | `id text PK`, `data jsonb`, `updated_at`. Satu baris per identitas, bukan per entitas. |
| `virtour_state` IDs | `api/state.js`, `api/public.js` | `user:<email>` (privat), `guest:<random>` / `virtour360-shared` (fallback), `virtour:public` (publish default), `virtour:pub:<uid>` (publish per project). |
| `RemoteState` | `src/lib/remoteStore.ts` | `users`, `hotspots`, `favorites`, `media`, `panoramas`, `effects`, `groups`, `sceneGroups`, `sceneOrder`, `imageQuality`. |
| `PublicPayload` | `src/lib/publicStore.ts` | `profile`, `scenes: Scene[]`, `folders: PublicFolder[]`, `creators?`, `uid?`, `updatedAt`. |
| `PublicCreator` | seed + `publicStore.ts` | `id, name, initials, color, email, posts[]`; tiap `post.views` berupa **string** seperti `"12 post"`. |
| IndexedDB | `src/lib/db.ts` | `StoredPanorama {id,name,blob,url?}`, `StoredAsset {id,sceneId,kind:"audio"|"image",blob}`. |

### 3.2 Klien Supabase, query, realtime, RPC, Storage

- `src/lib/supabase.ts` membuat **satu** klien opsional dengan `auth: { persistSession: false }`; klien singleton dipakai ulang oleh `remoteStore.ts`.
- Pola query yang dipakai: `.from("virtour_state").select("data").eq("id", id).maybeSingle()`, `.upsert({ id, data, updated_at })`,-storage `.upload(path, file, {upsert:true})`, `.getPublicUrl(path)`, `.remove([path])`. Untuk user: `.select("*").eq("email", email).maybeSingle()`, `.insert`, `.update`.
- **Tidak ada Realtime**: tidak ada `supabase.channel(...)`, WebSocket, atau Pusher di kode aplikasi (Pusher hanya disebut di `RESEARCH.md` sebagai milik Panoee). Sinkronisasi = **load saat mount + debounce simpan 800 ms** di `AppContext.tsx:323–392`, dengan `remoteReady` gate. Last-write-wins; dua device bisa saling menimpa.
- **Tidak ada fungsi RPC / stored procedure**; `supabase/schema.sql` hanya berisi DDL tabel, RLS policy, dan bucket. Tidak ada migrasi berversi.
- **Storage**: bucket publik `panoramas` (dibuat di `schema.sql` dan juga oleh `seed-supabase.mjs`), dipakai hanya pada Opsi B / saat anon key tersedia (`uploadPanoramaFile`). Di mode server murni, upload panorama tetap menjadi `blob:` di IndexedDB.

### 3.3 API serverless

| Endpoint | Method | Perilaku | Auth |
|---|---|---|---|
| `/api/auth` | `GET` | Validasi token → `{ user }` | Token wajib (401) — terverifikasi live: **401**. |
| `/api/auth` | `POST` | `action: register \| login \| profile \| password`; scrypt + HMAC token 30 hari | register/login publik; profile/password butuh token. |
| `/api/state?key=<id>` | `GET` | Baca `virtour_state.data` untuk `id`; jika token valid, `id` dipaksa `user:<email>` | Token opsional (guest memakai `key`). Live: `key=virtour360-shared` → 200 `data:null`. |
| `/api/state` | `POST` | Upsert state; identitas sama seperti GET | Token opsional. |
| `/api/public?id=<uid>` | `GET` | Coba `virtour:pub:<uid>` lalu fallback `virtour:public`; mengembalikan `{ payload, uid }` | Publik, `Cache-Control: no-store`. Live: **200**. |
| `/api/public` | `POST` | Upsert `{ payload: {...payload, uid} }` ke `virtour:pub:<uid>` | Publik, tanpa auth. |

`api/_auth.js`: `signSession` = base64url(JSON user + `exp`) + HMAC-SHA256; `verifySession` memakai `timingSafeEqual`. `hashPassword`/`verifyPassword` = scrypt 64 byte dengan salt acak 16 byte.

### 3.4 RLS & keamanan

`schema.sql` mengaktifkan RLS pada kedua tabel, lalu membuat policy **sangat permisif**: `"virtour360 users service"` dan `"virtour360 anon all"` dengan `using (true) with check (true)`; policy Storage juga `for all using (true) with check (true)` untuk bucket `panoramas`. README dan schema sendiri memperingatkan ini "demo 2–5 orang" dan harus diganti `auth.uid()` untuk produksi. Konsekuensinya: siapa pun yang memiliki anon key bisa membaca/menulis seluruh state; endpoint `/api/public` dan `/api/state` (guest) juga tidak memeriksa auth. Kunci service **tidak** pernah dikirim ke browser dan klien menolak `VITE_*` yang berisi secret — ini bagian yang sudah benar.

### 3.5 Seed script

`scripts/seed-supabase.mjs`: koneksi `pg` ke pooler `aws-0-ap-southeast-2.pooler.supabase.com:6543`, user `postgres.zhkswftjzddnmlqdiupp`, password dari `SEED_DB_PASSWORD`. Menjalankan DDL (`create table if not exists`, policy), mengisi 5 user dummy (`alvi@`, `atrium@`, `ruang@`, `sunset@`, `harbor@example.com`, password `demo1234`) dengan hash scrypt, lalu menulis payload `virtour:public` berisi 5 kreator + panorama demo Pannellum. Script pendukung: `restore-creators.mjs` (memulihkan field `creators` yang hilang), `update-public-images.mjs` (replace string pada JSON), `update-creator-images.mjs` (mengganti `image`/`panorama` tiap kreator ke `/media/...` lokal).

### 3.6 Alur live: `#/p/1x2m270p3j` (terverifikasi)

1. Browser memuat `index.html` dari Vercel (SPA rewrite). Hash tidak dikirim ke server.
2. `currentView()` melihat awalan `p/` → render `PublicPortfolioView`.
3. `publicUidFromHash()` mengambil `1x2m270p3j`; `loadPublicPayload(uid)` → `GET /api/public?id=1x2m270p3j`.
4. `api/public.js` membuat `projectId(uid) = "virtour:pub:1x2m270p3j"`, query `virtour_state`. **Hasil fetch audit: HTTP 200**, `payload.uid = "1x2m270p3j"`, `updatedAt = 2026-11-22T13:46:19.311Z`.
5. Payload berisi **3 scene** (`atrium`, `studio`, `terrace`) dengan hotspot nyata (mis. `hs-process`, `hs-back`, `hs-next`, `hs-link`), **3 folder** (`The Gallery`, `Creative Room`, `Sunset Terrace`), profil `name: "awe"`, dan **5 kreator** hasil seed. `PublicPortfolioView` mem-backfill `folders` bila belum ada, lalu menampilkan `displayName` dari `folders[0].name` karena ada `sharedUid`.
6. `PublicViewerModal` menerima `sourceScenes` (3 scene) → viewer PSV multi-scene dengan VirtualTourPlugin + markers.

Perbandingan menarik: `GET /api/public` **tanpa uid** mengembalikan state default `virtour:public` dengan **4 scene** — tambahan `"kamar kos"` (`pano-1795348999373-0nk3c`) yang panorama/thumbnail-nya adalah **`blob:https://virtour360real.vercel.app/...`**. Artinya snapshot publish per-project (`1x2m270p3j`) berbeda dengan state publik default, dan state default mengandung URL yang tidak valid di browser/device lain (lihat T-1).

---

## 4. Analitik: views, likes, heatmap, click-path

**Temuan utama: tidak ada sistem analitik sama sekali.** Tidak ada kode `posthog`, `gtag`, `analytics.track`, penghitung view, atau event klik yang dikirim ke server. Satu-satunya penyebutan PostHog ada di `docs/RESEARCH.md` sebagai milik Panoee asli; `docs/VALIDATION.md`/`CHANGELOG.md` menyatakan fitur Analitik sengaja **dihapus**.

| Metrik | Bagaimana "dihitung" | Di mana disimpan | Verifikasi |
|---|---|---|---|
| **Views (kartu Home)** | String statis di `ITEMS`: `"2.4k"`, `"1.8k"`, `"3.1k"`, `"956"`, `"1.2k"`, `"4.7k"`. Untuk scene publish: `views` berisi `${index+1} scene`. Untuk kreator DB: `post.views` dari seed, mis. `"12 post"` (ini sebenarnya jumlah post, bukan view). | Hardcoded di `PublicHomeView.tsx:12–19`, dihitung di `:80–91`; nilai kreator dari payload live. | Payload live `?id=1x2m270p3j` menunjukkan `"views":"12 post"`, dll. Tidak ada field `viewCount` numerik. |
| **Views (profil)** | String tetap **`"1313"`** di `ProfileHeader` (`PublicPortfolioView.tsx:122`). | Hardcoded. | Tidak berubah saat membuka tour. |
| **Likes (profil)** | `likes={favorites.length}` (`PublicPortfolioView.tsx:379`) — jumlah favorit **user saat ini**, bukan total suara global. | `virtour360.favorites` di localStorage + `favorites` di `virtour_state` per identitas. | Toggle hati menambah/mengurangi array lokal; tidak ada agregasi di server/publik. |
| **Likes (kartu tour)** | `likes: 1` / `0` pada `tourCards` statis; tour hasil upload/creator selalu `likes: 0` (`:316`, `:364`). | Hardcoded di komponen. | Tidak ada `POST /api/like` atau sejenisnya. |
| **Comments** | Angka statis di `tourCards` (`0`, `2`, `8`). | Hardcoded. | Tidak ada input/penyimpanan komentar. |
| **Heatmap / click-path / session replay** | Tidak ada. Tidak ada instrumentasi klik, tidak ada peta panas, tidak ada funnel. | — | GREP seluruh repo: `heatmap`/`analytics` hanya muncul di `.agents/skills/dashboard-design/*` (dokumen skill desain, bukan aplikasi). |

**Implikasi dokumentasi:** angka "Views/Likes/Posts" di UI adalah **dekorasi portofolio**, bukan metrik produk. Jangan menyebutnya "basic analytics" di dokumentasi final; sebut sebagai "statistik tampilan statis".

---

## 5. Matriks status implementasi

Legenda: ✅ ada & terverifikasi live/dokumen · ◑ ada di kode tapi terbatas/sering tidak terlihat · ❌ tidak ada · ⚠ shelf-conflict/perlu koreksi dokumen.

| Fitur / rencana | Direncana di dokumen | Ada di kode | Terlihat di live app | Status & catatan |
|---|---|---|---|---|
| Tiga permukaan (Studio, Dashboard, Public Portfolio) | PLAN, README | ✅ `App.tsx`, `views/*`, `Root.tsx` | ✅ (Studio/Dashboard terverifikasi QA; `#/p/...` terverifikasi fetch) | ✅ Selesai |
| Home publik: hero 360 bergerak, typing search, trending, kategori, floating nav | CHANGELOG, QA | ✅ `PublicHomeView.tsx` | ✅ QA PASS | ✅ Selesai |
| Viewer PSV 5 + VirtualTourPlugin + marker + autorotate/compass/gyro | PLAN, VALIDATION | ✅ `package.json`, `TourViewer`, `PublicViewerModal` | ✅ payload 3 scene dimuat | ✅ Selesai |
| Hotspot CRUD, drag, 9 picker, style/efek | RESEARCH, QA, VALIDATION | ✅ `AppContext`, inspector, `effects.ts` | ✅ hotspot nyata di payload live | ✅ Selesai |
| Efek scene (roll/leveling, nadir, quick/custom fix, filter, sun light) | CHANGELOG, VALIDATION | ✅ `src/lib/effects.ts` | ◑ tersimpan di state per scene, tidak selalu tampak di payload publish | ✅ sebagai efek CSS (bukan image processing) |
| Grup scene + sort ↑/↓ + kualitas gambar | RESEARCH, QA | ✅ `AppContext` | ✅ QA produksi PASS | ✅ Selesai |
| Upload panorama & audio, replace/thumbnail | PLAN, VALIDATION | ✅ `db.ts`, `AppContext` | ◑ ada di state default, tapi panorama upload ber-`blob:` (T-1) | ◑ Lokal/device-only di mode server |
| Auth register/login/profile/password (DB, scrypt, HMAC) | README, CHANGELOG, QA | ✅ `api/auth.js`, `_auth.js` | ✅ `GET /api/auth` → 401 (terverifikasi) | ✅ Selesai |
| Isolation state per user (`user:<email>`) | README, QA | ✅ `api/state.js:38–40` | ✅ QA PASS | ✅ Selesai |
| Publish → link unik `#/p/<uid>`, QR, embed iframe | RESEARCH, CHANGELOG | ✅ `PublishModal`, `publicStore` | ✅ `?id=1x2m270p3j` → 200 dengan 3 scene | ✅ Selesai |
| Publish access Draft / Password | RESEARCH (publish modal Panoee) | ◑ UI ada di `PublishModal.tsx:21–124` | ❌ tidak berfungsi: `publish()` selalu POST ke endpoint publik | ⚠ Kosmetik (T-2) |
| Folder publik Project → Scenes | CHANGELOG | ✅ `buildPublicFolders` | ✅ 3 folder di payload live | ✅ Selesai |
| Kreator & karya mereka (5 seed) | CHANGELOG, QA | ✅ seed + `creators.ts` | ✅ 5 kreator di payload live | ✅ Selesai |
| Portofolio per kreator `#/portfolio/<id>` | CHANGELOG | ✅ `navigation.ts`, view | ✅ QA PASS | ✅ Selesai |
| Storage Supabase lintas device (Opsi B) | README | ✅ `remoteStore.uploadPanoramaFile` | ◑ hanya aktif bila anon key diisi; tidak terlihat di live (mode server) | ◑ Tersedia, bukan default |
| Sinkron state lintas device | README, VALIDATION | ✅ debounce 800 ms + load mount | ◑ tidak realtime; last-write-wins | ◑ Sekarang, bukan realtime (T-12) |
| Analitik views/likes asli | RESEARCH (Panoee punya PostHog) | ❌ | ❌ angka statis di UI | ❌ Sengaja dihapus (VALIDATION) |
| Heatmap / click-path / session replay | — | ❌ | ❌ | ❌ Tidak ada |
| AI Edit 360, Model 3D, Grid | VALIDATION, RESEARCH | ❌ tombol dihapus | ❌ | ❌ Sengaja tidak dibuat |
| Polygon hotspot, Lottie, callout, zoomRange penuh | RESEARCH | ❌ | ❌ | ❌ Butuh engine/pipeline |
| Domain kustom, SEO/reindex, pembayaran, Pusher | RESEARCH | ❌ | ❌ | ❌ Sesuai keputusan non-komersial |
| Plugin PSV gallery & video | PLAN | ❌ tidak di `package.json` | ◑ thumbnail gallery dibuat manual di sidebar | ⚠ Dokumen perlu diselaraskan (T-5) |
| Custom domain, cache refresh UI | RESEARCH | ❌ (cache header ada di `vercel.json`) | ❌ | ❌ |

---

## 6. Bug, inkonsistensi, dan keterbatasan

| ID | Severity | Temuan & bukti | Dampak / saran |
|---|---|---|---|
| **T-1** | Tinggi | Payload publik default `GET /api/public` memuat scene `"kamar kos"` dengan `panorama`/`thumbnail` = `blob:https://virtour360real.vercel.app/...`. `AppContext.tsx:379–388` memang sengaja tidak menyinkronkan metadata panorama di mode server, tetapi `publishPublicPayload()` menyalin `payload.scenes` apa adanya. | Panorama hasil upload **rusak/blank di browser atau device lain** setelah dipublish. Perlu sanitasi scene dengan `blob:` saat publish, atau konversi ke Storage URL. |
| **T-2** | Tinggi | `PublishModal` menawarkan Draft / Public / Password dan input password, tetapi fungsi `publish()` (`:44–67`) mengabaikan `access` dan `password`, selalu memanggil `publishPublicPayload()` → `POST /api/public` yang juga tanpa auth. | Mode Draft/Password **ilusi keamanan**; siapa pun dengan UID bisa mengakses. Dokumentasi harus menyatakan "semua publish bersifat publik", atau implementasikan pengecekan di server. |
| **T-3** | Sedang | Angka Views/Likes/Comments statis (lihat §4). `"1313"` hardcode, `"2.4k"` hardcode, `likes = favorites.length`. | Jangan diklaim sebagai analytics. Beri label "contoh statistik" di dokumentasi final. |
| **T-4** | Sedang | Domain produksi tidak konsisten: `QA.md`/`VALIDATION.md` → `virtour360real.vercel.app`; `CHANGELOG.md` entri terakhir → `virtour360-lemon.vercel.app` + alias `portfolio-360-lemon.vercel.app`. | Satukan ke `virtour360real.vercel.app` di seluruh dokumentasi. |
| **T-5** | Sedang | `PLAN.md` mendaftarkan file/plugin yang tidak ada (`projects.ts`, `Sidebar.tsx`, `StatusBar.tsx`, `viewerFactory.ts`, `styles/*.css`, `gallery-plugin`, `video-plugin`, `tsconfig.node.json`). | Tandai PLAN sebagai "rencana awal"; tambahkan daftar struktur as-built di README atau dokumen ini. |
| **T-6** | Sedang | `.env.example:11` menuliskan `VITE_USE_SERVER_DB=0` tepat di bawah komentar "MODE SERVER (direkomendasikan)". Kode hanya aktif jika nilainya `"1"`. | Risiko pengguna mengira mode server aktif. Ubah contoh menjadi `VITE_USE_SERVER_DB=1` dengan catatan "kosongkan/0 untuk lokal". |
| **T-7** | Sedang | `api/_auth.js:6` fallback secret HMAC = `"virtour360-dev"` (konstan publik). RLS `using(true)`/`with check(true)` pada semua tabel & bucket; `/api/state` dan `/api/public` menerima tulis tanpa token. | acceptable untuk demo 2–5 orang, tetapi **tidak aman untuk produksi**. Dokumentasikan sebagai batasan eksplisit (README sudah memberi warning umum, belum menyebut fallback secret). |
| **T-8** | Rendah | `seed-supabase.mjs` menyebut `SEED_DATABASE_URL` opsional di header, tetapi kode tidak pernah membacanya; script `restore-creators.mjs`, `update-public-images.mjs`, `update-creator-images.mjs` meng-hardcode host/user pooler. | Perbaiki dokumentasi env atau implementasikan parsing `SEED_DATABASE_URL`. |
| **T-9** | Rendah | `api/public.js:33–39`: bila `?id=<uid>` tidak ditemukan, endpoint **fallback ke `virtour:public`** dan mengembalikan HTTP 200, bukan 404. | Link salah/uid typo menampilkan konten lain tanpa peringatan. |
| **T-10** | Sedang | `loadPublicPayload()` (`publicStore.ts:109`) langsung `return null` bila `!isServerMode`. Jadi Opsi B (anon key) **tidak melayani halaman publik hasil publish**; Home/Portfolio jatuh ke data lokal. | README harus menyatakan publish + link publik hanya tersedia di Opsi A (mode server). |
| **T-11** | Rendah | `update-public-images.mjs` melakukan `replaceAll` string pada JSON mentah; `update-creator-images.mjs` menimpa panorama kreator dengan path lokal `/media/...` (hasil terlihat di payload live). | Script maintenance rapuh; memperbarui data bisa menghasilkan campuran URL absolut Pannellum dan path lokal. |
| **T-12** | Sedang | Tidak ada Supabase Realtime/WebSocket/Pusher. Sinkronisasi 800 ms saat perubahan + load saat mount; konflik tulis terakhir yang menang. | Dokumentasi tidak boleh menyebut "realtime". Sebut "sinkron periodik/optimistik". |
| **T-13** | Verifikasi | Console error/network tab live tidak bisa dicek langsung karena browser tidak terhubung ke sesi subagent. | Klaim "console error 0" mengacu pada `QA.md`/`VALIDATION.md`, bukan pengamatan audit ini. Disarankan agen dengan akses desktop browser mengulang pengecekan. |
| **T-14** | Rendah | `README.md` bagian kontrol Studio masih menyebut "+ Hotspot (mode lokal, belum tersimpan)", padahal hotspot kini persist + tersinkron; `PLAN.md` checklist kualitas masih semua `[ ]`. | Perbarui teks agar tidak menyesatkan. |

---

## 7. Rekomendasi untuk dokumentasi final

1. **Tambahkan bab "Arsitektur Backend"** ke `FEATURE_DOCS/00-DOKUMENTASI-FITUR-LENGKAP.md` berisi ringkasan §2–§3 audit ini: tiga mode data, tabel `virtour_state` + pola ID, endpoint `/api/*`, auth HMAC/scrypt, RLS permisif, dan **tanpa realtime/RPC**.
2. **Dokumentasikan alur publish end-to-end** dengan contoh nyata `#/p/1x2m270p3j → GET /api/public?id=... → virtour:pub:<uid> → 3 scene/3 folder`, including fallback ke `virtour:public`. Ini membantu pembaca memahami mengapa link publik berbeda dengan halaman Home.
3. **Beri label jujur pada statistik**: tulis eksplisit "Views/Likes/Comments adalah angka contoh statis; tidak ada penghitung, heatmap, atau click-path". Kutip `VALIDATION.md` bahwa Analitik sengaja dihapus.
4. **Satukan domain produksi** ke `virtour360real.vercel.app` di README, QA, VALIDATION, dan CHANGELOG; tandai domain lama sebagai historis.
5. **Tandai `PLAN.md` sebagai dokumen rencana awal** dan tambahkan "Struktur aktual" di README (folder `api/`, `supabase/`, `scripts/`, `context/`, `FEATURE_DOCS/`). Koreksi daftar plugin yang tidak terpasang.
6. **Tambahkan bagian "Batasan keamanan & demo"**: RLS `using(true)`, service key hanya di server, fallback secret HMAC, mode Draft/Password belum nyata, dan panic button: jangan pakai untuk data sensitif.
7. **Perbaiki `.env.example`** (nilai `VITE_USE_SERVER_DB`) dan **klaim README** tentang Opsi B (publish publik tidak tersedia) sebelum dokumentasi final dianggap akurat.
8. **Buat catatan teknis kecil untuk T-1**: sanitasi `blob:` saat publish atau arahkan ke Storage; ini bug nyata yang terlihat di data live dan sebaiknya tidak "ditutup" hanya oleh dokumentasi.
9. **Lengkapi verifikasi browser** (console/network) oleh sesi yang terhubung ke desktop app, lalu lampirkan hasilnya ke `QA.md` agar klaim "0 error" memiliki bukti dari audit ini juga.

---

### Lampiran bukti ringkas (fetch langsung, 2026-11-23)

| Permintaan | Status | Ringkasan respons |
|---|---|---|
| `GET /api/public?id=1x2m270p3j` | 200 | `uid: 1x2m270p3j`, 3 scene (`atrium`, `studio`, `terrace`), 3 folder, profil `"awe"`, 5 kreator, `updatedAt 2026-11-22T13:46:19.311Z`. |
| `GET /api/public` | 200 | 4 scene (tambahan `"kamar kos"` dengan URL `blob:`), `uid: null`, `updatedAt 2026-11-22T12:10:48.042Z`. |
| `GET /api/state?key=virtour360-shared` | 200 | `{ id: "virtour360-shared", data: null }` → endpoint hidup, env Supabase server terpasang. |
| `GET /api/auth` (tanpa token) | 401 | `/api/auth` mengamankan sesi sesuai kode. |
| `GET /` | 200 | HTML SPA berisi `<title>Virtour360 — Studio Virtual Tour</title>`. |
