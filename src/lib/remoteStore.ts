import type { Hotspot } from "../types/tour"
import type { StudioConfig } from "../types/studio"
import type { SceneEffects } from "./effects"
import { isServerMode, SHARED_STATE_ID, supabase } from "./supabase"
import { getAuthToken } from "./authToken"

export interface RemoteUser {
  name: string
  email: string
  initials: string
  password: string
}

export interface RemotePanorama {
  id: string
  name: string
  url: string
  createdAt: number
}

export interface RemoteState {
  users: RemoteUser[]
  hotspots: Record<string, Hotspot[]>
  favorites: string[]
  media: Record<string, { panorama?: string; thumbnail?: string }>
  panoramas: RemotePanorama[]
  effects: Record<string, SceneEffects>
  groups: string[]
  sceneGroups: Record<string, string>
  sceneOrder: Record<string, number>
  imageQuality: string
  studioConfig?: Partial<StudioConfig>
}

export const emptyRemoteState: RemoteState = {
  users: [],
  hotspots: {},
  favorites: [],
  media: {},
  panoramas: [],
  effects: {},
  groups: ["Uncategory"],
  sceneGroups: {},
  sceneOrder: {},
  imageQuality: "standard",
  studioConfig: undefined,
}

export async function loadRemoteState(stateId: string): Promise<RemoteState | null> {
  if (isServerMode) {
    const response = await fetch(`/api/state?key=${encodeURIComponent(stateId)}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    })
    if (!response.ok) throw new Error("Gagal memuat state dari server")
    const json = (await response.json()) as { data?: Partial<RemoteState> }
    return json.data ? { ...emptyRemoteState, ...json.data } : null
  }
  if (!supabase) return null
  const { data, error } = await supabase
    .from("virtour_state")
    .select("data")
    .eq("id", stateId || SHARED_STATE_ID)
    .maybeSingle()
  if (error) throw error
  if (!data?.data) return null
  return { ...emptyRemoteState, ...(data.data as Partial<RemoteState>) }
}

export async function saveRemoteState(stateId: string, state: RemoteState): Promise<void> {
  if (isServerMode) {
    await fetch("/api/state", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ key: stateId, data: state }),
    })
    return
  }
  if (!supabase) return
  const { error } = await supabase.from("virtour_state").upsert({
    id: stateId || SHARED_STATE_ID,
    data: state,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export type UploadKind = "panorama" | "audio" | "image"

/** Semua aset (360°, audio, gambar) memakai satu bucket publik `panoramas`. */
export const STORAGE_BUCKET = "panoramas"

function extensionFor(contentType: string, kind: UploadKind): string {
  const mime = contentType.toLowerCase()
  if (kind === "audio") {
    if (mime.includes("ogg")) return "ogg"
    if (mime.includes("wav")) return "wav"
    if (mime.includes("webm")) return "webm"
    if (mime.includes("mp4") || mime.includes("m4a")) return "m4a"
    return "mp3"
  }
  if (mime.includes("png")) return "png"
  if (mime.includes("webp")) return "webp"
  if (mime.includes("avif")) return "avif"
  return "jpg"
}

/**
 * Upload satu aset ke Supabase Storage. Mode server memakai signed URL dari
 * `/api/storage` (service key hanya di server); mode client memakai publishable key.
 */
export async function uploadAssetFile(
  id: string,
  file: File | Blob,
  kind: UploadKind = "panorama",
): Promise<string | null> {
  const contentType = file.type || (kind === "audio" ? "audio/mpeg" : "image/jpeg")
  const ext = extensionFor(contentType, kind)

  if (isServerMode) {
    // Mode server tidak perlu klien Supabase di browser: service key ada di Vercel
    // Function, dan upload dilakukan langsung ke signed URL dengan fetch biasa.
    const response = await fetch("/api/storage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ id, contentType, kind }),
    })
    const json = (await response.json()) as {
      path?: string
      token?: string
      signedUrl?: string
      publicUrl?: string
      error?: string
    }
    if (!response.ok || !json.signedUrl || !json.publicUrl) {
      throw new Error(json.error || "Gagal menyiapkan upload aset.")
    }
    const uploaded = await fetch(json.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType, "x-upsert": "true" },
      body: file,
    })
    if (!uploaded.ok) throw new Error("Gagal mengunggah aset ke Supabase Storage.")
    return json.publicUrl
  }

  if (!supabase) return null
  const path = kind === "panorama" ? `${id}.${ext}` : `${kind}/${id}.${ext}`
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType })
  if (error) throw error
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Kompatibilitas dengan pemanggil lama. */
export async function uploadPanoramaFile(id: string, file: File | Blob): Promise<string | null> {
  return uploadAssetFile(id, file, "panorama")
}

/** Hapus object Storage dari URL publik (berlaku untuk semua jenis aset). */
export async function removeStorageFile(url: string | undefined): Promise<void> {
  if (!url) return
  if (isServerMode) {
    const response = await fetch("/api/storage", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ url }),
    })
    if (!response.ok) throw new Error("Gagal menghapus aset di Storage.")
    return
  }
  if (!supabase) return
  const marker = `/${STORAGE_BUCKET}/`
  const index = url.indexOf(marker)
  if (index < 0) return
  const path = decodeURIComponent(url.slice(index + marker.length).split("?")[0])
  await supabase.storage.from(STORAGE_BUCKET).remove([path])
}

/** Kompatibilitas dengan pemanggil lama. */
export const removePanoramaFile = removeStorageFile
