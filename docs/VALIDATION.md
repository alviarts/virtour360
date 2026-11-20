# Validasi Fitur — Virtour360 vs Referensi Studio

Tanggal: 2026-11-20
Metode: uji interaksi langsung di browser (`http://localhost:5173`) + perbandingan
dengan analisis UI referensi (screenshot, DOM, computed style) yang dilakukan sebelumnya.
Build: `npm run build` sukses, `node --check` seluruh `api/*.js` sukses, console error 0.

## 1. Hasil pengujian

### Studio (`#/studio`)
| Fitur | Status | Bukti |
|---|---|---|
| Viewer 360° termuat | ✅ PASS | `.psv-container` + canvas aktif |
| Pindah scene via sidebar | ✅ PASS | scene aktif & panel inspector ikut berubah |
| Mini-map klik/drag seek | ✅ PASS | yaw berubah 240° → 245° |
| Mini-map titik hotspot | ✅ PASS | 4 titik sesuai 4 hotspot (perbaikan hari ini) |
| Indikator yaw mini-map | ✅ PASS | label `yaw 0°` mengikuti pandangan |
| Tambah hotspot | ✅ PASS | jumlah 2 → 3 → 4 |
| Edit + simpan hotspot | ✅ PASS | judul berubah & persist |
| Hapus / undo hotspot | ✅ PASS | judul kembali setelah undo |
| Settings (kualitas/kompas/gyro) | ✅ PASS | panel terbuka & bisa ditutup |
| 3 Suggestion | ✅ PASS | panel saran aksi nyata muncul |
| Search sidebar | ✅ PASS | filter "terrace" menyisakan scene Terrace |
| Collapse grup | ✅ PASS | daftar scene tersembunyi |
| Grid / list view | ✅ PASS | tombol aktif berganti |
| Autorotate | ✅ PASS | tombol merespons tanpa error |
| Upload panorama | ✅ PASS | scene baru muncul (diuji mode tamu) |
| Fullscreen / hotkey | ✅ PASS (sebagian) | hotkey R/+/-/F terpasang; fullscreen tergantung browser |

### Dashboard (`#/dashboard`)
| Fitur | Status | Bukti |
|---|---|---|
| Nav + branding Virtour360 | ✅ PASS | logo 360 & teks tampil |
| Search project | ✅ PASS | "gallery" menyaring menjadi 1 kartu |
| Filter sumber/kategori | ✅ PASS | dropdown hadir & merespons |
| Grid / list view | ✅ PASS | toggle aktif |
| Tab Live / Studio | ✅ PASS | konten berganti |
| View Public Profile | ✅ PASS | navigasi ke `#/portfolio` |
| Hapus proyek upload | ✅ PASS | tombol Hapus tersedia |

### Public Home (`#/`)
| Fitur | Status | Bukti |
|---|---|---|
| Hero + pencarian | ✅ PASS | halaman default tampil |
| Trending panorama | ✅ PASS | 6 kartu termuat |
| Filter kategori | ✅ PASS | kategori aktif menyaring hasil |
| Klik kartu → viewer 360° | ✅ PASS | `.psv-container` penuh layar + hint tampil |
| Favorit | ✅ PASS | toggle hati merespons |
| Floating nav | ✅ PASS | Home/Jelajahi/Author/Explore merespons |

### Public Portfolio (`#/portfolio`)
| Fitur | Status | Bukti |
|---|---|---|
| Profil + statistik | ✅ PASS | nama, Posts/Tours/Views/Likes dinamis |
| Search karya | ✅ PASS | hasil filter tampil |
| Detail kartu → Jelajahi 360° | ✅ PASS | viewer publik terbuka |
| View more / less | ✅ PASS | daftar bertambah/berkurang |
| Favorit persist | ✅ PASS | Likes berubah |

## 2. Perbandingan dengan referensi

| Aspek | Referensi | Virtour360 | Kesimpulan |
|---|---|---|---|
| Layout Studio (56/240/260) | ✅ | ✅ | **Sama** |
| Palet zinc + aksen amber/blue/pink | ✅ | ✅ | **Sama** |
| Font Inter, kontrol 12px | ✅ | ✅ | **Sama** |
| Mini-map + garis kuning | ✅ | ✅ | **Sama** (+ titik hotspot) |
| Toolbar atas pill & bawah pill | ✅ | ✅ | **Sama** |
| Inspector accordion (Config, AI Edit, Levelling, …) | ✅ | ✅ | **Sama secara visual** |
| Scene card thumbnail + border amber | ✅ | ✅ | **Sama** |
| Viewer engine | krpano 1.21.2 | Photo Sphere Viewer 5 | **Berbeda, hasil setara** |
| Upload panorama & hotspot editing | ✅ | ✅ | **Berfungsi** |
| Akun & penyimpanan privat | ✅ (server) | ✅ (Supabase opsional) | **Berfungsi saat env diisi** |
| Public profile + grid karya | ✅ | ✅ | **Sama** |
| AI Edit 360, Levelling, Nadir, Filter | ✅ (nyata) | disabled + alasan | **Tidak setara** — butuh pipeline image processing |
| Model 3D, Grid, Analitik | ✅ | disabled + alasan | **Tidak setara** — butuh backend/aset 3D |
| Multi-user tim, promosi, trial, pembayaran | ✅ | informasi/toast | **Tidak setara** — butuh backend penuh |

## 3. Perbaikan yang dilakukan pada sesi validasi
- Mini-map: ditambahkan titik hotspot sesuai posisi yaw/pitch (sebelumnya hanya garis pandang).
- Dokumentasi: `docs/CHANGELOG.md` dibuat untuk mencatat semua perubahan.

## 4. Batasan yang disengaja
Fitur yang tidak bisa disamakan tanpa backend/service tambahan sengaja **dinonaktifkan dengan
tooltip alasan**, bukan tombol palsu: AI Edit 360, Levelling, Nadir, Quick/Custom Fix,
Day-to-Dusk, Filter Processing, Sun light, Model 3D, Grid, Analitik.
Sinkron lintas device hanya aktif jika mode server Supabase dikonfigurasi.

## 5. Kesimpulan
Untuk cakupan **editor 360°, struktur UI, hotspot, scene, upload, public view, dan akun**,
Virtour360 sudah setara dengan referensi secara visual dan fungsional.
Untuk cakupan **AI/image processing, 3D, analitik, dan fitur komersial**, masih tertinggal
dan memerlukan backend/service eksternal.

## 6. Cara mengulang validasi
```bash
npm install
npm run dev
# buka http://localhost:5173/#/studio , /#/dashboard , /#/portfolio , /#/
npm run build
```
