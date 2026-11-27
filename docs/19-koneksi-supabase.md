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
5. **Keamanan akun** — mode klien tetap memakai akun localStorage. `users` yang disimpan ke remote sengaja dikosongkan supaya password plaintext tidak terkirim.

## SQL yang perlu dijalankan sekali

Buka Supabase Dashboard → SQL Editor → New query → paste → Run:

```sql
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

## Catatan produksi

Policy di `supabase/schema.sql` menggunakan `using (true)` agar demo 2–5 orang bisa langsung jalan. Sebelum dipakai publik, ganti policy `virtour_state` dan `storage.objects` dengan pemeriksaan identitas/token. Jangan menyimpan service-role key di browser, dan jangan meng-commit `.env`.
