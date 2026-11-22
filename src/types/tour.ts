export type HotspotType = "info" | "project" | "link" | "scene"

/** Gaya point/hotspot — diadaptasi dari model `config.style` Panoee. */
export type HotspotShape = "circle" | "square" | "diamond" | "star" | "hexagon" | "triangle" | "heart"
export type HotspotIcon = "point" | "info" | "link" | "image" | "video" | "sound" | "product" | "star" | "heart"

/** Gaya point/hotspot — diadaptasi dari `config.style` Panoee. */
export interface HotspotStyle {
  /** Ukuran marker 1..15 (sama seperti Panoee) */
  size: number
  /** Efek animasi marker */
  effect: "normal" | "pulse" | "blink" | "spin" | "bounce" | "rotate" | "none"
  /** Warna marker (hex) */
  color: string
  /** Tampilkan label di bawah marker */
  showLabel: boolean
  /** Label hanya muncul saat disorot */
  labelOnHover: boolean
  /** Opacity 10..100 */
  opacity: number
  /** Rotasi marker -360..360 derajat */
  rotate: number
  /** Bentuk marker */
  shape: HotspotShape
  /** Ikon marker */
  icon: HotspotIcon
}

export const defaultHotspotStyle: HotspotStyle = {
  size: 3,
  effect: "normal",
  color: "#facc15",
  showLabel: false,
  labelOnHover: false,
  opacity: 100,
  rotate: 0,
  shape: "circle",
  icon: "point",
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
