import type { Scene } from "../types/tour"
import { isServerMode } from "./supabase"

export interface PublicProfile {
  name: string
  initials: string
  location: string
  email: string
  website: string
  bio: string
}

/** Folder publik: satu project berisi beberapa scene. */
export interface PublicFolder {
  id: string
  name: string
  description: string
  cover: string
  sceneIds: string[]
  tags: string[]
  year: string
}

export interface PublicCreatorPost {
  id: string
  title: string
  image: string
  panorama: string
  category: string
  views: string
}

/** Kreator/publik yang karyanya tampil di Home (dari database). */
export interface PublicCreator {
  id: string
  name: string
  initials: string
  color: string
  email: string
  posts: PublicCreatorPost[]
}

export interface PublicPayload {
  profile: PublicProfile
  scenes: Scene[]
  /** Struktur folder hasil publish: Project → Scenes */
  folders: PublicFolder[]
  /** Banyak kreator/public user (hasil seed / publish) */
  creators?: PublicCreator[]
  updatedAt: string
}

function slug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "project"
}

/**
 * Susun scene menjadi folder per project.
 * Scene dengan project title sama digabung dalam satu folder yang rapi.
 */
export function buildPublicFolders(scenes: Scene[]): PublicFolder[] {
  const groups = new Map<string, Scene[]>()

  for (const scene of scenes) {
    const name = (scene.project?.title || scene.group || "Lainnya").trim() || "Lainnya"
    const key = slug(name)
    const bucket = groups.get(key) ?? []
    bucket.push(scene)
    groups.set(key, bucket)
  }

  return [...groups.entries()].map(([key, items]) => {
    const first = items[0]
    return {
      id: `folder-${key}`,
      name: first.project?.title || first.group || "Lainnya",
      description: items.length > 1
        ? `${items.length} scene dalam project ini.`
        : first.description || "Panorama 360°.",
      cover: first.thumbnail,
      sceneIds: items.map((scene) => scene.id),
      tags: first.project?.tags ?? [],
      year: first.project?.year ?? "",
    }
  })
}

/** Data publik diambil tanpa login oleh pengunjung. */
export async function loadPublicPayload(): Promise<PublicPayload | null> {
  if (!isServerMode) return null
  try {
    const response = await fetch("/api/public", { cache: "no-store" })
    if (!response.ok) return null
    const json = (await response.json()) as { payload?: PublicPayload }
    if (!json.payload) return null
    // Kompatibel dengan payload lama yang belum punya folders.
    return { ...json.payload, folders: json.payload.folders ?? buildPublicFolders(json.payload.scenes ?? []) }
  } catch {
    return null
  }
}

/** Dipanggil saat pemilik menekan tombol Published di Studio. */
export async function publishPublicPayload(payload: PublicPayload): Promise<boolean> {
  if (!isServerMode) return false
  try {
    const response = await fetch("/api/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // Pertahankan daftar kreator hasil seed/publish sebelumnya.
        payload: {
          ...payload,
          creators: payload.creators?.length ? payload.creators : (await loadPublicPayload())?.creators ?? [],
          folders: buildPublicFolders(payload.scenes),
        },
      }),
    })
    return response.ok
  } catch {
    return false
  }
}
