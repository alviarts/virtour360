# UI/UX & Visual QA — permintaan terbaru

Dokumen ini merangkum 10 permintaan perbaikan UI/UX dan hasil screenshot/visual QA yang dijalankan setelah implementasi.

## 1. Daftar permintaan & implementasi

| # | Permintaan | Implementasi | File utama |
|---|---|---|---|
| 1 | `#/resources`: “ini buat bagus lagi isi nya” | Resources kini punya 9 kartu bernomor, metadata jumlah panduan, hover halus, dan halaman detail dengan intro, ringkasan, table of contents sticky, bagian bernomor, serta tautan ke panduan lain. | `src/views/MarketingViews.tsx` |
| 2 | `#/resources/documentation`: “ada animasi nya mungkin ada contoh nya ada workflow animated nya” | Komponen `WorkflowFlow`: 4 langkah (Buat project → Unggah scene → Pasang hotspot → Publish link) berjalan otomatis tiap 2,6 detik, bisa diklik manual, dengan mockup project/scene/hotspot/link. | `src/components/ui/WorkflowFlow.tsx` |
| 3 | `#/resources/terms`: “buat lagi lebih bagus semuanya” | Syarat & ketentuan diubah jadi artikel terstruktur: badge “Panduan · diperbarui Nov 2026”, estimasi baca, ringkasan poin penting, nomor bagian, dan sidebar navigasi. | `src/views/MarketingViews.tsx` |
| 4 | Dashboard project card: “ini perpindahan selection aja jangan membuka view panorama” | Klik kartu/thumbnail sekarang hanya memanggil `selectProject(id)`, menandai kartu dengan badge “Dipilih”. Navigasi Studio dipindah ke tombol “Buka Studio”; pratinjau tetap lewat tombol mata. | `src/views/DashboardView.tsx` |
| 5 | Dashboard status select: “tetapi link blm muncul padahal sudah di setting publikasi” | Status `published` tanpa `publishedUid` menampilkan peringatan “Link publish belum dibuat — status saja tidak membuat link.” dan CTA “Buat link lewat modal Publish →”. Link hanya dibuat oleh `PublishModal`. | `src/views/DashboardView.tsx`, `src/App.tsx` |
| 6 | Publish modal: “harus lewat sini dulu” | CTA dashboard menyimpan flag `sessionStorage["virtour360.openPublish"]`, berpindah ke Studio, lalu `App` langsung membuka `PublishModal`. Setelah publish, tombol link dashboard muncul normal. | `src/App.tsx`, `src/components/auth/PublishModal.tsx` |
| 7 | Customers nav button: “diganti explore aja” | Label menu di Home, Marketing shell, dan footer portfolio diganti **Explore**, tetap memetakan ke rute `#/customers`. | `src/views/PublicHomeView.tsx`, `src/views/MarketingViews.tsx`, `src/views/PublicPortfolioView.tsx` |
| 8 | Customers page: “ada filter nya by date atau name” | Feed Explore memiliki pencarian nama/judul/UID, urutan Terbaru/Terlama/Nama A–Z berdasarkan `payload.updatedAt`, tombol Reset, tanggal pada tiap kartu, empty state, dan jumlah hasil. | `src/views/MarketingViews.tsx` |
| 9 | `#/resources/hotspot-guide`: “perbagus lagi ada animated contoh nya atau fitur contohnya” | Komponen `HotspotDemo`: panorama dengan 6 hotspot berdenyut (Point, Article, Video, Sound, Product, Link) dan popup yang berganti otomatis tiap 2,4 detik atau saat titik/chip diklik. | `src/components/ui/HotspotDemo.tsx` |
| 10 | Marketing header: “tambah dark mode sama lightmode” | `ThemeToggle` (Sun/Moon) di header marketing, dashboard, dan Studio. Tema tersimpan di `localStorage["virtour360.theme"]`, diterapkan sebelum render via `main.tsx`, dan disinkronkan lintas header lewat event `virtour360:theme`. | `src/lib/theme.ts`, `src/components/ui/ThemeToggle.tsx`, `src/styles/light.css` |

## 2. Perbaikan kontras yang ditemukan saat visual QA

Analisis screenshot otomatis menemukan dan memperbaiki masalah berikut:

- `text-zinc-200` di tema gelap dipetakan ke `#23252a` (warna permukaan), sehingga teks header dashboard hampir tidak terlihat. Token diubah ke `#e5e5e6`.
- Mode terang mewariskan beberapa warna teks terang (`text-white`, `text-pink-200`, `text-emerald-300`, `text-sky-400`) ke latar terang. Ditambahkan override tema terang untuk token-token tersebut.
- Chip simulasi viewer memakai `bg-[#08090a]/80` + teks terang; kini ikut terang di light mode.
- Modal publish memakai overlay hitam 70%; di light mode overlay diganti ke putih transparan supaya panel tetap terbaca.
- Tombol “Published” di TopBar diganti `bg-sky-600` agar kontras teks putih memenuhi rasio ≥ 3:1.
- Panel hotspot demo mempertahankan teks putih secara eksplisit karena memang berada di atas simulasi panorama gelap.

## 3. Screenshot & visual QA

Script: [`screenshots/capture_visual_qa.py`](screenshots/capture_visual_qa.py)  
Laporan lengkap: [`screenshots/qa-report.md`](screenshots/qa-report.md) · data: [`screenshots/qa-report.json`](screenshots/qa-report.json)

Cakupan: **24 screenshot** dari Chrome headless Playwright pada viewport **1280×900 (desktop)** dan **390×844 (mobile)**, masing-masing dark dan light:

- Home, Resources, Resources/Documentation (workflow animation), Resources/Hotspot guide (demo), Resources/Terms, Explore/Customers, Pricing, Product, Contact.
- Dashboard (login nyata) dan modal Publish.
- Metrik per screenshot: luminansi rata-rata, standar deviasi luminansi, kontras teks (< 3:1), overflow horizontal, gambar rusak, dan error konsol.

Hasil akhir: **0 flag**. Tidak ada overflow horizontal, gambar rusak, error konsol, atau teks dengan kontras di bawah 3:1 pada seluruh screenshot. Luminansi dark berkisar 13–38 dan light 208–246, sesuai tema.

Perilaku interaktif juga diverifikasi: animasi workflow berganti langkah, hotspot demo berganti popup dan merespons klik, toggle tema berpindah dark↔light dan persist setelah reload, filter Explore mengurangi kartu sesuai query, klik kartu dashboard tidak berpindah rute, CTA publish-status membuka modal Publish di Studio.

## 4. Test otomatis

```
npm run typecheck   ✅
npm test            ✅ 46/46
npm run build       ✅
```
