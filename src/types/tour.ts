export type HotspotType = "info" | "project" | "link" | "scene"

/** Gaya point/hotspot — diadaptasi dari model `config.style` Panoee. */
export interface HotspotStyle {
  /** Ukuran marker 1..5 */
  size: number
  /** Efek animasi marker */
  effect: "normal" | "pulse" | "blink" | "spin" | "bounce" | "rotate" | "none"
  /** Warna marker (hex) */
  color: string
  /** Tampilkan label di bawah marker */
  showLabel: boolean
  /** Opacity 0..100 */
  opacity: number
}

export const defaultHotspotStyle: HotspotStyle = {
  size: 3,
  effect: "normal",
  color: "#facc15",
  showLabel: false,
  opacity: 100,
}

export interface Hotspot {
  id: string
  type: HotspotType
  yaw: number
  pitch: number
  title: string
  description?: string
  href?: string
  targetSceneId?: string
  style?: HotspotStyle
}

export interface ProjectMeta {
  title: string
  role: string
  client: string
  year: string
  tags: string[]
}

export interface Scene {
  id: string
  name: string
  description: string
  group: string
  panorama: string
  thumbnail: string
  initialView: { yaw: number; pitch: number; zoom: number }
  hotspots: Hotspot[]
  project: ProjectMeta
  audio?: string
}

export interface Profile {
  name: string
  initials: string
  role: string
  location: string
  email: string
  website: string
  bio: string
  stats: { label: string; value: string }[]
}
