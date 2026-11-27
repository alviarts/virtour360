# 08. Penerapan untuk Virtour360

> Saya belum tahu rinci produk Virtour360 (platform tur virtual 360? dashboard admin? website marketing?). Bagian ini disusun sebagai **pelajaran yang bisa dipindahkan**. Sesuaikan dengan cakupan sebenarnya.

## Yang Layak Ditiru
1. **Tampilkan produk asli di hero.** Untuk tur 360, hero sebaiknya langsung memuat *tur yang bisa diputar*, bukan foto stok.
2. **Satu ide per section.** Judul pendek, satu paragraf, satu tautan "Learn more".
3. **Dark UI dengan warna fungsional.** Tur 360 dan foto panorama tampil lebih kuat di latar gelap netral; warna aksen hanya untuk hotspot, status, dan CTA.
4. **Chip fitur "+"** untuk daftar kemampuan (hotspot, floor plan, embed, VR mode) tanpa memenuhi halaman.
5. **Panel properti di kanan** pada editor tur: judul scene, hotspot, audio, tautan; area utama untuk viewer panorama.
6. **Sidebar personal dulu**: Proyek saya, Terbaru, Favorit → lalu workspace/klien.
7. **Status berwarna dan berlabel** untuk tiap tur: Draft / Dalam review / Dipublikasi.
8. **Timeline aktivitas tunggal** per tur: unggah, edit, komentar klien, publikasi.
9. **Changelog publik** + kutipan klien pendek sebagai bukti sosial.
10. **Penamaan jelas**: pakai "Tur", "Scene", "Hotspot", bukan istilah buatan.

## Yang Perlu Diadaptasi
- Linear untuk power user keyboard; **Virtour360 kemungkinan dipakai audiens visual dan non-teknis** (klien properti, sekolah, wisata). Pertahankan kejelasan, kurangi kepadatan.
- Viewer 360 butuh **kontrol sentuh/drag** dan **performa muat gambar besar**; tampilkan progress loading yang jelas (H1).
- Tambahkan **mode terang** bila klien akan mempresentasikan di ruang terang.

## Checklist Implementasi
- [ ] Palet: latar `#08090a`-like, 3 tingkat abu, 1 aksen, 3 warna status
- [ ] Skala tipografi: hero besar + UI 13–14 px
- [ ] Komponen baris/daftar tunggal yang dipakai berulang
- [ ] Empty state, loading state, error state didesain
- [ ] `prefers-reduced-motion` dihormati
- [ ] Kontras teks minimal WCAG AA
- [ ] Skip-to-content link

## Langkah Lanjutan yang Disarankan
1. Buka linear.app di browser, login (akun gratis), dan screenshot: Inbox, daftar issue, panel issue, command menu, pengaturan tema.
2. Ekstrak token lewat DevTools (warna, font, spacing, radius, easing).
3. Buat moodboard di Figma dari screenshot dan token itu.
4. Terjemahkan ke design token Virtour360.
