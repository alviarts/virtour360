export type HotspotType = "info" | "project" | "link" | "scene"

export interface Hotspot {
  id: string
  type: HotspotType
  yaw: number
  pitch: number
  title: string
  description?: string
  href?: string
  targetSceneId?: string
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
