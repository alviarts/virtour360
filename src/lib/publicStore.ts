import type { Scene } from "../types/tour"
import type { StudioConfig } from "../types/studio"
import { isServerMode, supabase } from "./supabase"
import { getAuthToken } from "./authToken"

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
  /** UID publish project — dipakai kartu project di portofolio. */
  uid?: string
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
  /** Legacy: hash djb2 pada payload lama. Publish baru memakai gate di server. */
  passwordHash?: string
  /** Server menyembunyikan scene sampai password benar. */
  locked?: boolean
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
const VIEWS_KEY = "virtour360.views"
const REMOTE_VIEW_PREFIX = "virtour:views:"
const LIKES_KEY = "virtour360.likes"
const REMOTE_LIKE_PREFIX = "virtour:likes:"

/** Hitungan view nyata per UID publish — bukan angka dekoratif. */
export function readViewCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(VIEWS_KEY)
    const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : {}
    const out: Record<string, number> = {}
    for (const [key, value] of Object.entries(parsed)) {
      const n = Number(value)
      if (Number.isFinite(n) && n >= 0) out[key] = n
    }
    return out
  } catch {
    return {}
  }
}

/** Dipanggil sekali saat tour publik dibuka. */
export function recordPublicView(uid: string) {
  try {
    const counts = readViewCounts()
    counts[uid] = (counts[uid] ?? 0) + 1
    localStorage.setItem(VIEWS_KEY, JSON.stringify(counts))
    if (supabase) {
      void supabase.from("virtour_state").upsert({
        id: `${REMOTE_VIEW_PREFIX}${uid}`,
        data: { count: counts[uid] },
        updated_at: new Date().toISOString(),
      })
    }
  } catch { /* storage privat: hitungan tetap berlaku untuk sesi ini */ }
}

/** Gabungkan hitungan lokal dengan hitungan Supabase bila tersedia. */
export async function loadViewCounts(uids: string[]): Promise<Record<string, number>> {
  const counts = readViewCounts()
  if (!supabase || !uids.length) return counts
  try {
    const ids = uids.map((uid) => `${REMOTE_VIEW_PREFIX}${uid}`)
    const { data } = await supabase.from("virtour_state").select("id,data").in("id", ids)
    for (const row of data ?? []) {
      const uid = String(row.id ?? "").slice(REMOTE_VIEW_PREFIX.length)
      const stored = row.data as { count?: unknown } | null
      const n = Number(stored?.count)
      if (uid && Number.isFinite(n) && n >= 0) counts[uid] = Math.max(counts[uid] ?? 0, n)
    }
  } catch { /* pakai hitungan lokal */ }
  return counts
}

/** Suka nyata per tour publish — angka portofolio tidak lagi dekoratif. */
export function readLikeCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LIKES_KEY)
    const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : {}
    const out: Record<string, number> = {}
    for (const [key, value] of Object.entries(parsed)) {
      const n = Number(value)
      if (Number.isFinite(n) && n >= 0) out[key] = n
    }
    return out
  } catch {
    return {}
  }
}

/** Dipanggil saat pengunjung menyuka/batalkan suka tour publik. */
export function recordPublicLike(uid: string, liked: boolean) {
  try {
    const counts = readLikeCounts()
    const next = Math.max(0, (counts[uid] ?? 0) + (liked ? 1 : -1))
    counts[uid] = next
    localStorage.setItem(LIKES_KEY, JSON.stringify(counts))
    if (supabase) {
      void supabase.from("virtour_state").upsert({
        id: `${REMOTE_LIKE_PREFIX}${uid}`,
        data: { count: next },
        updated_at: new Date().toISOString(),
      })
    }
  } catch { /* storage privat: hitungan tetap berlaku untuk sesi ini */ }
}

export async function loadLikeCounts(uids: string[]): Promise<Record<string, number>> {
  const counts = readLikeCounts()
  if (!supabase || !uids.length) return counts
  try {
    const ids = uids.map((uid) => `${REMOTE_LIKE_PREFIX}${uid}`)
    const { data } = await supabase.from("virtour_state").select("id,data").in("id", ids)
    for (const row of data ?? []) {
      const uid = String(row.id ?? "").slice(REMOTE_LIKE_PREFIX.length)
      const stored = row.data as { count?: unknown } | null
      const n = Number(stored?.count)
      if (uid && Number.isFinite(n) && n >= 0) counts[uid] = Math.max(counts[uid] ?? 0, n)
    }
  } catch { /* pakai hitungan lokal */ }
  return counts
}

export type PublicMetrics = { views: Record<string, number>; likes: Record<string, number> }

/**
 * Metrik publik. Hitungan lokal langsung dipakai supaya angka muncul seketika,
 * lalu hasil Supabase menggantinya bila tersedia (onUpdate).
 */
export async function loadPublicMetrics(uids: string[], onUpdate?: (metrics: PublicMetrics) => void): Promise<PublicMetrics> {
  const initial: PublicMetrics = { views: readViewCounts(), likes: readLikeCounts() }
  if (supabase && uids.length) {
    void Promise.all([loadViewCounts(uids), loadLikeCounts(uids)])
      .then(([views, likes]) => onUpdate?.({ views, likes }))
      .catch(() => { /* pakai hitungan lokal */ })
  }
  return initial
}

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

export function buildPublicFolders(scenes: Scene[], uid?: string): PublicFolder[] {
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
      uid,
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
        const folderUid = uid ?? json.payload.uid ?? undefined
        const folders = (json.payload.folders?.length ? json.payload.folders : buildPublicFolders(json.payload.scenes, folderUid)).map((folder) => ({
          ...folder,
          uid: folder.uid ?? folderUid,
        }))
        return { ...json.payload, uid: json.payload.uid ?? folderUid, folders }
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
      const folders = (payload.folders?.length ? payload.folders : buildPublicFolders(scenes, payload.uid ?? currentUid ?? undefined)).map((folder) => ({
        ...folder,
        uid: folder.uid ?? payload.uid ?? currentUid ?? undefined,
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
    const folderUid = uid ?? json.payload.uid ?? undefined
    const folders = (json.payload.folders?.length ? json.payload.folders : buildPublicFolders(json.payload.scenes ?? [], folderUid)).map((folder) => ({
      ...folder,
      uid: folder.uid ?? folderUid,
    }))
    return { ...json.payload, uid: json.payload.uid ?? folderUid, folders }
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
  options?: { password?: string },
): Promise<{ ok: boolean; uid: string; error?: string; warning?: string }> {
  const finalUid = uid || payload.slug || payload.uid || makePublicUid()
  if (!isServerMode) {
    try {
      let previous: PublicPayload | null = null
      try {
        const raw = localStorage.getItem(localKey(finalUid))
        if (raw) previous = JSON.parse(raw) as PublicPayload
      } catch { /* abaikan */ }
      const legacyHash = payload.access === "password" && options?.password ? hashPassword(options.password) : undefined
      const finalPayload: PublicPayload = {
        ...payload,
        uid: finalUid,
        slug: payload.slug || finalUid,
        creators: payload.creators?.length ? payload.creators : (previous?.creators ?? []),
        folders: buildPublicFolders(payload.scenes, finalUid),
        // Local mode is demo-only: the hash never leaves this browser.
        ...(legacyHash ? { passwordHash: legacyHash } : { passwordHash: undefined }),
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
    const cleanPayload: PublicPayload = { ...payload, passwordHash: undefined }
    const response = await fetch("/api/public", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        uid: finalUid,
        password: payload.access === "password" ? options?.password : undefined,
        payload: {
          ...cleanPayload,
          uid: finalUid,
          creators: payload.creators?.length ? payload.creators : previous?.creators ?? [],
          folders: buildPublicFolders(payload.scenes, finalUid),
        },
      }),
    })
    if (response.ok) window.dispatchEvent(new CustomEvent(PUBLISHED_EVENT, { detail: { uid: finalUid } }))
    const json = (await response.json().catch(() => ({}))) as { error?: string }
    return { ok: response.ok, uid: finalUid, error: response.ok ? undefined : json.error }
  } catch {
    return { ok: false, uid: finalUid }
  }
}

/**
 * Buka tour berpassword. Server memverifikasi password dan mengirim cookie
 * httpOnly; client tidak pernah menyimpan hash password produksi.
 */
export async function unlockPublicPayload(uid: string, password: string): Promise<boolean> {
  if (!isServerMode) return true // mode lokal memakai hash di browser saja
  try {
    const response = await fetch("/api/public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unlock", uid, password }),
    })
    return response.ok
  } catch {
    return false
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
