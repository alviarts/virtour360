# Arah Visual — Virtour360 (dark blue)

Panduan ini mengikuti skill **`frontend-design`** dari `anthropics/skills` (GitHub). Dua pass: rencana → kritik → implementasi.

## Subjek & tujuan
Subjek: arsip panorama 360° untuk fotografer dan kreator yang membagikan tempat. Audiens: penonton yang mencari ruang untuk dijelajahi, dan kreator yang mempublikasikan karyanya. Tujuan Home: menemukan dan membuka satu panorama dengan cepat.

## Pass 1 — token

**Warna (6)**
| Peran | Hex |
|---|---|
| Abyss (latar) | `#061224` |
| Panel | `#0B1F3A` |
| Panel 2 | `#0F294B` |
| Raised / garis | `#123153` / `#1E4A78` |
| Teks / redup | `#DCE9F7` / `#7F9FBF` |
| Signal (satu aksen) | `#4CC9F0` |

**Tipografi**
- Display: `Sora` 600/700 — judul hero, judul seksi.
- Body: `IBM Plex Sans` 400/500 — paragraf, label, kontrol.
- Kalimat biasa (sentence case), bukan ALL CAPS. Panjang baris < 80 karakter.

**Layout**
Home: editorial dua kolom — teks rata kiri di kiri, satu jendela panorama di kanan. Explore: grid asimetris, kartu pertama lebih lebar. Kategori: rail pill dengan jumlah asli. Kreator: baris kartu ringkas dengan thumbnail.

```
+ header -------------------------------------------+
| logo        nav              [Buat] [Studio] [A]  |
+---------------------------------------------------+
| headline        |  +--------------------------+   |
| deskripsi       |  |  panorama (satu drift)  |   |
| [cari]          |  |  360° · Atrium           |   |
| stat            |  |  [Buka panorama]         |   |
|                 |  +--------------------------+   |
+---------------------------------------------------+
| Panorama pilihan        [Lihat semua]             |
| [feature card 2 kolom] [card] [card]              |
| Kreator publish · Kategori (dengan jumlah)        |
+---------------------------------------------------+
```

**Prinsip**
- Satu gerakan tidak-interaktif: hero panorama bergeser pelan bolak-balik. Kartu diam.
- Struktur menyampaikan data: badge 360°, jumlah kategori, jumlah scene — bukan dekorasi.
- Satu aksen (cyan). Tidak ada gradien dekoratif, bayangan abu-abu seragam, atau radius yang sama untuk semua elemen.

## Pass 2 — kritik & revisi
- Ditolak: "big number + label + gradient" sebagai hero → diganti jendela panorama nyata.
- Ditolak: ALL CAPS eyebrow, `→` di akhir tombol, string dengan titik tengah → diganti kalimat biasa.
- Ditolak: animasi fade-up di setiap seksi dan drift di setiap kartu → hanya hero yang bergerak.
- Ditolak: kartu identik dengan shadow lembut → grid asimetris, hairline border, dua radius (12/20).
- Diterima: dark blue sesuai permintaan, bukan near-black + aksen asam.

## Status implementasi
- Token didefinisikan di `src/styles/theme.css` (`@theme`), termasuk override `zinc-*` agar Studio/Dashboard/modal ikut navy.
- Font dimuat dari Google Fonts; fallback system tetap ada.
- `prefers-reduced-motion` mematikan drift hero.
- Home, Portfolio, Studio, Dashboard, dan modal memakai palet yang sama.
