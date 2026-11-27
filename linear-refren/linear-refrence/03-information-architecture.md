# 03. Information Architecture

## Navigasi Website
- **Header**: Product (dropdown), Resources (dropdown), Customers, Pricing, Now, Contact.
- **Aksi utama kanan**: Docs, Open app, Log in, Sign up. Pengguna lama dan baru dilayani sekaligus.
- **Product dipetakan ke alur kerja, bukan daftar fitur**: Intake → Plan → AI → Build.
- **Footer**: Product, Features, Company, Resources, Connect, Legal. Footer berfungsi sebagai sitemap lengkap.
- **Method dan Quality** ada di Company: konten filosofi sebagai alat brand.

## Sidebar Aplikasi (dari screenshot hero)
```
Linear (workspace)
├─ Pulse
├─ Inbox
├─ My issues
├─ Reviews
│
├─ Workspace
│   ├─ Initiatives
│   ├─ Projects
│   └─ More
│
├─ Favorites
│   ├─ Faster app launch
│   ├─ Agent tasks
│   ├─ Agent Insights
│   └─ UI Refresh
```
Pola: **personal dulu** (Inbox, My issues), **workspace** kemudian, **favorit** untuk akses cepat. Jumlah item teratas sedikit; sisanya disembunyikan di "More" (progressive disclosure).

## Hierarki Konsep (dari /method)
```
Initiative  (arah strategis)
 └─ Project   (kerja berbatas waktu, punya owner, spec, milestone)
     └─ Issue   (unit kerja terkecil, satu owner)
         └─ Sub-issue
Cycle  = irisan waktu n minggu yang memotong semua project
```
Prinsip dari Linear Method: **"Don't invent terms. Projects should be called projects."** Nama konsep sesuai bahasa pengguna (H2 Nielsen).

## Panel Detail Issue (dari hero)
Layout dua kolom:
- **Kiri**: ID + judul, deskripsi, aktivitas (timeline gabungan: event sistem, komentar manusia, aksi agen).
- **Kanan "Properties"**: Status, Prioritas, Assignee, Cycle, Labels, Releases.

Properti diletakkan terpisah dari narasi: pengguna dapat memindai metadata tanpa membaca percakapan.

## Prinsip IA yang Terlihat
- **Satu sumber kebenaran**: spec, issue, feedback pelanggan, update project di satu tempat ("Close the gap between planning and building").
- **Tab di dalam project**: Overview · Activity · Customers · Issues, yaitu satu objek dengan banyak sudut pandang.
- **Entitas saling menaut**: issue ↔ PR ↔ project ↔ dokumen ↔ thread Slack.
- **Feed personal (Pulse)** menambah satu lapisan di atas struktur objek.
