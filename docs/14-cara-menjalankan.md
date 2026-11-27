# Cara Menjalankan & Verifikasi

## Jalankan lokal
```bash
cd C:\Users\visual works\Documents\rea\virtour360
npm install
npm run dev -- --port 5173
```
Buka `http://localhost:5173`.

Dev server memiliki proxy `/api` ke `https://virtour360real.vercel.app`, sehingga tour yang dipublish di produksi bisa dibuka juga dari localhost (mis. `#/p/4i105b1c2t`).

## Rute
| Rute | Fungsi |
|---|---|
| `#/home` | Landing + demo studio |
| `#/portfolio` | Portofolio kreator |
| `#/p/:uid` | Tour publik (viewer 360° penuh) |
| `#/dashboard` | Project gateway (butuh login, kecuali demo) |
| `#/studio` | Editor (butuh login, kecuali demo) |
| `#/login`, `#/signup` | Login/Sign up full-page |

## Perintah
```bash
npm run typecheck   # TypeScript
npm test            # Vitest — 46 test
npm run build       # produksi ke dist/
npm run preview     # serve dist/
```

## Testing
46 automated test: unit (publicStore, sceneGraph, effects, config), component (HotspotPopup, MiniMap, BottomToolbar, DesignModal, PublishModal, PublicPortfolioView gate), equivalence (slug, koordinat derajat, config). Happy path diverifikasi manual di browser.

## Deploy
`vercel.json`: framework `vite`, build `npm run build`, output `dist`, SPA rewrite, cache `/media`. Auto-deploy dari GitHub `alviarts/virtour360` (status commit bisa dicek dengan `gh api repos/alviarts/virtour360/commits/<sha>/status`).

Perubahan terbaru di-commit dan di-push ke `origin/main` sesuai permintaan. Kredensial Supabase lokal ada di `.env` (di-`gitignore`, tidak ikut ter-commit).

## Lokasi file kunci
- Landing: `src/views/PublicHomeView.tsx`
- Studio: `src/App.tsx`, `src/components/layout/*`, `src/components/viewer/*`
- Visual: `src/styles/theme.css`, `src/components/ui/{TourStage,FeatureVisual,SlackBox,AgentCard,Reveal,Logo360}.tsx`
- Login: `src/views/LoginView.tsx`
- Demo/state: `src/context/AppContext.tsx`, `src/Root.tsx`, `src/lib/navigation.ts`
- Dokumentasi ini: `docs/`

## Supabase (terhubung)

`.env` lokal berisi:

```
VITE_USE_SERVER_DB=0
VITE_SUPABASE_URL=https://zhkswftjzddnmlqdiupp.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_********************
```

Yang dipakai browser adalah **publishable key** (`sb_publishable_...`), bukan secret/service-role. Kredensial `host=db....`, `port=5432`, `database=postgres`, `user=postgres` hanya untuk koneksi database langsung dan **tidak dipakai** aplikasi. Jangan memasukkan `sb_secret_`/service-role ke variabel `VITE_*`.

Status yang sudah diverifikasi:
- Tabel `public.virtour_users` dan `public.virtour_state` ada dan bisa dibaca/tulis memakai publishable key.
- Publish project disimpan sebagai baris `virtour:pub:<uid>` di `virtour_state` (format sama dengan `api/public.js`), sehingga `#/p/<uid>` dan feed Customers bisa dibuka dari perangkat lain.
- Customers menampilkan badge **Supabase** untuk data remote dan **Lokal** untuk publish di browser ini.
- Akun lokal tidak dikirim ke Supabase: `users` pada state remote selalu kosong di mode klien, jadi password plaintext tidak pernah naik ke cloud.

Langkah yang **masih perlu dijalankan sekali** di Supabase Dashboard → SQL Editor (karena publishable key tidak boleh membuat schema):

```sql
-- 1. Bucket untuk panorama 360° (saat ini belum ada)
insert into storage.buckets (id, name, public)
values ('panoramas', 'panoramas', true)
on conflict (id) do nothing;

drop policy if exists "virtour360 panoramas read" on storage.objects;
create policy "virtour360 panoramas read"
  on storage.objects for select using (bucket_id = 'panoramas');

drop policy if exists "virtour360 panoramas write" on storage.objects;
create policy "virtour360 panoramas write"
  on storage.objects for all
  using (bucket_id = 'panoramas') with check (bucket_id = 'panoramas');

-- 2. Aktifkan Realtime untuk feed Customers (jika belum)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'virtour_state'
  ) then
    alter publication supabase_realtime add table public.virtour_state;
  end if;
end $$;
```

Tanpa langkah 1, panorama baru tetap tersimpan di browser dan Publish menampilkan peringatan — tour hanya bisa dibuka di perangkat itu. Tanpa langkah 2, feed tetap diperbarui lewat polling 2,5 detik.

⚠️ Skema bawaan memakai policy anon `using (true)` untuk demo 2–5 orang. Untuk produksi, ganti policy tersebut dengan pembatasan akses (auth/token) sebelum dipakai publik. Lihat `docs/19-koneksi-supabase.md`.
