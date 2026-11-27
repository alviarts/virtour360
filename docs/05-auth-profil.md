# 05 — Autentikasi & Profil User — Virtour360 (replika Panoee)

> Dokumentasi berbasis kode sumber `C:\Users\visual works\Documents\rea\virtour360` dan
> verifikasi terhadap deploy live <https://virtour360real.vercel.app/#/p/1x2m270p3j>.
> Disusun 23 November 2026. Tidak ada perubahan source code yang dilakukan.

---

## Ringkasan eksekutif

| Aspek | Temuan |
| --- | --- |
| Provider auth | **Bukan Supabase Auth**. Akun disimpan di tabel `public.virtour_users` (email + `password_hash` scrypt) melalui Vercel Function `/api/auth`. Di mode lokal akun disimpan plaintext di `localStorage`. |
| Metode | Email + password saja. **Tidak ada** magic link, OAuth/Google, email verification, forgot/reset password, 2FA. |
| Token | Custom HMAC-SHA256 "T token" (`base64url(payload).base64url(sig)`, berlaku 30 hari), disimpan di `localStorage` key `virtour360.token`, dikirim sebagai `Bearer`. |
| Session restore | `/api/auth` GET saat mount hanya jika token ada; token invalid/expired dihapus. |
| Guard | Hash-router: `#/studio` dan `#/dashboard` menampilkan `LoginRequired` bila `user === null`. `#/home`, `#/portfolio`, `#/p/<uid>` publik. |
| Profil | Hanya **nama + email + inisial** (dan ganti password). Tidak ada avatar upload, bio, kontak, social, atau role di akun. Profil "lengkap" (bio, website, lokasi) adalah **data statis demo** di `src/data/profile.ts`. |
| Kolaborasi | **Tidak ada** peran view/editor/admin, invite, atau team management. Tabel `creators` di payload publik hanyalah data demo/seed. |
| Kepemilikan | Tidak ada `owner_id`. Isolasi data memakai **key string**: `user:<email>` vs `guest:<id>` di tabel `virtour_state`. |
| RLS | Aktif tapi **sengaja permisif** (`using (true)`) untuk demo 2–5 orang; mode server memakai service-role yang bypass RLS. |

---

## 1. Arsitektur & tiga mode penyimpanan

Sumber: `src/lib/supabase.ts:3-35`, `src/context/AppContext.tsx:117-128`, `.env.example:1-21`, `README.md:63-106`.

| Mode | Syarat | Akun & sesi | Data workspace | Deploy live |
| --- | --- | --- | --- | --- |
| **Lokal** (default) | env kosong | `localStorage`: `virtour360.users` (berisi `password` plaintext), `virtour360.session` | `localStorage` + IndexedDB (`virtour360`, store `panoramas`/`assets`) | Tidak |
| **Server** (direkomendasikan) | `VITE_USE_SERVER_DB=1` + `SUPABASE_URL` + `SUPABASE_SECRET_KEY` di Vercel | `/api/auth` → tabel `virtour_users`; password di-hash scrypt di server; token HMAC | `/api/state`, key `user:<email>` / `guest:<id>` | **Ya** (terverifikasi, lihat §10) |
| **Klien** | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Akun tetap lokal; Supabase hanya dipakai untuk state & Storage | `virtour_state` via anon key + bucket `panoramas` | Tidak |

Catatan kode:
- `supabase` client browser dibuat hanya jika URL ada dan anon key **bukan** `sb_secret_*`/`service_role`; secret ditolak dengan `console.warn` (`supabase.ts:10-27`). `persistSession: false` — Supabase Auth tidak menyimpan sesi.
- `isRemote = isServerMode || supabase !== null` (`supabase.ts:30-32`); sinkronisasi state di `AppContext.tsx:321-392` (debounce 800 ms untuk save).
- `SHARED_STATE_ID = "virtour360-shared"` (`supabase.ts:35`) — fallback state bersama; di bundle live konstanta ini ter-tree-shake karena mode server aktif.

---

## 2. Alur login / register

### 2.1 Modal — `src/components/auth/AuthModal.tsx:6-152`

- Dirender global di `src/Root.tsx:56`, muncul hanya saat `authOpen === true` (`AuthModal.tsx:15`). `z-[100]`, overlay `bg-black/70 backdrop-blur-sm`.
- **Dua mode** dengan state lokal `useState<"login" | "register">("login")` (`AuthModal.tsx:8`). Tab "Login"/"Register" di `AuthModal.tsx:67-79`; mengganti tab mengosongkan `error` dan field konfirmasi, **tetapi tidak mengosongkan password**.
-Field:

| Mode | Field | Keterangan | Ref |
| --- | --- | --- | --- |
| Login | Email (`type=email`, required), Password (`type=password`, required) | placeholder password "Minimal 6 karakter" | `AuthModal.tsx:94-115` |
| Register | Nama (required), Email, Password, Ulangi password | nama placeholder "Nama Anda" | `AuthModal.tsx:82-129` |

- **Validasi klien** (`AuthModal.tsx:17-33`): regex email `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; register → nama `trim().length >= 2` dan `password === confirm`. **Panjang password tidak divalidasi di modal** (pesan "Minimal 6 karakter" hanya placeholder); di mode server server yang menolak < 6 (`api/auth.js:37`), di mode lokal `AppContext.tsx:425`.
- **Submit** (`AuthModal.tsx:34-48`): memanggil `login(email, password)` atau `register(name, email, password)` dari context. Jika mengembalikan string → tampil sebagai pesan error merah (`AuthModal.tsx:131`). Jika sukses: modal ditutup, password & confirm dikosongkan, toast:
  - login → **"Selamat datang kembali! Studio siap digunakan."**
  - register → **"Akun berhasil dibuat. Selamat datang di Studio!"**
  - lalu **`navigate("studio")`** — selalu ke Studio, tidak ada mekanisme `returnTo` ke halaman asal.
- Tombol "Kembali ke publik" (`AuthModal.tsx:138-144`) hanya menutup modal; footer `AuthModal.tsx:146-148` menyatakan publik bisa melihat tanpa login.
- Judul: "Masuk ke Virtour360" / "Buat akun baru" (`AuthModal.tsx:55-60`).

### 2.2 Implementasi `login` / `register` — `src/context/AppContext.tsx:403-483`

**Mode server** (`authRequest` di `AppContext.tsx:155-171`, POST `/api/auth` dengan Bearer token):
- `register` → `api/auth.js:33-45`: validasi nama/email/password, normalisasi email lowercase, cek duplikat → 409 "Email sudah terdaftar. Silakan daftar dulu." (pesan aktual: "Silakan login."), insert `virtour_users` dengan `initials` dari 2 kata pertama, `password_hash = hashPassword(password)`, kembalikan token + user.
- `login` → `api/auth.js:47-58`: email dinormalisasi, 404 "Akun tidak ditemukan. Silakan daftar dulu." bila tidak ada, 401 "Password salah." bila hash cocok, kembalikan token + user.
- Keduanya: `setAuthToken(token)` → `localStorage.setItem("virtour360.session", JSON.stringify(user))` → `setUser(session)`.

**Mode lokal** (`AppContext.tsx:421-443`, `464-483`): baca `virtour360.users`; email duplikat → error; login mencocokkan `found.password !== password` (plaintext); buat session `{name, email, initials}`.

**Pergantian identitas**: `resetWorkspaceIfOwnerChanged(email)` (`AppContext.tsx:177-188`) menyimpan `virtour360.owner = email`; bila pemilik berubah, key `hotspots`, `media`, `favorites`, `effects`, `groups`, `sceneOrder`, `sceneGroups`, `imageQuality` dihapus dan IndexedDB dikosongkan via `clearAllLocalData()` (`src/lib/db.ts:43-57`). Di mode server daftar reset lebih pendek (tidak termasuk groups/order/quality — `AppContext.tsx:455-461`).

---

## 3. Tombol "Masuk" di header, avatar & dropdown

### Public Home — `src/views/PublicHomeView.tsx:121-154`
- Tombol kanan: `user ? navigate("dashboard") : setAuthOpen(true)`. Saat guest menampilkan teks **"Masuk"**; saat login menampilkan avatar inisial (kotak amber) + nama user (`PublicHomeView.tsx:145-149`).
- Tombol **Create** (cyan) dan **Studio** (pink) juga membuka modal auth bila guest, langsung ke Studio bila login (`PublicHomeView.tsx:122-135`).
- Tombol lonceng notifikasi hanya muncul saat login (`PublicHomeView.tsx:136-140`).

### Public Portfolio — `src/views/PublicPortfolioView.tsx:98-112`, `:259`, `:373`
- Header identik: `Studio` → login gate atau studio; tombol kanan menampilkan `userName ?? "Masuk"` dan selalu memanggil `setAuthOpen(true)`.
- `userName = user?.name` (`PublicPortfolioView.tsx:373`). CTA bawah halaman juga membuka auth (`PublicPortfolioView.tsx:537`).
- Profil yang ditampilkan di halaman publik berasal dari payload publish / fallback `profile` statis, bukan dari akun yang login (`PublicPortfolioView.tsx:282-288`, `:336-339`).

### Studio (App shell) — `src/App.tsx:258-312`, `src/components/layout/TopBar.tsx:57-66`
- Avatar kiri atas di `TopBar` menampilkan `initials={user?.initials ?? profile.initials}` (`App.tsx:229`) → **guest mendapat "aw"** (inisial profil demo), bukan "G". Klik membuka dropdown akun (`App.tsx:258-312`): nama + email atau teks "Data tersimpan di browser ini", menu Pengaturan akun (membuka `ProfileModal`), Unggah panorama, Buka Dashboard, Kembali ke Portofolio user, Embed portofolio, Salin link publish (jika ada), Kembali ke Home, dan **Keluar** (user) / **"Masuk / Daftar (opsional)"** (guest).

### Dashboard — `src/views/DashboardView.tsx:184-206`
- Avatar oranye menampilkan `(user?.initials ?? "G")[0]` → **guest mendapat "G"**. Dropdown: label `user?.name ?? "Publik"`, lalu **Keluar** bila login atau **Masuk / Daftar** bila guest. Tidak ada menu "Pengaturan akun" di sini.

---

## 4. Session / token management

### Penyimpanan
- `src/lib/authToken.ts:1-18`: key **`virtour360.token`**, `localStorage.getItem/setItem/removeItem`, dibungkus `try/catch` (gagal → string kosong / diabaikan). Tidak ada cookie, tidak ada `httpOnly`, tidak ada `SameSite`.
- Data user disimpan terpisah di **`virtour360.session`** (`AppContext.tsx:118`, `:225`, `:410`, `:453`). Keduanya di `localStorage` → dapat dibaca JS apa pun di origin yang sama.
- Identitas tamu stabil: **`virtour360.guestId`** berbentuk `g-<timestamp36>-<random7>` (`AppContext.tsx:119`, `:190-198`), dibuat sekali saat mount (`AppContext.tsx:226`).
- Owner marker: `virtour360.owner` (`AppContext.tsx:120`, `:177-188`).

### Token (mode server) — `api/_auth.js:1-45`
- `signSession(user)` (`_auth.js:10-16`): payload JSON `{name, email, initials, exp}` → base64url, ditandatangani HMAC-SHA256 dengan `SUPABASE_SECRET_KEY` (atau `SUPABASE_SERVICE_ROLE_KEY`, **fallback `"virtour360-dev"`** `_auth.js:5-7`), format `<payload>.<sig>`.
- `verifySession(token)` (`_auth.js:18-30`): cek 2 bagian, `crypto.timingSafeEqual`, `data.email` ada dan `exp >= Date.now()`. **Tidak ada token refresh/rotation** — habis masa 30 hari harus login ulang.
- `hashPassword` = `scryptSync(password, salt16byte, 64)` dengan format `salt:hash`; verifikasi juga memakai `timingSafeEqual` (`_auth.js:32-45`).

### Expiry & restore
- Saat mount: `AppContext.tsx:283-298` — jika token ada, GET `/api/auth` dengan Bearer; sukses → `setUser` + tulis ulang `SESSION_KEY`; gagal/expired → `setAuthToken("")` hanya. API mengembalikan 401 `{"error":"Sesi tidak valid"}` (`api/auth.js:24-27`) — diverifikasi di live.
- **Keterbatasan penting**: expired/invalid token **tidak menghapus** `virtour360.session` dan **tidak memanggil** `setUser(null)` di effect restore. State `user` awal tetap dibaca dari `SESSION_KEY` (`AppContext.tsx:225`), sehingga UI bisa tampak login pada reload berikutnya dengan token kosong; penulisan `/api/state` lalu gagal senyap (`.catch(() => undefined)` di `AppContext.tsx:389`). Tidak ada auth guard di level API untuk `/api/public` (lihat §8).

### Logout
- `AppContext.tsx:485-489`: `setAuthToken("")` + `localStorage.removeItem(SESSION_KEY)` + `setUser(null)`. Tidak menghapus `guestId`, `owner`, data workspace, atau IndexedDB. Dipanggil dari dropdown Studio (`App.tsx:298`), Dashboard (`DashboardView.tsx:196`), dengan toast "Anda telah keluar."

---

## 5. LoginRequired — fitur yang diproteksi

Sumber: `src/Root.tsx:28-43`, `src/components/auth/LoginRequired.tsx:7-46`, `src/lib/navigation.ts:1-14`.

- Guard ada **satu titik**, di `Shell`: `isPrivate = view === "studio" || view === "dashboard"`; bila privat dan `!user` → render `<LoginRequired area={...} />` (`Root.tsx:31`, `:41-43`). Tidak ada proteksi per-route di server (Vercel SPA rewrite), jadi ini **guard UI/client-side murni**.
- Tampilan gate: card zinc di atas `bg-zinc-950`, logo `Logo360 tone="pink"`, ikon `Lock` amber, judul **"{Studio|Dashboard} perlu login"**, teks "Halaman ini khusus pemilik portofolio...", tombol **"Masuk sekarang"** → `setAuthOpen(true)`, tombol **"Kembali ke publik"** → `navigate("home")`, footer "Akun Anda tetap tersimpan di perangkat ini." (`LoginRequired.tsx:11-43`).
- **Alur redirect setelah login**: `AuthModal` selalu `navigate("studio")` (`AuthModal.tsx:47`). Jadi ketika gate Dashboard meminta login, user sukses login dibawa ke **Studio**, bukan Dashboard — tidak ada pelestarian route asal. Setelah itu root berubah dan guard terpenuhi.
- Proteksi tambahan (bukan `LoginRequired`): `UploadModal` menolak submit guest, menutup modal, membuka auth, dan toast "Masuk dulu untuk mengunggah panorama 360°." (`UploadModal.tsx:45-52`); banner amber "Login diperlukan untuk mengunggah" (`UploadModal.tsx:96-105`). `PublishModal` hanya bisa dibuka dari Studio/akun, tetapi tidak punya pengecekan user secara eksplisit di komponennya.
- Rute publik: `#/home`, `#/portfolio`, `#/portfolio/<id>`, `#/p/<uid>` — semuanya bisa dibaca tanpa login (`navigation.ts:3-10`, `publicStore.ts:76-80`).

---

## 6. ProfileModal — apa yang bisa dilihat/diubah

Sumber: `src/components/auth/ProfileModal.tsx:7-168`, dipasang di `src/App.tsx:435`, dibuka dari dropdown Studio (`App.tsx:266-268`). `z-[110]`, klik backdrop menutup, klik dalam card di-`stopPropagation` (`ProfileModal.tsx:40-44`).

### Kondisi guest (`ProfileModal.tsx:55-76`)
Menampilkan ikon `User`, teks "Anda sedang melihat sebagai **publik**. Masuk diperlukan untuk menyimpan karya dan mengunggah panorama 360°.", dua tombol: "Lanjut melihat publik" (tutup) dan **"Masuk (opsional)"** (tutup + `setAuthOpen(true)`).

### Kondisi login — dua tab (`ProfileModal.tsx:79-101`)

| Tab | Field | Validasi / aksi | Ref |
| --- | --- | --- | --- |
| **Profil** | Nama (text), Email (`type=email`) | `updateProfile(name, email)`; pesan sukses "Profil berhasil disimpan." + toast "Profil diperbarui." | `ProfileModal.tsx:103-123`, `:22-27` |
| **Password** | Password lama, Password baru, Ulangi password baru | `next !== confirm` → "Konfirmasi password tidak cocok."; `changePassword(current, next)`; sukses → field dikosongkan, "Password berhasil diubah." + toast "Password diperbarui." | `ProfileModal.tsx:124-153`, `:29-37` |

- Pesan error merah dan sukses hijau di `ProfileModal.tsx:156-157`; tombol "Simpan profil" / "Simpan password" di `:159-161`.
- **Yang TIDAK ada**: avatar/foto profil, bio, nomor telepon/kontak, lokasi, link social, username, preferensi notifikasi, hapus akun, export data. Inisial dihitung otomatis dari nama (`AppContext.tsx:151-153`, `api/auth.js:4-6`).
- Subtitle modal **"Perubahan disimpan di browser ini."** (`ProfileModal.tsx:48`) — **menyesatkan di mode server**: `updateProfile`/`changePassword` justru menulis ke DB via `/api/auth` (`AppContext.tsx:494-501`, `:530-533`; `api/auth.js:62-85`).
- `updateProfile` (server): validasi nama ≥ 2, email regex, cek email dipakai akun lain → 409 "Email sudah dipakai akun lain.", update `virtour_users`, terbitkan token baru. **Email adalah primary key**, jadi mengubah email mengubah identitas; `OWNER_KEY` dan key state lama tidak ikut dimigrasi → workspace remote tampak kosong sampai data disalin manual. Mode lokal: validasi serupa di `AppContext.tsx:503-522`.
- `changePassword` (server): validasi password baru ≥ 6, verifikasi password lama via scrypt → 401 "Password lama salah." (`api/auth.js:77-85`). Mode lokal: `AppContext.tsx:535-542` (plaintext).

### Profil "lengkap" yang terlihat publik (bukan akun)
`src/data/profile.ts:3-16` berisi data statis: nama "Ardhana Wicaksono", inisial "aw", role "Creative Developer & 360° Photographer", lokasi "Jakarta, Indonesia", email "hello@ardhana.studio", website, bio, dan stats (48 proyek / 26 klien / 09 penghargaan). Dipakai sebagai fallback di `App.tsx:229`, `App.tsx:416`, `PublicPortfolioView.tsx:22`, `PublishModal.tsx:5,46-53`. Saat publish, hanya `name` dan `initials` yang diambil dari user login; **location/email/website/bio tetap dari profil demo** (`PublishModal.tsx:46-53`).

---

## 7. Kolaborasi / user management

**Tidak ada implementasi kolaborasi sungguhan.** Bukti:

- Tidak ada kolom `role`, `owner_id`, `team_id`, atau tabel `invite`/`membership` di `supabase/schema.sql:4-26`; hanya `virtour_users` dan `virtour_state`.
- `RemoteUser` di `remoteStore.ts:6-11` hanya `{name, email, initials, password}` — tidak ada role; dan itu pun legacy (mode klien menyimpan array users ke dalam JSON state).
- Tidak ada UI invite, share-permission, atau manajemen anggota. `LeftSidebar.tsx:149` hanya menu "Buka Dashboard".
- `PublishModal` punya pilihan **Draft / Public / Password** (`PublishModal.tsx:21-35`, `:91-124`) tetapi itu **pengaturan tampilan UI saja**: nilai `access`/`password` tidak dimasukkan ke payload publish (`PublishModal.tsx:54-60`), dan `/api/public` tidak memeriksa password. Jadi "Draft" dan "Password" **tidak benar-benar membatasi akses**.
- `creators` di payload publik (`publicStore.ts:33-41`, `:49`) adalah daftar kreator demo/seed (di live: 5 entri `creator-1..5` seperti "Alvi Arts", "Atrium Studio", dengan email `alvi@example.com` dll.). `PublishModal` mengirim `creators: []` (`PublishModal.tsx:58`) dan `publishPublicPayload` mewarisi creators lama jika kosong (`publicStore.ts:141`). Tidak ada hubungan antara entri ini dan akun login.
- Satu-satunya "berbagi" adalah link/QR/embed publik (`PublishModal.tsx:34-35`, `:134-169`) yang bisa dikopi siapa pun setelah publish.

---

## 8. Relasi user ↔ tour/project/profile, kepemilikan & RLS

### Model data
- `virtour_users` (`supabase/schema.sql:4-11`): `email text primary key`, `name`, `initials`, `password_hash`, `created_at`. **Tanpa `id` UUID, tanpa `owner_id`, tanpa relasi FK ke project.**
- `virtour_state` (`schema.sql:21-26`): `id text primary key`, `data jsonb`, `updated_at`. Seluruh workspace (hotspot, favorit, media override, efek, grup, urutan scene, kualitas gambar, users) disimpan **dalam satu JSON blob** (`RemoteState` di `remoteStore.ts:20-44`).
- Identitas state (`AppContext.tsx:262-265`): `identityKey = user ? "user:" + email.toLowerCase() : "guest:" + guestId`. Di server, key dihitung ulang oleh `api/state.js:35-41`: kalau session valid → `user:<email>` (mengabaikan query `key` dari client); kalau tidak → `safeId(key)`.
- `safeId` (`api/state.js:6-11`) hanya menerima `[A-Za-z0-9:._-]{1,80}` — **menolak `@`**, sehingga tamu tidak bisa menyamar sebagai `user:<email>` asli lewat query key; key invalid jatuh ke `virtour360-shared`.
- Publish: `publishPublicPayload` (`publicStore.ts:125-150`) menulis ke `/api/public` → `api/public.js:43-55` menyimpan ke `virtour_state` dengan id `virtour:pub:<uid>` (`api/public.js:5-10`). Payload berisi `profile`, `scenes`, `folders`, `creators`, `uid`, `updatedAt` (`publicStore.ts:43-53`). `README.md:86-87` menyebut fallback state lama `virtour:public`.
- Project = `folder` hasil grup scene berdasarkan `scene.project.title`/`group` (`publicStore.ts:82-105`). Tidak ada tabel `projects` terpisah dan tidak ada FK kepemilikan.

### Barisifikasi di schema (`supabase/schema.sql`)
| Objek | Policy | Efek |
| --- | --- | --- |
| `virtour_users` | RLS aktif + policy `"virtour360 users service"` `for all using(true) with check(true)` (`:13-19`) | Siapa pun dengan anon key bisa SELECT/INSERT/UPDATE akun termasuk hash password. Service-role tetap bypass RLS. |
| `virtour_state` | RLS aktif + `"virtour360 anon all"` `for all using(true) with check(true)` (`:28-37`) | Semua baris state (termasuk `user:*`) bisa dibaca/ditulis oleh anon di mode klien. Komentar kode sendiri: "Untuk produksi, ganti policy ini dengan auth.uid()" (`:30-31`). |
| `storage.objects` bucket `panoramas` (public) | policy read + write `using(bucket_id='panoramas')` (`:39-53`) | Upload/hapus file panorama terbuka untuk anon. |

---

## 9. Perilaku guest vs authenticated user di halaman publik

| Kemampuan | Guest | Login |
| --- | --- | --- |
| Lihat Home, Portofolio, viewer 360°, link `#/p/<uid>` | Ya (`Root.tsx:41-55`) | Ya |
| Favorit (`toggleFavorite`, `AppContext.tsx:779-785`) | Ya, tersimpan di state `guest:<id>` | Ya, tersimpan di state `user:<email>` |
| Buka Studio / Dashboard | `LoginRequired` | Ya |
| Upload panorama (`UploadModal.tsx:45-52`) | Ditolak → modal auth | Ya |
| Publish & bagikan link/QR/embed | Tidak bisa membuka Studio | Ya (`App.tsx:437-448`) |
| Header kanan | "Masuk" | Avatar inisial + nama |
| Akun disimpan | Tidak ada akun; `guestId` lokal | `virtour_users` + token |
| Sinkron lintas device | Tidak (key guest acak per browser) | Ya, `user:<email>` (`README.md:84-85`) |

Data guest dan user **berbeda key**, sehingga saat login workspace guest tidak otomatis diwariskan; `resetWorkspaceIfOwnerChanged` justru membersihkan data lokal bila owner berubah (`AppContext.tsx:177-188`). Catatan README `:138-139` menyebut identitas publik `public:<id>`, tetapi implementasi aktual memakai prefix `guest:` (`AppContext.tsx:265`) — dokumentasi dan kode tidak sinkron.

---

## 10. Verifikasi terhadap deploy live

Karena browser desktop tidak terhubung ke sesi ini (`[browser.disconnected]`), verifikasi dilakukan lewat HTTP terhadap origin live (tanpa membuat akun, tanpa mengirim data tulis):

1. `GET /` → HTML SPA berisi `<title>Virtour360 — Studio Virtual Tour</title>`, bundle `/assets/index-B1Wh7yo8.js`.
2. Bundle live (1.109.739 char) mengandung **persis** string sumber: "Masuk ke Virtour360", "Buat akun baru", "Masuk / Daftar (opsional)", "Akun Anda tetap tersimpan", "Pengaturan akun", "Password lama", "Selamat datang kembali", "Login diperlukan untuk mengunggah", `virtour360.token`, `virtour360.users`, `virtour360.session`, `/api/auth`. → UI yang terdeploy sesuai source.
3. Bundle memuat efek restore `Qt()&&fetch('/api/auth', ...)` (tanpa syarat `isServerMode` pada hasil minifikasi) dan **tidak** memuat `virtour360-shared` → menandakan **`VITE_USE_SERVER_DB=1` (mode server)** aktif di produksi.
4. `GET /api/auth` tanpa token → **401** `{"error":"Sesi tidak valid"}` (sesuai `api/auth.js:24-27`).
5. `GET /api/public?id=1x2m270p3j` → **200**, payload dengan `profile` (nama "awe", email `hello@ardhana.studio`, website, bio, lokasi), `scenes` (3), `folders` (3), `creators` (5 demo), `uid`, `updatedAt` 2026-11-22T13:46:19Z → halaman publik benar-benar bisa dibaca tanpa login.
6. `GET /api/state?key=user%3Anobody%40example.invalid` → 200 `{"id":"virtour360-shared","data":null}` (karakter `@` ditolak `safeId`, jatuh ke default); `GET /api/state?key=guest%3atest-documentation-probe` → 200 dengan id key tersebut → endpoint state dapat diakses tanpa token dengan key tamu.

Catatan: interaksi klik modal login tidak dapat dilakukan karena browser tidak tersedia; perilaku modal dideskripsikan dari source + string bundle yang terverifikasi.

---

## 11. Catatan keamanan & keterbatasan (prioritas)

1. **Kritis — RLS permisif**: `using(true)/with_check(true)` pada `virtour_users` dan `virtour_state` (`schema.sql:13-19`, `:28-37`). Di mode klien, anon key dapat membaca/menimpa data akun (termasuk `password_hash`) dan state user lain. Mode server mengurangi eksposur karena secret tidak ke browser, tetapi policy tetap salah untuk produksi. Rekomendasi: policy berbasis `auth.uid()` atau hilangkan akses anon ke `virtour_users`, gunakan service-role hanya di server.
2. **Kritis — PUBLIC POST tanpa otorisasi**: `api/public.js:43-55` menerima POST `{uid, payload}` tanpa verifikasi session/token → siapa pun bisa menimpa project publish milik orang lain jika tahu UID. `publishPublicPayload` juga tidak mengirim Authorization (`publicStore.ts:133-144`).
3. **Token di `localStorage`** (`authToken.ts:1-18`) rentan XSS; bukan `httpOnly` cookie. Tidak ada refresh rotation; expired 30 hari (`_auth.js:3`).
4. **Session expiry inkonsisten**: UI tidak logout otomatis saat token expired/401 (§4). User "/login" secara lokal tetapi semua tulisan remote gagal senyap.
5. **Rahasia fallback lemah**: `secret()` jatuh ke `"virtour360-dev"` bila env tidak ada (`_auth.js:5-7`) → token bisa dipalsukan pada deploy yang salah konfigurasi.
6. **Mode lokal menyimpan password plaintext** di `virtour360.users` (`AppContext.tsx:426-427`, `:464-466`) — jangan dipakai untuk akun sungguhan.
7. **Tidak ada rate limiting, lockout, email verification, password reset, logout-server/blacklist, audit log, atau CSRF token** (API memakai Bearer, bukan cookie, jadi CSRF klasik tidak relevan).
8. **Publish "Draft"/"Password" palsu**: opsi access tidak memengaruhi payload maupun endpoint publik (§7). Jangan menganggap link "draft" bersifat privat.
9. **Profil publik bukan profil akun**: bio/email/website/lokasi berasal dari data demo statis (`profile.ts`), sehingga pengguna tidak bisa mengubah "profil publik" yang tampil di portofolio.
10. **Perubahan email = perubahan identitas** tanpa migrasi `owner`/state key; potensi kehilangan akses ke workspace lama (§6).
11. **Teks UI menyesatkan**: "Perubahan disimpan di browser ini." padahal server mode menyimpan ke DB; README menyebut prefix `public:<id>` padahal kode memakai `guest:<id>`.
12. **Tidak ada upload avatar, social, bio, kontak, peran, tim, atau invite** — bila produk menuntut fitur tersebut, semuanya harus dibangun dari nol (tabel baru + RLS + UI).

---

## Lampiran — peta file/baris utama

| File | Baris | Isi |
| --- | --- | --- |
| `src/components/auth/AuthModal.tsx` | 6-152 | Modal login/register, validasi, switch tab, redirect studio |
| `src/components/auth/LoginRequired.tsx` | 7-46 | Gate Studio/Dashboard |
| `src/components/auth/ProfileModal.tsx` | 7-168 | Profil + ganti password, kondisi guest |
| `src/components/auth/UploadModal.tsx` | 45-52, 96-105 | Guard upload untuk guest |
| `src/components/auth/PublishModal.tsx` | 21-35, 44-67, 91-169 | Publish, opsi akses (UI-only), link/QR/embed |
| `src/context/AppContext.tsx` | 35-43, 117-128, 155-198, 224-265, 283-298, 321-392, 403-545 | User type, keys, auth request, owner reset, guest id, restore, sync, login/register/logout/profile |
| `src/lib/authToken.ts` | 1-18 | localStorage token |
| `src/lib/supabase.ts` | 3-35 | Env, penolakan secret, mode |
| `src/lib/remoteStore.ts` | 6-44, 46-105 | RemoteState & baca/tulis state, Storage panorama |
| `src/lib/db.ts` | 21-24, 43-57, 59-127 | IndexedDB panorama/aset + clearAllLocalData |
| `src/lib/publicStore.ts` | 4-53, 64-105, 107-150 | Payload publik, UID, folder, publish |
| `src/lib/navigation.ts` | 1-29 | Router hash, creator link |
| `src/Root.tsx` | 28-65 | Auth guard + mount modal global |
| `src/App.tsx` | 229-230, 258-312, 435-448 | Dropdown akun Studio, avatar, ProfileModal, publish |
| `src/views/DashboardView.tsx` | 184-206 | Avatar/dropdown Dashboard |
| `src/views/PublicHomeView.tsx` | 121-154 | Header "Masuk", avatar login |
| `src/views/PublicPortfolioView.tsx` | 98-112, 259-288, 336-373, 537 | Header publik, profil tampilan |
| `src/data/profile.ts` | 3-16 | Profil demo statis |
| `supabase/schema.sql` | 4-56 | Tabel users/state, RLS, bucket storage |
| `api/auth.js` | 8-88 | Register/login/profile/password endpoint |
| `api/_auth.js` | 3-45 | HMAC session & scrypt hash |
| `api/state.js` | 4-66 | State per identitas, safeId |
| `api/public.js` | 3-58 | Endpoint baca/tulis project publik |
| `.env.example`, `README.md` | env 1-21; README 63-139 | Konfigurasi mode & catatan publik |
