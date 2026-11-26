export type View = "home" | "studio" | "dashboard" | "portfolio" | "lab"

export function currentView(): View {
  const hash = window.location.hash.replace(/^#\/?/, "")
  if (hash.startsWith("dashboard")) return "dashboard"
  if (hash.startsWith("studio")) return "studio"
  if (hash.startsWith("portfolio") || hash.startsWith("p/")) return "portfolio"
  if (hash.startsWith("lab")) return "lab"
  if (hash.startsWith("home") || hash === "") return "home"
  return "home"
}

export function navigate(view: View) {
  window.location.hash = `#/${view}`
}

export function navigateHash(path: string) {
  window.location.hash = path
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
