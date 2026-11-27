# 11. CSS dan Design Tokens

> Semua nilai di bawah bertanda **[ekstraksi]** kecuali disebut lain. Sumber: analisis pihak ketiga atas CSS situs. Nilai `#08090a`, `#F7F8F8`, `#232326` bersifat **[resmi]** (brand page).

## Sistem Warna
**[resmi]** Sejak redesign Linear memakai ruang warna **LCH**, bukan HSL. LCH seragam secara persepsi: dua warna dengan lightness sama tampak sama terang. Tema light/dark kini dibuat dari **3 variabel**: *base color, accent color, contrast* (sebelumnya 98 variabel). Kadar biru sengaja dibatasi agar tampilan lebih netral. Variabel *contrast* otomatis menghasilkan tema kontras tinggi.

### Permukaan (dark)
| Token | Nilai | Peran |
|---|---|---|
| `--bg-marketing` | `#08090a` (resmi) / `#010102` | Kanvas halaman marketing |
| `--bg-panel` | `#0f1011` | Sidebar, panel |
| `--bg-surface` | `#191a1b` | Kartu, dropdown |
| `--bg-surface-2` | `#28282c` | Hover, elevasi tertinggi |

### Teks
| Token | Nilai | Peran |
|---|---|---|
| `--text-1` | `#f7f8f8` (resmi, "Mercury White") | Utama (bukan putih murni) |
| `--text-2` | `#d0d6e0` | Body |
| `--text-3` | `#8a8f98` | Metadata, placeholder |
| `--text-4` | `#62666d` | Timestamp, disabled |

### Aksen dan Status
| Token | Nilai |
|---|---|
| `--brand` | `#5e6ad2` (indigo) |
| `--accent` | `#7170ff` |
| `--accent-hover` | `#828fff` |
| `--success` | `#27a644` / `#10b981` |

### Border
| Token | Nilai |
|---|---|
| `--border-subtle` | `rgba(255,255,255,.05)` |
| `--border` | `rgba(255,255,255,.08)` |
| `--border-solid-1/2/3` | `#23252a` / `#34343a` / `#3e3e44` |

## Radius
| Token | Nilai | Dipakai |
|---|---|---|
| micro | 2px | badge, tombol toolbar |
| sm | 4px | list item |
| md | 6px | tombol, input |
| card | 8px | kartu, popover |
| panel | 12px | panel, kartu unggulan |
| large | 22px | panel besar |
| pill | 9999px | chip, filter |
| circle | 50% | avatar, ikon |

## Spacing dan Layout
- Basis 8px. Ritme: 8 / 16 / 24 / 32. Ada nilai optik 7px dan 11px.
- Lebar konten maksimum ±1200px.
- Jarak antar section ≥80px (48px di mobile), tanpa garis pemisah.
- Hero: satu kolom, terpusat. Fitur: grid 2–3 kolom.

### Breakpoint
| <600 | 600–640 | 640–768 | 768–1024 | 1024–1280 | >1280 |
|---|---|---|---|---|---|
| 1 kolom | mobile | 2 kolom mulai | grid penuh | desktop | margin lega |

Hero: 72px → 48px → 32px. Navigasi jadi hamburger di ±768px.

## Elevasi (kunci tampilan Linear)
Di permukaan gelap, bayangan hitam hampir tak terlihat. Linear memakai **tingkat kecerahan latar** dan **border putih transparan**:

| Level | Perlakuan |
|---|---|
| 0 | `#010102`, tanpa bayangan |
| 2 | bg `rgba(255,255,255,.05)` + border `rgba(255,255,255,.08)` |
| inset | `inset 0 0 12px rgba(0,0,0,.2)` (panel "tenggelam") |
| ring | `0 0 0 1px rgba(0,0,0,.2)` |
| dropdown | `0 2px 4px rgba(0,0,0,.4)` |
| dialog | tumpukan 5 bayangan lembut (8px/5px/3px/1px/0 offset) |
| overlay | `rgba(0,0,0,.85)` |

## Komponen (ringkas)
| Komponen | Spesifikasi |
|---|---|
| Tombol ghost | bg `rgba(255,255,255,.02)`, border `1px solid #24282c`, radius 6px |
| Tombol primer | bg `#5e6ad2`, teks putih, padding 8×16, radius 6px, hover `#828fff` |
| Pill | transparan, border `#23252a`, radius 9999px, 12px/510 |
| Kartu | bg `rgba(255,255,255,.02–.05)`, border `rgba(255,255,255,.08)`, radius 8–12px |
| Input | bg `rgba(255,255,255,.02)`, border `rgba(255,255,255,.08)`, padding 12×14, radius 6px |
| Gambar produk | border halus, sudut atas `12px 12px 0 0` |
| Primitif komponen | Radix UI (terdeteksi 6 primitif) |

## Token Starter untuk Virtour360
```css
:root {
  --bg: #08090a;          --panel: #0f1011;
  --surface: #191a1b;     --surface-2: #28282c;
  --text-1: #f7f8f8;      --text-2: #d0d6e0;
  --text-3: #8a8f98;      --text-4: #62666d;
  --brand: #5e6ad2;       --accent: #7170ff;
  --border: rgba(255,255,255,.08);
  --border-subtle: rgba(255,255,255,.05);
  --r-sm: 6px; --r-card: 8px; --r-panel: 12px;
  --space: 8px;
}
.card {
  background: rgba(255,255,255,.03);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
}
.btn-ghost {
  background: rgba(255,255,255,.02);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  color: var(--text-2);
  transition: background .15s ease, border-color .15s ease;
}
.btn-ghost:hover { background: rgba(255,255,255,.05); color: var(--text-1); }
```
Ganti `--brand` dengan warna identitas Virtour360 agar tidak terlihat seperti tiruan Linear.
