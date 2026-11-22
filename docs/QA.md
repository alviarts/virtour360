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
- Drag realtime: ghost marker `.hs-drag-ghost` dibuat saat `pointerdown`, posisinya
  di-update via `requestAnimationFrame` + `translate3d` (GPU), tanpa menunggu React.
  Uji produksi: ghost muncul (1 elemen) dan `style.transform` berubah saat pointermove;
  elemen hilang saat `pointerup`, lalu posisi hotspot tersimpan.
- HUD penempatan: reticle + label `yaw/pitch` mengikuti cursor via rAF.
  Uji produksi: label berubah `yaw 0°/pitch 0°` → `yaw 9°/pitch 11°`, transform mengikuti pointer.
- Penempatan titik penuh 360°: klik di luar bola tetap menaruh hotspot lewat fallback
  offset kamera; uji produksi hotspot bertambah setelah klik.
- Animasi kartu hanya berjalan saat hover/fokus (tidak muter sendiri).
- Contoh tur 360° punya **penanda pintu** (label "Pintu → …", ikon tautan, warna biru)
  di posisi pintu tiap panorama + panah navigasi native PSV; klik pintu memindah ke
  scene berikutnya dengan tampilan pintu/ruang tujuan.
- Baris hotspot bertipe **scene** di tabel panel kanan sekarang langsung memindahkan
  ke `targetSceneId` (ditandai ikon panah biru), bukan hanya memilih marker.

## 4. Catatan
- PasswordDB & secret key tidak disimpan di source; hanya env var Vercel / environment variable lokal.
- Mode server aktif di production; mode lokal (tanpa env) tetap berfungsi penuh.
- Domain produksi: **https://virtour360real.vercel.app**

## 3d. Audit navigasi hotspot/pintu antar-scene (2026-11-23)

### Root cause
1. **Studio** — handler drag memanggil `event.preventDefault()` + `stopPropagation()` pada
   `pointerdown` setiap kali marker ditekan. Browser karena itu tidak mengirim
   `mousedown` kompatibel; PSV tidak pernah membentuk `ClickEvent`, sehingga event
   `select-marker` (satu-satunya jalur navigasi marker) tidak pernah terpicu.
2. **Contoh tur** — `buildExampleScenes()` menaruh **dua hotspot di yaw/pitch identik**:
   `door-*` (marker `type:"info"` + `targetSceneId`) dan `door-link-*` (panah `type:"scene"`).
   Marker menimpa panah; MarkersPlugin memanggil `stopImmediatePropagation()` pada
   `ClickEvent`, jadi handler panah VirtualTour juga terblokir → klik "Pintu → …" tidak ada efek.
3. **Viewer publik** — navigasi hanya Mengandalkan `data.targetSceneId` pada marker yang
   bisa basi, dan tidak ada dedupe antara `select-marker` dan fallback DOM `click`.

### Perbaikan
- `src/hooks/useTourViewer.ts`: `activateHotspot()` baru (navigasi → tautan → detail, dengan
  dedupe 400 ms) dipakai bersama oleh `select-marker` **dan** fallback `pointerup` pada marker.
- Drag sekarang punya threshold 5 px: klik biasa tidak menggeser marker, tetap mengaktifkan
  hotspot; `pointercancel` tidak mengaktifkan apa pun; mode penempatan tidak terpengaruh.
- `src/lib/sceneGraph.ts`: `navigationTarget()` + `isNodeLink()` jadi satu aturan bersama.
  Panah hanya untuk `type === "scene"`, marker untuk tipe lainnya.
- `src/components/viewer/PublicViewerModal.tsx`: pakai `sceneLinks()`/`contentHotspots()`/
  `navigationTarget()`, `positionMode: "manual"` eksplisit, resolusi hotspot dari scene aktif,
  dedupe aktivasi, teks bantuan diperbarui.
- `src/data/examples.ts`: hotspot `door-link-*` dihapus — penanda pintu biru bermuatan
  `targetSceneId` kini menjadi satu-satunya affordance di posisi pintu.
- `src/components/layout/RightPanel.tsx`: field "Scene tujuan", tombol "Set ke layer
  berikutnya", tombol "Kunjungi scene", dan tombol navigate di daftar hotspot kini tersedia
  untuk **semua** tipe hotspot yang punya `targetSceneId` (baris daftar tetap bisa dipilih untuk diedit).

### Verifikasi
- `npm run build` → **PASS** (tsc -b + vite build, 2254 modul, 0 error).
- Browser tool: **TIDAK terhubung** (`[browser.disconnected]`) — tidak ada uji klik E2E
  dari sesi ini; tidak di-retry sesuai instruksi.

### Checklist manual untuk reviewer (belum dijalankan di sesi ini)
1. Studio → contoh "Atrium" → klik penanda biru "Pintu → Studio" → judul/counter scene berubah ke 2/3.
2. Studio → klik hotspot info biasa → panel detail terbuka (tidak berpindah scene).
3. Studio → drag penanda pintu → posisi yaw/pitch tersimpan; klik setelah drag tetap pindah scene.
4. Studio → picker "Chevron" (`type:"scene"`) → panah PSV diklik → scene berubah.
5. Public view → klik penanda pintu → counter `1 / 3` → `2 / 3`; tombol prev/next tetap jalan.
6. Mode penempatan (+ Hotspot) → klik di panorama → hotspot baru tetap dibuat.
