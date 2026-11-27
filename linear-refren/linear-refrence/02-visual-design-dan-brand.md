# 02. Visual Design dan Brand

## Data Resmi (dari /brand dan meta tag)
| Elemen | Nilai |
|---|---|
| Warna latar utama / theme-color | `#08090a` (hampir hitam, sedikit kehijauan) |
| Wordmark putih ("Mercury White") | `#F7F8F8` |
| Wordmark gelap ("Nordic Gray") | `#232326` |
| Contoh radius ikon di brand page | 0 px, 7 px, 14 px |
| Penamaan | "Linear" satu kata, huruf L kapital; produk rilis dikapitalisasi ("Linear Reviews") |
| Aturan penggunaan logo | Beri ruang napas ("room to breathe"), jangan diubah, jangan kombinasikan dengan grafis lain |
| Logo tersedia dalam | Wordmark, Logomark, Icon (chip dengan radius) |

## Karakter Visual (teramati dari halaman)
- **Dark-first**: latar hampir hitam, teks putih-keabuan, aksen minimal.
- **Monokrom dengan aksen fungsional**: warna dipakai untuk *makna* (status issue, label, prioritas, health project), bukan dekorasi.
- **Status project berwarna**: Off Track, At Risk, On Track memakai tiga warna berbeda.
- **Label berwarna kecil** (Bug, Design, Performance, iOS, API, UI) sebagai pill.
- **Avatar bulat** kecil untuk manusia dan agen.
- **Ikon kecil, garis tipis**, konsisten dengan ikon sidebar.
- **Kepadatan informasi tinggi tapi rapi**: daftar issue rapat, baris pendek, kolom tersejajar.
- **Screenshot dengan frame halus**, memakai glow dan gradasi lembut di sekitar sebagai pemisah dari latar.

## Tipografi [verifikasi]
Linear secara luas dikenal memakai keluarga sans-serif geometris modern (Inter / Inter Display di versi lama, belakangan font kustom). Yang perlu Anda cek di DevTools:
- `font-family` heading vs. body
- Ukuran heading hero (terlihat sangat besar, tracking rapat)
- Ukuran teks UI di daftar issue (terlihat 13 px kecil)
- Penggunaan monospace untuk ID issue, kode, nama branch

Pola yang jelas terlihat: **kontras ukuran ekstrem** antara heading hero dan teks UI, tracking heading rapat, body kecil dengan line-height lega.

## Spacing dan Layout [verifikasi]
- Grid konten terpusat dengan lebar maksimum, section dipisah jarak vertikal besar.
- Di dalam UI demo: padding baris kecil, tapi grup dipisah header sticky ("In Progress 3").
- Konsisten dengan skala 4/8 px.

## Efek dan Motion
- Section demo animatif: konten bergerak masuk saat scroll (video `.mp4` AV1 untuk beberapa hero, mis. `PLANNING-MONITORING.output.av1.crf24.mp4`).
- Indikator "Working…" di baris issue yang sedang dikerjakan agen: **loading state kecil yang hidup**.
- Penghitung "1 / 84" di panel issue: detail mikro yang memperkuat kesan aplikasi nyata.

## Prinsip yang Bisa Ditiru
1. Satu warna latar, tiga tingkat abu untuk elevasi, bukan banyak warna.
2. Warna hanya untuk status.
3. Heading besar + teks UI kecil = hierarki jelas.
4. Tunjukkan produk asli, bukan ilustrasi generik.
