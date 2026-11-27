/**
 * Salin teks ke clipboard dengan fallback untuk context non-secure / HTTP.
 * `navigator.clipboard` sering ditolak saat app dijalankan di http://localhost
 * atau lewat iframe; fallback memakai textarea + execCommand("copy").
 */
export async function copyText(value: string): Promise<boolean> {
  if (!value) return false

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // lanjut ke fallback
    }
  }

  try {
    const area = document.createElement("textarea")
    area.value = value
    area.setAttribute("readonly", "")
    area.style.position = "fixed"
    area.style.top = "-1000px"
    area.style.opacity = "0"
    document.body.appendChild(area)
    area.focus()
    area.select()
    area.setSelectionRange(0, area.value.length)
    const ok = document.execCommand("copy")
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}
