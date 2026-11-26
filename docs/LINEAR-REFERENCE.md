# Linear — referensi design system (diunduh 2026-11-27)

Sumber: `https://linear.app`, `styles.refero.design/style/90ce5883-...`, `anthropics/skills/frontend-design`.

## Karakter
"Midnight precision instrument": gelap bukan sebagai tema, tapi sebagai substrate. Kejelasan > dekorasi. Hairline > shadow. Tipografi rapat, berat rendah. Produk asli adalah satu-satunya ilustrasi.

## Warna
| Peran | Hex |
|---|---|
| Void / canvas | `#08090a` |
| Carbon / surface | `#0f1011` |
| Obsidian / elevated | `#161718` |
| Graphite / border | `#23252a` |
| Smoke / hairline kuat | `#383b3f` |
| Ash / muted | `#62666d` |
| Fog / tertiary | `#8a8f98` |
| Mist / body | `#d0d6e0` |
| Bone | `#e5e5e6` |
| Paper | `#ffffff` |
| Aksen Funkional (di lab kita: biru) | `#7AA2FF` |

Di Linear asli aksen = acid lime `#e4f222`. Lab ini memakai biru sesuai preferensi user, dengan aturan yang sama: **satu aksi berwarna per layar**, tidak untuk dekorasi.

## Tipografi
- Inter Variable, weight **300 / 400 / 510 / 590**, **tanpa 700+**.
- Tracking `-0.022em` di 48px+, `-0.012em` di 20–32px, `-0.010em` di 13–16px.
- Mono (Berkeley Mono / IBM Plex Mono): **hanya** ID issue, shortcut, metadata teknis.
- Scale: 72 / 64 / 48 / 32 / 24 / 20 / 16 / 15 / 13 / 12 / 10.

## Bentuk & ritme
- Radius: badges 4px, input/button 6px, card 12px, pill 9999px. Tiga radius saja.
- Spacing ladder 4/8/12/16/24/32/48/96. Base 4px, elemen 8px, seksi 96px.
- Elevasi dari **surface progression** + hairline inset, bukan shadow tebal.
- Section gap 96px, max width 1200px, card padding 24px.

## Komponen khas
- Primary button: satu warna, radius 6px, padding 10×16, weight 510.
- Nav text button: transparan, `#d0d6e0`, 13px, underline saat hover.
- Pill button: `rgba(255,255,255,.05)`, text `#d0d6e0`.
- Ghost button: border 1px `#23252a`, radius 6px.
- Badge: `rgba(255,255,255,.05)`, text `#8a8f98`, radius 4px.
- Input: bg `rgba(255,255,255,.02)`, border `rgba(255,255,255,.08)`, radius 6px.
- Card: bg `#0f1011`, inset `0 0 0 1px #23252a`, radius 12px.

## Layout aplikasi (yang ditiru lab)
Sidebar kiri (workspace + nav + tim), top bar dengan breadcrumb & aksi, daftar issue dikelompokkan per status dengan hairline, panel detail kanan, command palette ⌘K. Tidak ada kartu berulang; densitas informasi tinggi tapi tenang.

## Don't
- Tanpa bold 700+.
- Tanpa gradien dekoratif di button/card/text.
- Tanpa radius > 12px untuk panel.
- Tanpa shadow tebal untuk memisahkan kartu.
- Tanpa warna untuk body copy.
