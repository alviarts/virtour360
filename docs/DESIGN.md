# Arah Visual — Virtour360 (Precision Dark)

Referensi yang dipilih: **Linear** (linear.app) — bukan sekadar palet gelap, tapi disiplin: kejelasan daripada dekorasi, hairline daripada kotak, tipografi sebagai fondasi, dan produk nyata sebagai pahlawan. Warna: biru tua yang hampir hitam, sesuai permintaan.

## Token

| Peran | Hex |
|---|---|
| Canvas | `#0A0E17` |
| Surface 1 | `#0F1521` |
| Surface 2 | `#121A27` |
| Raised | `#151D2B` |
| Hairline | `#202A3A` |
| Teks / sekunder / redup | `#F5F7FA` / `#8C97A8` / `#5F6B7C` |
| Satu aksen (hanya untuk aksi & state) | `#7AA2FF` |

Tangga greyscale 4 tingkat membawa hierarki. Warna tidak dipakai untuk menghias.

## Tipografi
- `Inter` 400/500/600. Headline 58px, weight 500, tracking `-0.04em`, line-height 1.05.
- `IBM Plex Mono` **hanya** untuk data: koordinat, jumlah, kode UID.
- Kalimat dua nada (putih + abu) menggantikan heading + paragraf tebal.

## Struktur
- Hairline 1px memisahkan seksi dan baris, bukan kartu dengan shadow.
- Radius 6px untuk kontrol, 8px untuk gambar. Tidak ada pill di mana-mana.
- Hero: judul ketat di kiri, satu panorama nyata di bawahnya dengan garis horizon dan pembacaan koordinat yang merespons pointer. Tidak ada glow dekoratif.
- Trending: grid gambar dengan garis bawah hairline; yang pertama lebih lebar.
- Kreator: baris-baris, bukan kartu.
- Kategori: tab underline, bukan pill.

## Prinsip reduksi (dibanding versi sebelumnya)
- Dihapus: badge 360° di setiap kartu, gradient blur, kartu putsih dengan shadow, tombol pill, floating nav, animasi drift di kartu.
- Dipertahankan: satu gerakan hero (drift panorama) dan pembacaan koordinat saat mouse bergerak — keduanya melayani subjek, bukan dekorasi.

## Referensi lain yang dipertimbangkan
- Vercel / Geist — editorial monokrom, dua tombol hero.
- Awwwards immersive (aengel.io, bruno-simon.com) — scene penuh viewport, scroll-driven.
- Poppr / Vawzen — dark + glow dan motif cincin per panorama (tidak dipilih karena brief ini menolak glow).

Referensi dipakai sebagai prinsip, bukan ditiru mentah.
