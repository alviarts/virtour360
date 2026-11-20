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

export interface PublicPayload {
  profile: PublicProfile
  scenes: Scene[]
  updatedAt: string
}

/** Data publik diambil tanpa login oleh pengunjung. */
export async function loadPublicPayload(): Promise<PublicPayload | null> {
  if (!isServerMode) return null
  try {
    const response = await fetch("/api/public", { cache: "no-store" })
    if (!response.ok) return null
    const json = (await response.json()) as { payload?: PublicPayload }
    return json.payload ?? null
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
      body: JSON.stringify({ payload }),
    })
    return response.ok
  } catch {
    return false
  }
}
