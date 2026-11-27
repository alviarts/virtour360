import type { Scene } from "../types/tour"
import type { StudioConfig } from "../types/studio"
import { isServerMode, supabase } from "./supabase"

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
  /** Konfigurasi Design/CMS/Marketing/Setting dari Studio */
  studioConfig?: StudioConfig
  /** Kontrol akses publish — benar-benar diterapkan di halaman publik. */
  access?: "draft" | "public" | "password"
  /** Hash password (bukan password mentah) untuk access=password. */
  passwordHash?: string
  /** Slug ramah URL; dipakai sebagai UID saat publish. */
  slug?: string
  updatedAt: string
}

const LOCAL_PUBLISH_KEY = "virtour360.published"
/** Event same-tab supaya halaman Customers langsung segar setelah publish. */
const PUBLISHED_EVENT = "virtour360:published"

/** Baris publish di Supabase — format sama dengan api/public.js. */
const REMOTE_PUBLISH_PREFIX = "virtour:pub:"
const REMOTE_PUBLIC_ID = "virtour:public"

function remotePublishId(uid: string): string {
  const safe = uid.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 40)
  return safe ? `${REMOTE_PUBLISH_PREFIX}${safe}` : REMOTE_PUBLIC_ID
}

function itemFromRow(row: { id: string; data: unknown }): PublishedItem | null {
  const stored = row.data as { payload?: PublicPayload } | null
  const payload = (stored?.payload ?? stored) as PublicPayload | null
  if (!payload?.scenes?.length) return null
  return {
    uid: payload.uid || row.id.slice(REMOTE_PUBLISH_PREFIX.length) || "public",
    payload,
    source: "supabase",
  }
}

/** Hash ringan untuk gate password (bukan password mentah yang disimpan). */
export function hashPassword(value: string): string {
  let hash = 5381
  for (let i = 0; i < value.length; i++) hash = (hash * 33) ^ value.charCodeAt(i)
  return (hash >>> 0).toString(36)
}

function localKey(uid?: string | null) {
  return uid ? `${LOCAL_PUBLISH_KEY}:${uid}` : LOCAL_PUBLISH_KEY
}

/** Normalisasi slug: huruf besar, spasi, tanda baca yang ekuivalen → slug sama. */
export function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function slug(value: string) {
  return normalizeSlug(value) || "project"
}

/** UID pendek, aman untuk URL. */
export function makePublicUid(): string {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 10)
}

/** Link langsung yang bisa dibagikan. */
async function loadPublishedFromSupabase(uid?: string | null): Promise<PublicPayload | null> {
  if (!supabase) return null
  const ids = uid ? [remotePublishId(uid), REMOTE_PUBLIC_ID] : [REMOTE_PUBLIC_ID]
  for (const id of ids) {
    const { data, error } = await supabase
      .from("virtour_state")
      .select("data")
      .eq("id", id)
      .maybeSingle()
    if (error) return null
    if (!data?.data) continue
    const item = itemFromRow({ id, data: data.data })
    if (item) return item.payload
  }
  return null
}

export function publicShareUrl(uid: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : ""
  return `${base}/#/p/${uid.split("/").map(encodeURIComponent).join("/")}`
}

/** Baca UID dari hash `#/p/<uid>`. */
export function publicUidFromHash(): string | null {
  const match = window.location.hash.match(/^#\/p\/([^?]+)/)
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
  if (!isServerMode) {
    // Tour yang dipublish di produksi bisa dibuka dari localhost lewat proxy /api.
    const fromApi = async (): Promise<PublicPayload | null> => {
      if (!uid) return null
      try {
        const response = await fetch(`/api/public?id=${encodeURIComponent(uid)}`, { cache: "no-store" })
        if (!response.ok) return null
        const json = (await response.json()) as { payload?: PublicPayload }
        if (!json.payload?.scenes?.length) return null
        return {
          ...json.payload,
          folders: json.payload.folders ?? buildPublicFolders(json.payload.scenes),
        }
      } catch {
        return null
      }
    }
    try {
      // Tanpa uid, baca project publish terakhir (local mode).
      const currentUid = uid ?? localStorage.getItem("virtour360.publishedUid")
      const raw = localStorage.getItem(localKey(currentUid))
      if (!raw) {
        const remote = await loadPublishedFromSupabase(uid ?? currentUid)
        return remote ?? fromApi()
      }
      // Utamakan project lokal hasil publish milik user. Jangan jatuh ke data
      // default server hanya karena panorama lokal ber-blob: — itu mengganti
      // karya yang di-upload dengan contoh bawaan.
      const payload = JSON.parse(raw) as PublicPayload
      const scenes = payload.scenes ?? []
      const validIds = new Set(scenes.map((scene) => scene.id))
      const folders = (payload.folders ?? buildPublicFolders(scenes)).map((folder) => ({
        ...folder,
        sceneIds: folder.sceneIds.filter((id) => validIds.has(id)),
      })).filter((folder) => folder.sceneIds.length > 0)
      return { ...payload, scenes, folders }
    } catch {
      return null
    }
  }
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
): Promise<{ ok: boolean; uid: string; error?: string; warning?: string }> {
  const finalUid = uid || payload.slug || payload.uid || makePublicUid()
  if (!isServerMode) {
    try {
      let previous: PublicPayload | null = null
      try {
        const raw = localStorage.getItem(localKey(finalUid))
        if (raw) previous = JSON.parse(raw) as PublicPayload
      } catch { /* abaikan */ }
      const finalPayload: PublicPayload = {
        ...payload,
        uid: finalUid,
        slug: payload.slug || finalUid,
        creators: payload.creators?.length ? payload.creators : (previous?.creators ?? []),
        folders: buildPublicFolders(payload.scenes),
      }
      localStorage.setItem(localKey(finalUid), JSON.stringify(finalPayload))
      localStorage.setItem("virtour360.publishedUid", finalUid)
      window.dispatchEvent(new CustomEvent(PUBLISHED_EVENT, { detail: { uid: finalUid } }))

      let warning: string | undefined
      let remoteError: string | undefined
      if (supabase) {
        if (finalPayload.scenes.some((scene) => (scene.panorama || "").startsWith("blob:"))) {
          warning = "Panorama masih lokal. Buat bucket storage 'panoramas' agar tour bisa dibuka dari perangkat lain."
        }
        const { error } = await supabase.from("virtour_state").upsert({
          id: remotePublishId(finalUid),
          data: { payload: finalPayload, updated_at: finalPayload.updatedAt },
          updated_at: finalPayload.updatedAt,
        })
        if (error) remoteError = error.message
      }
      return {
        ok: !remoteError,
        uid: finalUid,
        error: remoteError ? `Tersimpan di browser, tapi gagal ke Supabase: ${remoteError}` : undefined,
        warning,
      }
    } catch {
      return { ok: false, uid: finalUid, error: "Gagal menyimpan publish di browser." }
    }
  }
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
    if (response.ok) window.dispatchEvent(new CustomEvent(PUBLISHED_EVENT, { detail: { uid: finalUid } }))
    return { ok: response.ok, uid: finalUid }
  } catch {
    return { ok: false, uid: finalUid }
  }
}

export interface PublishedItem {
  uid: string
  payload: PublicPayload
  /** Sumber data feed: browser lokal atau tabel Supabase. */
  source?: "local" | "supabase"
}

/** Semua tour yang dipublish — dipakai feed Customers. */
export async function listPublishedPayloads(): Promise<PublishedItem[]> {
  const localItems = (): PublishedItem[] => {
    const items: PublishedItem[] = []
    const prefix = `${LOCAL_PUBLISH_KEY}:`
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(prefix)) continue
      try {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const payload = JSON.parse(raw) as PublicPayload
        if (payload.scenes?.length) {
          items.push({ uid: payload.uid || key.slice(prefix.length), payload, source: "local" })
        }
      } catch { /* lewati payload rusak */ }
    }
    return items.sort((a, b) => (b.payload.updatedAt ?? "").localeCompare(a.payload.updatedAt ?? ""))
  }

  if (isServerMode) {
    try {
      const response = await fetch("/api/public?list=1", { cache: "no-store" })
      if (!response.ok) return []
      const json = (await response.json()) as { items?: PublishedItem[] }
      // Endpoint server mengembalikan baris virtour_state tanpa field source;
      // tandai sebagai Supabase supaya badge feed konsisten dengan mode klien.
      return (json.items ?? []).map((item) => ({ ...item, source: "supabase" }))
    } catch {
      return []
    }
  }

  const local = localItems()
  if (!supabase) return local

  const { data, error } = await supabase
    .from("virtour_state")
    .select("id, data")
    .like("id", `${REMOTE_PUBLISH_PREFIX}%`)
    .order("updated_at", { ascending: false })
    .limit(100)
  if (error) return local

  const remote = (data ?? [])
    .map((row) => itemFromRow(row))
    .filter((item): item is PublishedItem => item !== null)
  const remoteKeys = new Set(remote.flatMap((item) => [item.uid, remotePublishId(item.uid)]))
  return [
    ...remote,
    ...local.filter((item) => !remoteKeys.has(item.uid) && !remoteKeys.has(remotePublishId(item.uid))),
  ]
}

/**
 * Feed "realtime": storage event (tab lain), custom event (publish di tab yang
 * sama), dan subscription Supabase bila klien dikonfigurasi. Di mode server
 * tanpa browser Supabase, lakukan polling ringan sebagai fallback.
 */
export function watchPublishedChanges(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key.startsWith(LOCAL_PUBLISH_KEY)) onChange()
  }
  const onPublished = () => onChange()
  window.addEventListener("storage", onStorage)
  window.addEventListener(PUBLISHED_EVENT, onPublished)

  let channel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null
  if (supabase) {
    channel = supabase
      .channel("virtour360-published-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "virtour_state" }, onChange)
      .subscribe()
  }

  // Realtime Postgres perlu tabel masuk publication; polling cepat tetap
  // membuat feed terasa live bila subscription belum aktif.
  const interval = isServerMode ? 12000 : supabase ? 2500 : 4000
  const timer = window.setInterval(onChange, interval)

  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(PUBLISHED_EVENT, onPublished)
    window.clearInterval(timer)
    if (channel && supabase) void supabase.removeChannel(channel)
  }
}
