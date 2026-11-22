export type HotspotType = "info" | "project" | "link" | "scene"

/** 9 jenis hotspot ala platform referensi — sekarang benar-benar disimpan per hotspot. */
export const hotspotKinds = [
  "point", "chevron", "image", "article", "video", "sound", "link", "compact", "product",
] as const
export type HotspotKind = (typeof hotspotKinds)[number]

export const hotspotKindLabels: Record<HotspotKind, string> = {
  point: "Point",
  chevron: "Chevron",
  image: "Image",
  article: "Article",
  video: "Video",
  sound: "Sound",
  link: "Link",
  compact: "Compact",
  product: "Product",
}

/** Gaya point/hotspot — diadaptasi dari model `config.style` platform referensi. */
export type HotspotShape = "circle" | "square" | "diamond" | "star" | "hexagon" | "triangle" | "heart"
export type HotspotIcon = "point" | "info" | "link" | "image" | "video" | "sound" | "product" | "star" | "heart"

/** Gaya point/hotspot — diadaptasi dari `config.style` platform referensi. */
export interface HotspotStyle {
  /** Ukuran marker 1..15 (sama seperti platform referensi) */
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
  /** Boleh dipakai tipe hotspot apa pun; jika terisi, klik hotspot pindah ke scene ini. */
  targetSceneId?: string
  /** Jenis hotspot (9 tipe). Kosong = dibaca dari `type` lama. */
  kind?: HotspotKind
  /** Media/content untuk tipe image, video, sound, article. */
  mediaUrl?: string
  /** Product: harga & tombol CTA. */
  price?: string
  ctaLabel?: string
  ctaHref?: string
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
