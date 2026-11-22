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

export async function uploadPanoramaFile(id: string, file: File): Promise<string | null> {
  if (!supabase) return null
  const ext = file.name.split(".").pop() || "jpg"
  const path = `${id}.${ext}`
  const { error } = await supabase.storage
    .from("panoramas")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" })
  if (error) throw error
  return supabase.storage.from("panoramas").getPublicUrl(path).data.publicUrl
}

export async function removePanoramaFile(url: string | undefined): Promise<void> {
  if (!supabase || !url) return
  const marker = "/panoramas/"
  const index = url.indexOf(marker)
  if (index < 0) return
  const path = decodeURIComponent(url.slice(index + marker.length).split("?")[0])
  await supabase.storage.from("panoramas").remove([path])
}
