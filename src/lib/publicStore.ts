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
  /** UID unik project publish — dipakai link langsung */
  uid?: string
  updatedAt: string
}

function slug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "project"
}

/** UID pendek, aman untuk URL. */
export function makePublicUid(): string {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 10)
}

/** Link langsung yang bisa dibagikan. */
export function publicShareUrl(uid: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : ""
  return `${base}/#/p/${encodeURIComponent(uid)}`
}

/** Baca UID dari hash `#/p/<uid>`. */
export function publicUidFromHash(): string | null {
  const match = window.location.hash.match(/^#\/p\/([^/?]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

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
      description: items.length > 1 ? `${items.length} scene dalam project ini.` : first.description || "Panorama 360°.",
      cover: first.thumbnail,
      sceneIds: items.map((scene) => scene.id),
      tags: first.project?.tags ?? [],
      year: first.project?.year ?? "",
    }
  })
}

/** Data publik diambil tanpa login. Bisa memakai UID project tertentu. */
export async function loadPublicPayload(uid?: string | null): Promise<PublicPayload | null> {
  if (!isServerMode) return null
  try {
    const query = uid ? `?id=${encodeURIComponent(uid)}` : ""
    const response = await fetch(`/api/public${query}`, { cache: "no-store" })
    if (!response.ok) return null
    const json = (await response.json()) as { payload?: PublicPayload }
    if (!json.payload) return null
    return { ...json.payload, folders: json.payload.folders ?? buildPublicFolders(json.payload.scenes ?? []) }
  } catch {
    return null
  }
}

/**
 * Publish project. Mengembalikan UID unik untuk link langsung.
 */
export async function publishPublicPayload(
  payload: PublicPayload,
  uid?: string,
): Promise<{ ok: boolean; uid: string }> {
  const finalUid = uid || payload.uid || makePublicUid()
  if (!isServerMode) return { ok: false, uid: finalUid }
  try {
    const previous = await loadPublicPayload()
    const response = await fetch("/api/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: finalUid,
        payload: {
          ...payload,
          uid: finalUid,
          creators: payload.creators?.length ? payload.creators : previous?.creators ?? [],
          folders: buildPublicFolders(payload.scenes),
        },
      }),
    })
    return { ok: response.ok, uid: finalUid }
  } catch {
    return { ok: false, uid: finalUid }
  }
}
