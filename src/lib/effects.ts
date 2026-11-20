export interface SceneEffects {
  /** Koreksi kemiringan panorama (derajat) */
  roll: number
  brightness: number
  contrast: number
  saturate: number
  hue: number
  grayscale: number
  sepia: number
  /** Tampilkan penutup nadir */
  nadir: boolean
}

export const defaultEffects: SceneEffects = {
  roll: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hue: 0,
  grayscale: 0,
  sepia: 0,
  nadir: false,
}

export function normalizeEffects(value?: Partial<SceneEffects>): SceneEffects {
  return { ...defaultEffects, ...(value ?? {}) }
}

/** CSS filter untuk diterapkan pada kanvas viewer. */
export function effectsToCss(effects: SceneEffects): string {
  const parts = [
    `brightness(${effects.brightness}%)`,
    `contrast(${effects.contrast}%)`,
    `saturate(${effects.saturate}%)`,
    `hue-rotate(${effects.hue}deg)`,
    `grayscale(${effects.grayscale}%)`,
    `sepia(${effects.sepia}%)`,
  ]
  return parts.join(" ")
}

export const effectPresets: Record<string, Partial<SceneEffects>> = {
  natural: { brightness: 100, contrast: 100, saturate: 100, hue: 0, grayscale: 0, sepia: 0 },
  warm: { brightness: 105, contrast: 105, saturate: 115, hue: -8, grayscale: 0, sepia: 12 },
  cool: { brightness: 102, contrast: 108, saturate: 105, hue: 10, grayscale: 0, sepia: 0 },
  dusk: { brightness: 82, contrast: 118, saturate: 130, hue: -18, grayscale: 0, sepia: 8 },
  mono: { brightness: 105, contrast: 115, saturate: 100, hue: 0, grayscale: 100, sepia: 0 },
}
