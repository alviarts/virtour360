# Panduan aset panorama

## Format yang dibutuhkan
Photo Sphere Viewer membaca **equirectangular** dengan rasio **2:1**
(misalnya 4096×2048 atau 8192×4096). Format lain (cubemap, flat 360) harus
dikonversi dulu.

## Struktur folder
```
public/media/
├── panoramas/   # file penuh, dipakai viewer
└── thumbnails/  # versi kecil (±800px lebar), dipakai sidebar & mini-map
```

## Menambah scene baru
1. Taruh panorama di `public/media/panoramas/nama-baru.jpg`.
2. Buat thumbnail:
   ```bash
   ffmpeg -i public/media/panoramas/nama-baru.jpg -vf scale=800:-1 -q:v 5 public/media/thumbnails/nama-baru.jpg
   ```
3. Tambahkan entri di `src/data/scenes.ts` (id, nama, path, hotspot, metadata).
4. Hubungkan scene dengan hotspot bertipe `"scene"` dan `targetSceneId`.

## Sumber panorama demo
Aset contoh berasal dari Photo Sphere Viewer demo data
(`photo-sphere-viewer-data.netlify.app`, lisensi proyek PSV/MIT).
Ganti dengan karya sendiri sebelum produksi.

## Optimasi untuk Vercel
- Panorama 4K (~4 MB per file) sudah cukup untuk web.
- Jangan melebihi ~10 MB per file; waktu muat akan meningkat.
- `vercel.json` sudah mengatur cache immutable untuk `/media/*`.
