export type Theme = "dark" | "light"

const THEME_KEY = "virtour360.theme"
export const THEME_EVENT = "virtour360:theme"

/** Tema dibaca sebelum render supaya tidak ada flash terang/gelap. */
export function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark"
  } catch {
    return "dark"
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch { /* storage bisa diblokir — tema tetap berlaku untuk sesi ini */ }
  applyTheme(theme)
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }))
}

export function toggleTheme() {
  setTheme(readTheme() === "dark" ? "light" : "dark")
}

/** Dipakai komponen tombol agar sinkron bila tema diubah dari header lain. */
export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark"
}
