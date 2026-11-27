# Halaman Marketing & Rute Baru

Nav header Home dan halaman marketing membuka rute penuh; **Product dan Resources punya dropdown** dengan tautan ke rute nyata. Kelima halaman memakai shell gelap `#08090a`, header sticky 72px, tipografi Inter Variable 510, tracking `-0.022em`.

| Rute | Halaman | Isi |
|---|---|---|
| `#/product` | ProductView | Hero "A 360° tour workspace for creators", `TourStage`, 4 kartu fitur (Scene, Hotspot, Publish, Explore) |
| `#/pricing` | PricingView | **Free for all users** — kartu Free $0 (unlimited project, 3 GB, 9 hotspot, 32K, link sendiri, tanpa watermark), storage tambahan $0,15/GB, syarat & ketentuan |
| `#/customers` | CustomersView | Feed publish dinamis: kartu `/p/<uid>` dari Supabase + publish lokal + kartu contoh `/u/<slug>`; badge Live, sumber (Supabase/Lokal), dan tombol Segarkan |
| `#/resources` | ResourcesView | 9 dokumen lengkap: Documentation, Quick start, Hotspot guide, Embed & share, Community, Changelog, Fitur & batasan, Syarat & ketentuan, Kebijakan privasi |
| `#/contact` | ContactView | "How can we help?" + 3 kartu Sales / Support / Other inquiries ala `linear.app/contact` |

Semua perpindahan rute memakai transisi **fade out 160 ms → fade in 240 ms** (`.page-fade` di `src/Root.tsx` + `src/styles/theme.css`); `prefers-reduced-motion` menonaktifkannya.

Implementasi: `src/views/MarketingViews.tsx`, `src/Root.tsx`, `src/lib/navigation.ts`, `src/views/PublicHomeView.tsx`.

## Pembaruan lanjutan
- Footer disederhanakan: logo `virtour360` + tautan Home/Product/Resources/Customers/Pricing/Contact + Instagram `vwrks`, tanpa grid enam kolom.
- Mark logo berputar 14 detik sekali (`.logo-mark`, dimatikan pada `prefers-reduced-motion`).
- Kontak "Other inquiries" mengarah ke `https://instagram.com/vwrks`.
- Customers: tiap kartu kini punya **preview gambar** panorama.
- Resources punya subpath nyata: `#/resources/documentation`, `quick-start`, `hotspot-guide`, `embed-share`, `community`, `changelog` — masing-masing berisi panduan.
- Nav header ditambah **Home** sebelum Product (Home dan semua halaman marketing).
- Perbaikan scroll: wrapper `.page-fade` kini `h-full w-full` (#home-root bisa di-scroll kembali).

## Putaran terakhir
- Home: chat dibatasi 2 pesan, kartu agent dibatasi 2 dengan durasi tetap, testimoni & changelog mengetik/muncul satu per satu saat scroll, CTA mendapat world wireframe putih berputar (opacity 0.5).
- Product: 4 kartu fitur ditampilkan sebagai langkah 01–04.
- Login/Sign up: tombol passkey dihapus; header marketing punya Log in → `#/login` dan Sign up → `#/signup`.
- Portfolio user: kartu demo disembunyikan, hanya karya publish milik user; footer sama dengan Home; Create langsung ke Dashboard bila sudah login; "Explore komunitas" → `#/customers`.
- Dashboard: path `/u/<slug>` bisa diklik untuk diedit (tersimpan `virtour360.customSlug`); tombol Changelog membuka daftar workflow per tanggal & jam.

Catatan: `#/p/<uid>` tetap untuk project publish; `#/u/<slug>` untuk profil user; `#/portfolio` fallback lama.

## QA putaran lanjutan (setelah push `1d4a885`)
- Dropdown Product/Resources akhirnya muncul di **semua** halaman marketing, tidak hanya Home. Entri dropdown menuju rute nyata (`#/studio`, `#/resources/...`, `#/pricing`).
- Isi Resources sekarang dokumentasi lengkap, bukan satu paragraf: alur kerja, rute, penyimpanan, 9 jenis hotspot, embed/QR, komunitas, changelog, fitur & batasan, syarat & ketentuan, kebijakan privasi.
- Customers tidak lagi memakai daftar creator statis sebagai satu-satunya sumber: `listPublishedPayloads()` menggabungkan baris `virtour:pub:*` dari Supabase dan publish lokal, lalu `watchPublishedChanges()` memperbarui lewat event publish, storage event, `postgres_changes`, serta polling 2,5 detik. Kartu diberi badge **Supabase**, **Lokal**, atau **Contoh**.
- Status Supabase: **terhubung** lewat `.env` lokal (publishable key). Customers menampilkan 4 tour Supabase + 2 tour lokal. Bucket storage dan publikasi Realtime masih perlu dijalankan sekali lewat SQL Editor — lihat `docs/19-koneksi-supabase.md`.
- Header marketing mengikuti state login: avatar + nama + tombol Keluar; **Keluar kini kembali ke `#/home`**, bukan meninggalkan halaman dengan pesan "Dashboard perlu login".

Catatan: `#/p/<uid>` tetap untuk project publish; `#/u/<slug>` untuk profil user; `#/portfolio` fallback lama.
