/** "#FFFFFF,46%" → rgba(255,255,255,.46) — format warna panel Design. */
export function panoColor(value: string, fallback: string) {
  const match = value.match(/^#([0-9a-f]{6}),(\d+)%$/i)
  if (!match) return value || fallback
  const r = parseInt(match[1].slice(0, 2), 16)
  const g = parseInt(match[1].slice(2, 4), 16)
  const b = parseInt(match[1].slice(4, 6), 16)
  return `rgba(${r},${g},${b},${Number(match[2]) / 100})`
}

/** Teks hitam/putih yang masih terbaca di atas warna primer (hex). */
export function readableTextOn(value: string) {
  const hex = value.replace("#", "")
  if (!/^[0-9a-f]{6}$/i.test(hex)) return "#ffffff"
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? "#09090b" : "#ffffff"
}

/** Hanya protokol yang aman untuk tautan CTA buatan pengguna. */
export function safeExternalHref(value: string) {
  const href = value.trim()
  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) return href
  return ""
}
