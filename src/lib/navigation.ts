export type View = "studio" | "dashboard" | "portfolio"

export function currentView(): View {
  const hash = window.location.hash.replace(/^#\/?/, "")
  if (hash.startsWith("dashboard")) return "dashboard"
  if (hash.startsWith("studio") || hash === "") return "studio"
  if (hash.startsWith("portfolio")) return "portfolio"
  return "studio"
}

export function navigate(view: View) {
  window.location.hash = `#/${view}`
}

export function navigateHash(path: string) {
  window.location.hash = path
}
