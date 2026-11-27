export type View = "home" | "studio" | "dashboard" | "portfolio" | "profile" | "product" | "resources" | "customers" | "pricing" | "contact" | "login" | "signup"

/** Slug unik per akun/sesi — dipakai rute `#/u/<slug>`. */
export function profileSlug(name?: string, uid?: string): string {
  const base = (name ?? "demo").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "user"
  return uid ? `${base}-${uid.slice(0, 6)}` : base
}

const CUSTOM_SLUG_KEY = "virtour360.customSlug"

/** Path portofolio yang dipilih sendiri oleh pemilik akun. */
export function customProfileSlug(uid?: string): string {
  try {
    const scoped = uid ? localStorage.getItem(`${CUSTOM_SLUG_KEY}:${uid}`) : null
    return scoped || localStorage.getItem(CUSTOM_SLUG_KEY) || ""
  } catch {
    return ""
  }
}

export function setCustomProfileSlug(slug: string, uid?: string) {
  const clean = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")
  try {
    if (uid) localStorage.setItem(`${CUSTOM_SLUG_KEY}:${uid}`, clean)
    localStorage.setItem(CUSTOM_SLUG_KEY, clean)
  } catch { /* storage bisa diblokir */ }
  return clean
}

/** Slug yang benar-benar dipakai rute `#/u/<slug>`. */
export function effectiveProfileSlug(name?: string, uid?: string): string {
  return customProfileSlug(uid) || profileSlug(name, uid)
}

export function currentView(): View {
  const hash = window.location.hash.replace(/^#\/?/, "")
  if (hash.startsWith("dashboard")) return "dashboard"
  if (hash.startsWith("studio")) return "studio"
  for (const view of ["product", "resources", "customers", "pricing", "contact"] as const) {
    if (hash.startsWith(view)) return view
  }
  if (hash.startsWith("u/")) return "profile"
  if (hash.startsWith("portfolio") || hash.startsWith("p/")) return "portfolio"
  if (hash.startsWith("login")) return "login"
  if (hash.startsWith("signup")) return "signup"
  if (hash.startsWith("home") || hash === "") return "home"
  return "home"
}

export function navigate(view: View) {
  window.location.hash = `#/${view}`
}

export function navigateHash(path: string) {
  window.location.hash = path
}

/** Buka portofolio berdasarkan akun yang sedang login. */
export function navigateProfile(name?: string, uid?: string) {
  window.location.hash = `#/u/${effectiveProfileSlug(name, uid)}`
}

/** Slug profil dari hash `#/u/<slug>`. */
export function profileFromHash(): string | null {
  const match = window.location.hash.match(/^#\/u\/([^/?]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

/** Buka portofolio kreator tertentu. */
export function navigateCreator(id: string) {
  window.location.hash = `#/portfolio/${id}`
}

/** Id kreator dari hash `#/portfolio/<id>`. */
export function creatorFromHash(): string | null {
  const match = window.location.hash.match(/^#\/portfolio\/([^/?]+)/)
  return match ? decodeURIComponent(match[1]) : null
}
