import type { CSSProperties } from "react"
import { defaultStudioConfig, type StudioConfig } from "../types/studio"

/** Variabel tema yang dipakai portfolio maupun viewer publik. */
export function studioThemeStyle(config?: Partial<StudioConfig> | null): CSSProperties {
  const theme = config?.theme
  if (!theme) return {}
  return {
    "--studio-primary": theme.primaryColor || defaultStudioConfig.theme.primaryColor,
    "--studio-text": theme.textColor || defaultStudioConfig.theme.textColor,
    fontFamily: `"${theme.primaryFont || defaultStudioConfig.theme.primaryFont}", "${theme.secondaryFont || defaultStudioConfig.theme.secondaryFont}", sans-serif`,
  } as CSSProperties
}
