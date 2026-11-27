# 22 — Pengamanan endpoint publish & state

Audit lanjutan menemukan beberapa celah di jalur server (`supabase === null` di browser produksi). Semua sudah diperbaiki.

## Temuan & perbaikan

| Celah | Sebelum | Sesudah |
|---|---|---|
| `POST/DELETE /api/public` tanpa auth | Siapa pun bisa menimpa/hapus `virtour:pub:<uid>` | `Authorization: Bearer <token>` wajib; ownership `owner` dicek saat hapus/timpa |
| `GET/POST /api/state?key=...` bebas | Tamu bisa membaca/menimpa `virtour:pub:*` dan state privat | Tamu hanya boleh `guest:<id>`; kunci lain → `403` |
| Hash password dikirim ke pengunjung | `passwordHash` (djb2) ada di payload publik | Dihapus dari payload; gate diverifikasi di server |
| Gate password UI-only | Cuma perbandingan hash di browser | `POST /api/public { action: "unlock" }` → cookie httpOnly `virtour360_gate_<uid>` (HMAC, 30 hari) |
| Fallback secret HMAC | `virtour360-dev` | Env server wajib; token session & gate memakai domain terpisah |
| Scene/thumbnail/audio malformed | `.startsWith()` bisa throw saat render | Dinormalisasi di server; tipe bukan string dibuang |

Kompatibilitas lama: tour berpassword yang sudah terpublish memakai hash djb2 lama. Saat first unlock, server memverifikasi hash lama lalu menyimpan ulang sebagai scrypt (`salt:hash`) di `virtour_state` dengan id `virtour:gate:<uid>`. Hash lama tidak pernah dikirim kembali ke browser.

## Verifikasi

- `npm run typecheck` ✅
- `npm test` ✅ **54/54** (tambah `tests/auth-gate.test.ts` + test gate server di `component-studio.test.tsx`)
- `npm run build` ✅
- `GET /api/public?id=...` masih mengembalikan payload publik tanpa token.
- `POST /api/public` tanpa token → `401`.

## Catatan

Kebijakan RLS di `supabase/schema.sql` masih `using (true)` untuk mode demo/klien (`VITE_USE_SERVER_DB=0`). Produksi memakai mode server dan tidak memakai klien Supabase browser, tetapi sebelum dipakai publik luas, RLS harus dibatasi dan tabel `virtour_state` perlu ditambahkan ke publikasi Realtime.
