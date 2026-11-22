# QA Lengkap — Happy Path, Component, Equivalence

Tanggal: 2026-11-23 · Runner: Vitest 5 + jsdom + Testing Library · Browser: Chromium (in-app, localhost:5173)

## Ringkasan

| Lapisan | Jumlah | Hasil |
|---|---|---|
| Unit (`tests/unit.test.ts`) | 16 | ✅ pass |
| Component (`tests/component.test.tsx`, `component-studio.test.tsx`) | 22 | ✅ pass |
| Equivalence (`tests/equivalence.test.ts`) | 8 | ✅ pass |
| **Total automated** | **46** | **✅ 46/46** |
| Happy path E2E (browser) | 4 skenario | ✅ pass |
| Console error | — | ✅ 0 |

Jalankan: `npm test` · `npm run typecheck` · `npm run build`

## 1. Happy path testing (browser, nyata)

| # | Skenario | Langkah | Hasil |
|---|---|---|---|
| 1 | Home | Buka `#/home` → header, hero, grid kreator tampil | ✅ |
| 2 | Portofolio publik | Buka `#/p/1x2m270p3j` → 3 folder, search, SEO title aktif | ✅ |
| 3 | Studio | Buka `#/studio` → tombol Design ada, HUD autorotate `0 0 70` (diam) | ✅ |
| 4 | Publish | Publish slug `tour-uji` → tersimpan, halaman publik terbuka | ✅ |
| 5 | Password gate | Publish `tour-uji2` + password → gate tampil, salah ditolak, benar membuka | ✅ |
| 6 | Hotspot | Place hotspot di 20% tinggi → marker render di ≈162px (sesuai kursor) | ✅ |
| 7 | 9 tipe hotspot | Pilih Product → popup harga + CTA, inspector field e-commerce | ✅ |
| 8 | HUD klik kanan | Klik kanan → Quick tools, pilih Reset view → HUD hilang | ✅ |
| 9 | Grup baru | Buat grup "Villa" → grup tampil + scene aktif dipindah | ✅ |
| 10 | Mini-map | Badge 360° + panorama equirectangular mengikuti yaw | ✅ |

## 2. Component testing

- `HotspotPopup`: 9 tipe dirender — media (`img`, `video`, `audio`), teks (point/article/compact), aksi (link/product/chevron), tombol close.
- `MiniMap`: src panorama (bukan thumbnail), class `w-[200%]`, badge 360°, klik memanggil `onSeek`.
- `BottomToolbar`: HUD yaw/pitch/zoom, toggle autorotate, picker 9 jenis.
- `DesignModal`: 4 grup + 10 sub-panel, preset tema memanggil `updateStudioConfig`, navigasi CMS/Marketing/Setting.
- `PublishModal`: slug/UID existing, 3 opsi akses, payload `access` & `slug` benar.
- `PublicPortfolioView`: gate password & draft ditampilkan, bukan konten.

## 3. Equivalence testing

Input yang ekuivalen semantically harus diperlakukan identik:

- **Slug**: `My Tour`, `my tour`, `MY  TOUR`, `My---Tour!`, `my_tour` → `my-tour`. Input berbeda tetap beda; input kosong → `""`.
- **Koordinat**: derajat dikirim ke PSV sebagai `"Ndeg"`; `fromPsv(toPsv(x)) === x` untuk 0/45/-90/180/359; pitch clamp [-90, 90].
- **Config**: `null`, `{}`, partial → field tak tersentuh identik dengan default.
- **Hotspot kind**: 9 kind terbagi 3 kelas (media/teks/aksi), tidak saling tertukar.

## 4. Temuan & perbaikan saat testing

1. ✅ **MiniMap `setPointerCapture` tidak ada di jsdom** → ditambah optional chaining (`?.`). Juga lebih aman di browser lama.
2. ✅ **Duplikat DOM antar test** → `afterEach(cleanup)` ditambahkan.
3. ✅ **Mock `useApp` mengembalikan `studioConfig: undefined`** → mock memakai `defaultStudioConfig` (mencegah crash `studioConfig.setting`).
4. ✅ **Test mengimpor `hotspotKinds` dari `types/studio`** (label kapital) bukan `types/tour` → diperbaiki.

Tidak ada bug aplikasi baru yang ditemukan selain `setPointerCapture`; perbaikan lain bersifat test-harness.

## 5. Catatan limitasi yang sudah diketahui (dari audit sebelumnya)

- Password gate adalah hash ringan sisi klien — bukan auth produksi.
- `blob:` URL masih bisa masuk payload jika upload gagal ke storage.
- Mode Draft/Password kini benar-benar mengunci halaman publik, tapi endpoint GET `/api/public` belum memfilter server-side.

## Kesimpulan

Build & deploy candidate **layak**: 46/46 automated tests pass, happy path browser pass, console bersih.
