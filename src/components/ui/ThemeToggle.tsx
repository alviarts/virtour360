import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { currentTheme, setTheme, THEME_EVENT, type Theme } from "../../lib/theme"

/** Sakelar dark/light yang sinkron di semua header (marketing, dashboard, studio). */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setLocal] = useState<Theme>(() => currentTheme())

  useEffect(() => {
    const sync = (event?: Event) => setLocal((event as CustomEvent<Theme> | undefined)?.detail ?? currentTheme())
    window.addEventListener(THEME_EVENT, sync as EventListener)
    return () => window.removeEventListener(THEME_EVENT, sync as EventListener)
  }, [])

  const next = theme === "dark" ? "light" : "dark"
  const Icon = theme === "dark" ? Sun : Moon

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`Ganti ke mode ${next === "light" ? "terang" : "gelap"}`}
      aria-label={`Ganti ke mode ${next === "light" ? "terang" : "gelap"}`}
      className={compact
        ? "grid size-8 place-items-center rounded-full border border-zinc-700 text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
        : "grid size-8 place-items-center rounded-full border border-white/10 text-[#8a8f98] transition-colors hover:border-white/25 hover:text-white"}
    >
      <Icon size={14} />
    </button>
  )
}
