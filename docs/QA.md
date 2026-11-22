# QA/QC Report — Virtour360

Tanggal: 2026-11-22
Target: `https://virtour360real.vercel.app`

## 1. Frontend

| Route / alur | Hasil |
|---|---|
| `#/` Home (hero 360 bergerak, typing, 5 kreator dari DB) | PASS |
| `#/portfolio` portofolio pemilik | PASS |
| `#/portfolio/<id>` portofolio kreator | PASS |
| `#/studio` tanpa login → halaman "Studio perlu login" | PASS |
| `#/dashboard` tanpa login → halaman "Dashboard perlu login" | PASS |
| Login dengan user seed `alvi@example.com` / `demo1234` → Studio | PASS |
| Tombol Published → `#/portfolio` + data tersimpan | PASS |
| Viewer publik multi-scene (1/3 → 2/3) | PASS |
| `document.scrollWidth <= innerWidth` di semua route | PASS |
| Console error (tab fresh) | 0 |

Build: `npm run build` sukses (2222 modul).

## 2. Backend (Vercel Functions + Supabase)

| Endpoint / alur | Hasil |
|---|---|
| `GET /api/public` → payload berisi 5 kreator + 3 scene publish | PASS |
| `POST /api/auth` register user baru | PASS |
| `POST /api/auth` login user seed | PASS |
| `POST /api/auth` password salah → 401 "Password salah." | PASS |
| `GET /api/state` dengan token → `user:<email>` (isolasi per user) | PASS |
| `POST /api/state` + `GET` ulang → hotspot tersimpan | PASS |
| Env var production (`VITE_USE_SERVER_DB`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`) | Terpasang |
| `node --check api/*.js` | PASS |

## 3. Bug yang ditemukan & diperbaiki saat QA
1. **`/api/public` mengembalikan `payload: null`** — ID state tidak cocok:
   API memakai `virtour360:public`, seed menyimpan `virtour:public`. Disamakan.
2. **Publish menghapus daftar kreator** — payload baru tidak membawa `creators`.
   `publishPublicPayload()` sekarang menggabungkan kreator dari payload lama.
3. **Data kreator di DB tertimpa bentuk lama** — `scripts/restore-creators.mjs`
   ditambahkan untuk memulihkan/menyesuaikan bentuk `{ payload, creators }`.

## 3b. QA tambahan (fitur hasil reverse-engineering Panoee), 2026-11-22
| Fitur | Hasil di produksi |
|---|---|
| Buat grup baru "Apartemen" | PASS (localStorage + backend `user:<email>`) |
| Tombol sort scene ↑/↓ | PASS (6 tombol pada 3 scene) |
| Select pindah grup per scene | PASS (3 select) |
| Kualitas gambar Standard/High/Original | PASS (tersimpan `"original"` & tersinkron) |
| Embed portofolio (kode iframe + copy) | PASS |
| Reload → grup & kualitas bertahan | PASS |
| Console error | 0 |

Detail stack & teknik ada di `docs/RESEARCH.md`.

## 3c. Verifikasi penempatan hotspot sesuai kursor (2026-11-22)
- Masuk mode penempatan via tombol **+ Hotspot**, klik di viewer pada `y = 15%` dari atas.
- Hotspot baru tercatat `yaw 50°, pitch +24°` (sebelumnya fallback tengah `pitch -8°`).
- Kursor berubah menjadi crosshair saat mode penempatan aktif.
- Kesimpulan: hotspot mengikuti posisi klik, bukan acak di bawah.
- Picker 9 jenis Panoee menghasilkan hotspot dengan ikon sesuai jenis.
- Marker hotspot bisa **di-geser (drag)** dengan mouse: `data-hs-id` pada marker,
  konversi `viewerCoordsToSphericalCoords` → yaw/pitch baru, disimpan via `onMoveHotspot`.
  Uji produksi: `hs-process` yaw −40°/pitch −6° → yaw 126°/pitch 48° setelah di-drag.

## 4. Catatan
- PasswordDB & secret key tidak disimpan di source; hanya env var Vercel / environment variable lokal.
- Mode server aktif di production; mode lokal (tanpa env) tetap berfungsi penuh.
- Domain produksi: **https://virtour360real.vercel.app**
