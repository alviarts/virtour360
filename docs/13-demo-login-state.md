# Mode Demo, Login Full-Page, dan State Terakhir

## Mode demo per sesi browser
- Flag `virtour360.demo` disimpan di **sessionStorage** → hanya tab/sesi ini, tidak mengikuti akun atau sesi lain.
- Dipicu dari tombol **"Buka demo studio"** di hero, atau **"Coba demo studio"** di halaman login.
- Guard login dilewati (`Root.tsx`: `isPrivate = (studio || dashboard) && !demoMode`).
- Studio memakai scene contoh (Atrium, Studio, Terrace, Ballroom) walaupun user sedang login.
- Header menampilkan `DE · SESI BROWSER INI · Demo Studio`, **tanpa nama/email akun**.
- Popover akun diganti panel demo: "Tidak terhubung ke akun apa pun" + **Keluar demo**.
- **Keluar demo** menghapus flag dan kembali ke `#/home`.

## Login / Sign up full-page
- Rute: `#/login` dan `#/signup`, dirender `LoginView` (bukan modal).
- Visual mengikuti `linear.app/login`: bg `#09090a`, kartu 288px, judul 18px/500, tombol pill 44px (`Continue with email` ungu `#5e69d2`, `Log in with passkey` abu `#1b1b1c`), footer "Belum punya akun? Sign up atau pelajari lebih lanjut".
- Tombol Home: **Log in → `#/login`**, **Sign up / Start free → `#/signup`**. Jika sudah login, langsung ke Dashboard.
- Form email/password memanggil `login()` / `register()` dari AppContext, lalu ke Dashboard.
- AuthModal lama masih ada untuk alur internal, tetapi tidak dipakai dari Home.

## State penyimpanan
| Data | Tempat |
|---|---|
| Sesi login | `localStorage virtour360.session` |
| Akun & hash password | Supabase `virtour_users` (server) / localStorage (lokal) |
| Project & kategori | `localStorage virtour360.projects` |
| Grup, hotspot, efek | `localStorage virtour360.*` + Supabase `virtour_state` |
| Publish | `localStorage virtour360.published:<uid>` (lokal) / tabel state (server) |
| Demo | `sessionStorage virtour360.demo` |

## Catatan penting
- Semua perubahan terakhir **belum di-commit / di-push** (permintaan user: jalankan lokal dulu).
- Commit terakhir di `main`: `41b47cd`. Working tree berisi perubahan visual demo/login/landing.
- Supabase perlu kolom `uid` pada `virtour_users` (lihat `supabase/schema.sql`) jika mode server dipakai.
