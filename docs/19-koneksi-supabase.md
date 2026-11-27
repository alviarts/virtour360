# Koneksi Supabase Virtour360

## Kredensial yang dipakai

Proyek Supabase: `https://zhkswftjzddnmlqdiupp.supabase.co`.

| Kredensial | Dipakai di | Catatan |
|---|---|---|
| `sb_publishable_...` | Browser (`VITE_SUPABASE_ANON_KEY`) | Aman untuk client; tidak bisa membuat schema/bucket |
| `SUPABASE_URL` | Vercel Function (opsional) | Hanya bila `VITE_USE_SERVER_DB=1` |
| `SUPABASE_SECRET_KEY` | Vercel Function (opsional) | Belum diisi; jangan pernah pakai prefix `VITE_` |
| `host`, `port`, `database`, `user=postgres` | Koneksi DB langsung | Tidak dipakai aplikasi; butuh password yang tidak diberikan |

`.env` lokal berisi URL + publishable key dan masuk `.gitignore`, jadi tidak ikut ke GitHub. Untuk deploy, isi dua variabel `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di dashboard hosting, lalu build ulang.

## Yang sudah aktif

1. **State bersama** — `virtour_state` dipakai untuk hotspot, grup, media, efek, dan konfigurasi Studio per identitas (`user:<email>` atau `guest:<id>`).
2. **Publish per project** — `publishPublicPayload()` menulis `virtour:pub:<uid>` ke `virtour_state` sekaligus menyimpan salinan lokal. Format mengikuti `api/public.js`, jadi link `#/p/<uid>` kompatibel dengan mode server/v1.
3. **Customers feed** — `listPublishedPayloads()` menggabungkan baris Supabase dan publish lokal, menghilangkan duplikat. Badge kartu menunjukkan sumbernya.
4. **Update otomatis** — `watchPublishedChanges()` mendengarkan custom event publish, `storage` event lintas tab, `postgres_changes` Supabase, dan polling 2,5 detik sebagai fallback.
5. **Akun di Supabase** — email, nama, dan `password_hash` scrypt ada di tabel `virtour_users` (format sama dengan `api/_auth.js`). Tidak ada password plaintext di browser maupun di `virtour_state`. `users` pada state remote sengaja dikosongkan.
6. **Sesi tervalidasi** — `virtour360.session` hanya cermin lokal; saat mount `remoteValidateSession()` memastikan akun masih ada di tabel Supabase. Akun lokal lama otomatis dimigrasikan sekali saat login pertama.

## Kenapa bukan Supabase Auth (GoTrue)?

Project ini memiliki email confirmation aktif (`mailer_autoconfirm: false`) dan limit signup GoTrue, sehingga pendaftaran lewat `/auth/v1/signup` berhenti di "Cek email" atau `429 email rate limit exceeded`. Agar alur akun langsung bisa dipakai tanpa inbox, semua akun disimpan di tabel `virtour_users` yang sudah ada, dengan hash scrypt yang kompatibel dengan mode server. Konsekuensinya: tidak ada reset password/magic link/OAuth, dan RLS harus dibatasi sebelum produksi.

## SQL yang perlu dijalankan sekali

Buka Supabase Dashboard → SQL Editor → New query → paste → Run:

```sql
-- Kolom uid opsional (tabel lama belum memilikinya).
-- Tanpa ini aplikasi memakai UID turunan SHA-256 dari email.
alter table public.virtour_users add column if not exists uid text;

-- Bucket panorama publik
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

-- Realtime untuk tabel state
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

Status saat QA: bucket `panoramas` belum ada (API mengembalikan `NoSuchBucket`), dan events realtime belum teramati dalam 1,8 detik sehingga polling fallback yang terpakai. Setelah query dijalankan, upload panorama akan memakai public URL dan perubahan feed langsung masuk via websocket.

## QA yang sudah dilakukan

- REST `GET /rest/v1/virtour_state` dan `GET /rest/v1/virtour_users` → 200 memakai publishable key.
- `supabase-js createClient(url, publishableKey)` berhasil mengambil baris `virtour:pub:%`.
- Halaman `#/customers` menampilkan 4 tour Supabase + 2 lokal, badge sumber benar, 0 error console.
- Publish uji dari browser (`qa-browser-write-zzz9`) berhasil (`ok: true`), muncul di feed, lalu baris dan localStorage uji dihapus.
- Sisipan baris uji lewat REST menaikkan hitungan feed 6 → 7; penghapusan mengembalikan ke 6.
- State remote `user:awe@gmail.com` memiliki `users: []` — tidak ada password plaintext.
- Rute `#/p/kamar-kos` dan `#/p/1x2m270p3j` dari data Supabase tetap bisa dibuka.
- Auth: registrasi `qa-supabase@example.com` lewat UI membuat baris `virtour_users` dengan hash scrypt, tanpa plaintext; verifikasi REST `plain: false`.
- Login akun lama `awe@gmail.com` berhasil diverifikasi terhadap hash yang sudah ada di Supabase (bukan migrasi lokal), logout → login ulang stabil, `virtour360.users` tidak pernah ditulis.
- Profil diubah lewat UI → nama di Supabase berubah menjadi `QA Supabase Pro`; ganti password → hash berubah dari `2a1ba936…` ke `1685df44…`; password lama ditolak, password baru diterima. Akun uji lalu dihapus (`DELETE 204`).
- `ProfileModal` kini menampilkan "Akun, email, dan password tersimpan di Supabase." di mode remote.
- Sweep 10 rute setelah perubahan auth: 0 error console, 0 gambar rusak, 0 overflow.

## Catatan produksi

Policy di `supabase/schema.sql` menggunakan `using (true)` agar demo 2–5 orang bisa langsung jalan. Sebelum dipakai publik, ganti policy `virtour_state`, `virtour_users`, dan `storage.objects` dengan pemeriksaan identitas/token, dan pindahkan hashing/verifikasi password ke server jika RLS anon tidak boleh membaca hash. Jangan menyimpan service-role key di browser, dan jangan meng-commit `.env`.
