# 10. Font dan Tipografi

## Sumber dan Tingkat Keyakinan
| Tag | Arti |
|---|---|
| **[resmi]** | Dinyatakan langsung oleh Linear (blog "How we redesigned the Linear UI part II") |
| **[ekstraksi]** | Dari dokumen analisis pihak ketiga yang mengekstrak CSS situs. Bukan resmi, cek ulang di DevTools |
| **[verifikasi]** | Belum terkonfirmasi |

## Font
| Peran | Font | Status |
|---|---|---|
| Heading di aplikasi | **Inter Display** (goresan lebih tebal, jarak lebih rapat) | [resmi] |
| Teks lainnya di aplikasi | **Inter** reguler | [resmi] |
| Website marketing | `Inter Variable` + fallback `SF Pro Display, -apple-system, system-ui, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Open Sans, Helvetica Neue` | [ekstraksi] |
| Monospace | `Berkeley Mono`, fallback `ui-monospace, SF Mono, Menlo` | [ekstraksi] |
| OpenType features | `"cv01", "ss03"` aktif global | [ekstraksi] |

Catatan: `cv01` (varian huruf "a") dan `ss03` mengubah karakter Inter menjadi lebih geometris. Tanpa fitur ini, hasilnya terlihat seperti Inter biasa.

## Bobot (weight) [ekstraksi]
| Bobot | Dipakai untuk |
|---|---|
| 300 | Teks yang sengaja diredam (jarang) |
| 400 | Teks bacaan |
| **510** | Bobot "khas" Linear: UI, navigasi, label (butuh variable font) |
| 590 | Penekanan kuat |
| 700 | **Tidak dipakai** |

## Skala Tipografi [ekstraksi]
| Peran | Ukuran | Bobot | Line-height | Letter-spacing |
|---|---|---|---|---|
| Display XL | 72px | 510 | 1.00 | -1.584px |
| Display Large | 64px | 510 | 1.00 | -1.408px |
| Display | 48px | 510 | 1.00 | -1.056px |
| Heading 1 | 32px | 400 | 1.13 | -0.704px |
| Heading 2 | 24px | 400 | 1.33 | -0.288px |
| Heading 3 | 20px | 590 | 1.33 | -0.24px |
| Body Large | 18px | 400 | 1.60 | -0.165px |
| Body | 16px | 400 | 1.50 | normal |
| Small | 15px | 400 | 1.60 | -0.165px |
| Caption Large | 14px | 510–590 | 1.50 | -0.182px |
| Caption | 13px | 400–510 | 1.50 | -0.13px |
| Label | 12px | 400–590 | 1.40 | normal |
| Micro | 11px | 510 | 1.40 | normal |
| Tiny | 10px | 400–510 | 1.50 | -0.15px |
| Mono Body | 14px | 400 | 1.50 | normal |

## Aturan Inti
1. **Makin besar, makin rapat**: tracking negatif ikut skala ukuran; di bawah ±16px kembali normal.
2. **Tiga bobot saja**: 400 / 510 / 590.
3. **Heading rapat (line-height ~1.0), body lega (1.5–1.6)**.
4. **Monospace untuk ID, kode, branch**.

## CSS Siap Pakai (rekomendasi untuk Virtour360, bukan kode asli Linear)
```css
@font-face {
  font-family: "Inter Variable";
  src: url("/fonts/InterVariable.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
}
:root {
  --font-sans: "Inter Variable", "SF Pro Display", -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace; /* Berkeley Mono berlisensi */
}
body {
  font-family: var(--font-sans);
  font-feature-settings: "cv01", "ss03";
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.display-xl { font-size: clamp(2rem, 5vw + 1rem, 4.5rem); font-weight: 510; line-height: 1; letter-spacing: -0.022em; }
```
Inter gratis dari rsms.me/inter atau Google Fonts. Berkeley Mono berbayar, gunakan JetBrains Mono atau Geist Mono sebagai pengganti.
