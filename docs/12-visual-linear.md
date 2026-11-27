# Implementasi Visual Linear di Virtour360

 referensi: `https://linear.app/` — di-curl HTML, 46 CSS bundle, dan font aslinya. Token lengkap ada di [LINEAR-REFERENCE.md](LINEAR-REFERENCE.md).

## Token yang dipakai
| Peran | Hex |
|---|---|
| Void / canvas | `#08090a` |
| Carbon / surface | `#0f1011` |
| Obsidian | `#161718` |
| Frame background | `#090a0b` |
| Border hairline | `#23252a` |
| Teks | `#f7f8f8` / `#d0d6e0` / `#8a8f98` / `#62666d` |
| Aksen (satu per view) | `#e4f222` |
| Font | `Inter Variable` + `Berkeley Mono` (di-host lokal di `public/fonts/`) |

Header 72px, radius 6/8/12px, weight 510, tracking `-0.022em` di headline ≥48px, section gap 96px.

## Struktur Home (atas → bawah)
1. Nav tetap: logo kiri; menu **Product · Resources · Customers · Pricing · Contact** di kanan; **Log in** + pill **Sign up**. Dropdown Product/Resources melekat tepat di bawah tombol (`left-0 top-full mt-3`) dan berisi judul + deskripsi.
2. Hero: headline dua nada, CTA `Start free` (acid-lime) + `Buka demo studio`, radial glow tanpa garis potong.
3. Stage produk: wrapper ala `frameWrapper` — buffer 60/32/28/18px, overflow hidden, fade kanan 360px, shadow. Isi = **Studio kita** (sidebar scene, viewer, inspector), scene bisa diklik mengganti panorama.
4. Seksi fitur: `A new species of product tool`, `Planning and monitoring`, `AI and automations` — visual dari kode, bukan JPG, masing-masing dengan `translateY` yang mengikuti scroll.
5. `Intake and integrations` — thread diskusi tour (#gallery).
6. `Susun, tinjau, dan bagikan` — kartu agent bertugas tour.
7. `Changelog`, customer strip, CTA akhir, footer 6 kolom.

## Sistem animasi
- `dot-grid`: 84 titik `upDown 2.8s` dengan delay bertahap.
- `stageScroll`: daftar scene marquee vertikal 30s, dua salinan untuk loop (pola `xt7VyG` Linear).
- `featureFloat`: visual seksi naik-turun 6s alternate.
- `agentDot` 3.2s + `agentSweep` 2s.
- `Reveal`: IntersectionObserver → opacity 0→1 + translateY 24px→0, 700ms cubic-bezier.
- `prefers-reduced-motion` mematikan semuanya.

## Catatan
Fade hanya di **kanan** (`mask-image: linear-gradient(to right, #000 0%, #000 95%, transparent 100%)`). Frame dibuang, stage boleh agak keluar (`lg:scale-[1.02]`, feature `lg:-mr-24`).
