import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Hotspot, Scene } from "../types/tour"
import { normalizeStudioConfig, type StudioConfig } from "../types/studio"
import { scenes as staticScenes } from "../data/scenes"
import {
  deleteAsset,
  deleteAssetsForScene,
  clearAllLocalData,
  deletePanorama,
  getAssets,
  getPanoramas,
  saveAsset,
  savePanorama,
  type StoredAsset,
  type StoredPanorama,
} from "../lib/db"
import { isRemote, isServerMode } from "../lib/supabase"
import {
  isAuthRemote,
  remoteChangePassword,
  remoteSignIn,
  remoteSignUp,
  remoteUpdateProfile,
  remoteValidateSession,
} from "../lib/authRemote"
import { getAuthToken, setAuthToken } from "../lib/authToken"
import { makePublicUid } from "../lib/publicStore"
import { normalizeEffects, type SceneEffects } from "../lib/effects"
import {
  loadRemoteState,
  removePanoramaFile,
  saveRemoteState,
  uploadPanoramaFile,
  type RemotePanorama,
} from "../lib/remoteStore"

export interface User {
  name: string
  email: string
  initials: string
  /** UID publik pembuat, dibuat saat mendaftar — dipakai link profile. */
  uid?: string
}

/** Project dibuat dari Dashboard sebelum masuk Studio. */
export interface Project {
  id: string
  name: string
  category: string
  status: "draft" | "review" | "published"
  createdAt: number
  /** UID publish unik per project — mencegah project lain menimpa link ini. */
  publishedUid?: string
}

/** Jejak aktivitas supaya perubahan terlihat (weblog lokal). */
export interface ActivityEntry {
  id: string
  text: string
  at: number
}

interface StoredUser extends User {
  password: string
}

interface SceneMedia {
  panorama?: string
  thumbnail?: string
}

interface SceneAudio {
  url: string
  name: string
}

export interface AppContextValue {
  user: User | null
  demoMode: boolean
  setDemoMode: (value: boolean) => void
  /** Identitas tamu stabil (tanpa login) */
  guestId: string
  isGuest: boolean
  register: (name: string, email: string, password: string) => Promise<string | null>
  login: (email: string, password: string) => Promise<string | null>
  logout: () => void
  updateProfile: (name: string, email: string) => Promise<string | null>
  changePassword: (current: string, next: string) => Promise<string | null>

  panoramas: StoredPanorama[]
  addPanorama: (name: string, file: File) => Promise<void>
  removePanorama: (id: string) => Promise<void>

  scenes: Scene[]
  /** Scene milik project tertentu — dipakai Dashboard & portofolio tanpa mengubah project aktif. */
  getProjectScenes: (projectId: string) => Scene[]
  activeSceneId: string
  setActiveSceneId: (id: string) => void

  addHotspot: (sceneId: string, spot: Hotspot) => void
  updateHotspot: (sceneId: string, id: string, patch: Partial<Hotspot>) => void
  removeHotspot: (sceneId: string, id: string) => void
  undoEdit: () => void
  canUndo: boolean

  captureThumbnail: (sceneId: string, source: string) => void
  setMediaFromScene: (targetId: string, source: Scene) => void
  replaceSceneImage: (sceneId: string, file: File) => Promise<void>
  removeSceneMediaOverride: (sceneId: string) => void
  setSceneAudio: (sceneId: string, file: File) => Promise<void>
  removeSceneAudio: (sceneId: string) => Promise<void>
  audioByScene: Record<string, SceneAudio>

  favorites: string[]
  toggleFavorite: (id: string) => void

  effectsByScene: Record<string, SceneEffects>
  setSceneEffects: (sceneId: string, patch: Partial<SceneEffects>) => void
  resetSceneEffects: (sceneId: string) => void

  groups: string[]
  createGroup: (name: string) => void
  renameGroup: (oldName: string, newName: string) => void
  deleteGroup: (name: string) => void
  setSceneGroup: (sceneId: string, group: string) => void
  moveScene: (sceneId: string, direction: -1 | 1) => void
  imageQuality: "standard" | "high" | "original"
  setImageQuality: (value: "standard" | "high" | "original") => void

  /** Konfigurasi Studio ala platform referensi (Design / CMS / Marketing / Setting). */
  studioConfig: StudioConfig
  updateStudioConfig: (patch: Partial<StudioConfig>) => void
  resetStudioConfig: () => void

  /** Project & kategori — Dashboard adalah gerbang sebelum Studio. */
  projects: Project[]
  activeProject: Project | null
  createProject: (name: string, category: string) => Project
  setActiveProject: (id: string) => void
  removeProject: (id: string) => void
  setProjectStatus: (id: string, status: Project["status"]) => void
  setProjectPublishedUid: (id: string, uid: string) => void

  activity: ActivityEntry[]
  logActivity: (text: string) => void
  clearActivity: () => void

  /** Grup yang dipilih saat menekan Add Scene — dipakai scene baru. */
  pendingGroup: string | null
  setPendingGroup: (group: string | null) => void

  authOpen: boolean
  authMode: "login" | "register"
  setAuthOpen: (open: boolean, mode?: "login" | "register") => void
  uploadOpen: boolean
  setUploadOpen: (open: boolean) => void
  replaceSceneId: string | null
  setReplaceSceneId: (id: string | null) => void

  toast: string | null
  notify: (message: string) => void
}

export const AppContext = createContext<AppContextValue | null>(null)

const USERS_KEY = "virtour360.users"
const SESSION_KEY = "virtour360.session"
const GUEST_KEY = "virtour360.guestId"
const DEMO_KEY = "virtour360.demo"
const OWNER_KEY = "virtour360.owner"
const HOTSPOTS_KEY = "virtour360.hotspots"
const MEDIA_KEY = "virtour360.media"
const FAVORITES_KEY = "virtour360.favorites"
const EFFECTS_KEY = "virtour360.effects"
const GROUPS_KEY = "virtour360.groups"
const ORDER_KEY = "virtour360.sceneOrder"
const SCENE_GROUP_KEY = "virtour360.sceneGroups"
const QUALITY_KEY = "virtour360.imageQuality"
const STUDIO_CONFIG_KEY = "virtour360.studioConfig"
const PROJECTS_KEY = "virtour360.projects"
const ACTIVE_PROJECT_KEY = "virtour360.activeProject"
const ACTIVITY_KEY = "virtour360.activity"
const PANORAMA_GROUP_KEY = "virtour360.panoramaGroups"

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* localStorage penuh / diblokir — abaikan */
  }
}

function readUsers(): StoredUser[] {
  return readJSON<StoredUser[]>(USERS_KEY, [])
}

function makeInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U"
}

/** Kirim aksi auth ke server; kredensial & hash password tidak pernah di browser. */
async function authRequest(action: string, payload: Record<string, unknown>) {
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ action, ...payload }),
    })
    const json = (await response.json()) as { error?: string; token?: string; user?: User }
    return { ok: response.ok, ...json }
  } catch {
    return { ok: false, error: "Gagal terhubung ke server." }
  }
}

/**
 * Akun berbeda tidak boleh mewarisi scene/hotspot/audio akun sebelumnya.
 * Bersihkan data lokal bila pemiliknya berubah.
 */
async function resetWorkspaceIfOwnerChanged(email: string): Promise<boolean> {
  const previous = localStorage.getItem(OWNER_KEY)
  localStorage.setItem(OWNER_KEY, email)
  if (!previous || previous === email) return false
  ;[HOTSPOTS_KEY, MEDIA_KEY, FAVORITES_KEY, EFFECTS_KEY, GROUPS_KEY, ORDER_KEY, SCENE_GROUP_KEY, QUALITY_KEY, STUDIO_CONFIG_KEY, PROJECTS_KEY, ACTIVE_PROJECT_KEY].forEach((key) => localStorage.removeItem(key))
  try {
    await clearAllLocalData()
  } catch {
    /* abaikan */
  }
  return true
}

/** Identitas tamu stabil di browser ini — tidak perlu login. */
function getGuestId(): string {
  let id = localStorage.getItem(GUEST_KEY)
  if (!id) {
    id = `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(GUEST_KEY, id)
  }
  return id
}

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

/** URL statis (／media/…) aman disimpan; blob: hanya berlaku pada sesi ini. */
function persistableMedia(media: Record<string, SceneMedia>): Record<string, SceneMedia> {
  const out: Record<string, SceneMedia> = {}
  for (const [id, value] of Object.entries(media)) {
    const next: SceneMedia = {}
    if (value.panorama && !value.panorama.startsWith("blob:")) next.panorama = value.panorama
    if (value.thumbnail && !value.thumbnail.startsWith("blob:")) next.thumbnail = value.thumbnail
    if (Object.keys(next).length) out[id] = next
  }
  return out
}

/** Thumbnail kecil berbentuk data URL — tahan refresh (blob: tidak). */
async function makeThumbnail(blob: Blob): Promise<string | undefined> {
  try {
    if (typeof createImageBitmap !== "function") return undefined
    const bitmap = await createImageBitmap(blob)
    const width = 320
    const height = Math.max(1, Math.min(200, Math.round((bitmap.height / bitmap.width) * width)))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return undefined
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()
    return canvas.toDataURL("image/jpeg", 0.7)
  } catch {
    return undefined
  }
}

const urlCache = new Map<string, string>()
function objectUrl(item: StoredPanorama) {
  if (item.url) return item.url
  const cached = urlCache.get(item.id)
  if (cached) return cached
  const url = URL.createObjectURL(item.blob)
  urlCache.set(item.id, url)
  return url
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readJSON<User | null>(SESSION_KEY, null))
  const [demoMode, setDemoModeState] = useState(() => sessionStorage.getItem(DEMO_KEY) === "1")
  const setDemoMode = useCallback((value: boolean) => {
    if (value) sessionStorage.setItem(DEMO_KEY, "1")
    else sessionStorage.removeItem(DEMO_KEY)
    setDemoModeState(value)
  }, [])
  const [guestId] = useState(getGuestId)
  const [panoramas, setPanoramas] = useState<StoredPanorama[]>([])
  const [hotspotOverrides, setHotspotOverrides] = useState<Record<string, Hotspot[]>>(() =>
    readJSON<Record<string, Hotspot[]>>(HOTSPOTS_KEY, {}),
  )
  const [mediaOverrides, setMediaOverrides] = useState<Record<string, SceneMedia>>(() =>
    persistableMedia(readJSON<Record<string, SceneMedia>>(MEDIA_KEY, {})),
  )
  const [favorites, setFavorites] = useState<string[]>(() => readJSON<string[]>(FAVORITES_KEY, []))
  const [effectsByScene, setEffectsByScene] = useState<Record<string, SceneEffects>>(() =>
    readJSON<Record<string, SceneEffects>>(EFFECTS_KEY, {}),
  )
  const [groups, setGroups] = useState<string[]>(() => readJSON<string[]>(GROUPS_KEY, ["Uncategory"]))
  const [sceneOrder, setSceneOrder] = useState<Record<string, number>>(() =>
    readJSON<Record<string, number>>(ORDER_KEY, {}),
  )
  const [sceneGroupOverrides, setSceneGroupOverrides] = useState<Record<string, string>>(() =>
    readJSON<Record<string, string>>(SCENE_GROUP_KEY, {}),
  )
  const [imageQuality, setImageQualityState] = useState<"standard" | "high" | "original">(() =>
    readJSON(QUALITY_KEY, "standard"),
  )
  const setImageQuality = useCallback((value: "standard" | "high" | "original") => {
    setImageQualityState(value)
    persist(QUALITY_KEY, value)
  }, [])
  const [studioConfig, setStudioConfig] = useState<StudioConfig>(() =>
    normalizeStudioConfig(readJSON<Partial<StudioConfig> | null>(STUDIO_CONFIG_KEY, null)),
  )
  const updateStudioConfig = useCallback((patch: Partial<StudioConfig>) => {
    setStudioConfig((prev) => {
      const next = normalizeStudioConfig({ ...prev, ...patch })
      persist(STUDIO_CONFIG_KEY, next)
      return next
    })
  }, [])
  const resetStudioConfig = useCallback(() => {
    const next = normalizeStudioConfig(null)
    setStudioConfig(next)
    persist(STUDIO_CONFIG_KEY, next)
  }, [])

  /* ------------------------------- Project -------------------------------- */
  const [projects, setProjects] = useState<Project[]>(() => readJSON<Project[]>(PROJECTS_KEY, []))
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => localStorage.getItem(ACTIVE_PROJECT_KEY))
  const [pendingGroup, setPendingGroup] = useState<string | null>(null)
  const [panoramaGroups, setPanoramaGroups] = useState<Record<string, string>>(() =>
    readJSON<Record<string, string>>(PANORAMA_GROUP_KEY, {}),
  )
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null

  const [activity, setActivity] = useState<ActivityEntry[]>(() => readJSON<ActivityEntry[]>(ACTIVITY_KEY, []))
  const logActivity = useCallback((text: string) => {
    setActivity((prev) => {
      const next = [{ id: uid("act"), text, at: Date.now() }, ...prev].slice(0, 30)
      persist(ACTIVITY_KEY, next)
      return next
    })
  }, [])
  const clearActivity = useCallback(() => {
    setActivity([])
    persist(ACTIVITY_KEY, [])
  }, [])

  const createProject = useCallback((name: string, category: string): Project => {
    const project: Project = {
      id: `prj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || "Project baru",
      category: category.trim() || "360°",
      status: "draft",
      createdAt: Date.now(),
    }
    setProjects((prev) => {
      const next = [project, ...prev]
      persist(PROJECTS_KEY, next)
      return next
    })
    setActiveProjectId(project.id)
    localStorage.setItem(ACTIVE_PROJECT_KEY, project.id)
    logActivity(`Project "${project.name}" dibuat · ${project.category}`)
    return project
  }, [logActivity])

  const setActiveProject = useCallback((id: string) => {
    setActiveProjectId(id)
    localStorage.setItem(ACTIVE_PROJECT_KEY, id)
  }, [])

  const removeProject = useCallback((id: string) => {
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id)
      persist(PROJECTS_KEY, next)
      return next
    })
    if (activeProjectId === id) {
      setActiveProjectId(null)
      localStorage.removeItem(ACTIVE_PROJECT_KEY)
    }
    logActivity("Project dihapus")
  }, [activeProjectId, logActivity])

  const setProjectStatus = useCallback((id: string, status: Project["status"]) => {
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, status } : p))
      persist(PROJECTS_KEY, next)
      return next
    })
    logActivity(`Status project diubah menjadi ${status}`)
  }, [logActivity])

  const setProjectPublishedUid = useCallback((id: string, publishedUid: string) => {
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, publishedUid, status: "published" as const } : p))
      persist(PROJECTS_KEY, next)
      return next
    })
    localStorage.setItem("virtour360.publishedUid", publishedUid)
  }, [])

  const [activeSceneId, setActiveSceneId] = useState<string>("atrium")
  const [audioByScene, setAudioByScene] = useState<Record<string, SceneAudio>>({})
  const [assetMedia, setAssetMedia] = useState<Record<string, SceneMedia>>({})
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const openAuth = useCallback((open: boolean, mode: "login" | "register" = "login") => {
    setAuthMode(mode)
    setAuthOpen(open)
  }, [])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [replaceSceneId, setReplaceSceneId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [remoteReady, setRemoteReady] = useState(!isRemote)

  /** State remote dipisah per identitas: user login atau tamu. */
  const identityKey = user
    ? `user:${user.email.toLowerCase()}`
    : `guest:${guestId}`

  const assetsRef = useRef<StoredAsset[]>([])
  const assetUrls = useRef<Map<string, string>>(new Map())
  const hotspotsRef = useRef(hotspotOverrides)
  const historyRef = useRef<Record<string, Hotspot[]>[]>([])
  const toastTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    hotspotsRef.current = hotspotOverrides
  }, [hotspotOverrides])

  const notify = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  // Pulihkan sesi login dari database saat halaman dimuat.
  useEffect(() => {
    if (!isServerMode || !getAuthToken()) return
    fetch("/api/auth", { headers: { Authorization: `Bearer ${getAuthToken()}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const restored = json?.user as User | undefined
        if (restored) {
          setUser(restored)
          localStorage.setItem(SESSION_KEY, JSON.stringify(restored))
        } else {
          setAuthToken("")
        }
      })
      .catch(() => setAuthToken(""))
  }, [])

  // Sesi lokal hanya cermin akun Supabase: validasi saat mount supaya akun
  // yang dihapus di Supabase tidak tetap login di browser.
  useEffect(() => {
    if (!isAuthRemote()) return
    const cached = readJSON<User | null>(SESSION_KEY, null)
    if (!cached?.email) return
    let alive = true
    void remoteValidateSession(cached.email)
      .then((valid) => {
        if (alive && !valid) {
          localStorage.removeItem(SESSION_KEY)
          setUser(null)
        }
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    getPanoramas()
      .then(setPanoramas)
      .catch(() => undefined)
    getAssets()
      .then((assets) => {
        assetsRef.current = assets
        const audio: Record<string, SceneAudio> = {}
        const media: Record<string, SceneMedia> = {}
        assets.forEach((asset) => {
          const url = URL.createObjectURL(asset.blob)
          assetUrls.current.set(asset.id, url)
          if (asset.kind === "audio") audio[asset.sceneId] = { url, name: asset.name }
          else media[asset.sceneId] = { panorama: url, thumbnail: url }
        })
        setAudioByScene(audio)
        setAssetMedia(media)
      })
      .catch(() => undefined)
  }, [])

  /* ------------------------- Sinkronisasi Supabase ------------------------ */

  useEffect(() => {
    if (!isRemote) return
    let alive = true
    setRemoteReady(false)
    loadRemoteState(identityKey)
      .then((remote) => {
        if (!alive || !remote) return
        // Mode klien memakai akun localStorage. Jangan timpa dengan data remote
        // (password lokal plaintext tidak pernah dikirim ke Supabase).
        if (isServerMode && remote.users.length) localStorage.setItem(USERS_KEY, JSON.stringify(remote.users))
        setHotspotOverrides(remote.hotspots)
        persist(HOTSPOTS_KEY, remote.hotspots)
        setFavorites(remote.favorites)
        persist(FAVORITES_KEY, remote.favorites)
        setMediaOverrides(remote.media)
        persist(MEDIA_KEY, remote.media)
        if (remote.effects) {
          setEffectsByScene(remote.effects)
          persist(EFFECTS_KEY, remote.effects)
        }
        if (remote.groups?.length) { setGroups(remote.groups); persist(GROUPS_KEY, remote.groups) }
        if (remote.sceneGroups) { setSceneGroupOverrides(remote.sceneGroups); persist(SCENE_GROUP_KEY, remote.sceneGroups) }
        if (remote.sceneOrder) { setSceneOrder(remote.sceneOrder); persist(ORDER_KEY, remote.sceneOrder) }
        if (remote.imageQuality) { setImageQualityState(remote.imageQuality as typeof imageQuality); persist(QUALITY_KEY, remote.imageQuality) }
        if (remote.studioConfig) {
          const nextConfig = normalizeStudioConfig(remote.studioConfig)
          setStudioConfig(nextConfig)
          persist(STUDIO_CONFIG_KEY, nextConfig)
        }
        if (remote.panoramas.length) {
          setPanoramas(
            remote.panoramas.map((p) => ({
              id: p.id,
              name: p.name,
              url: p.url,
              createdAt: p.createdAt,
              blob: new Blob([]),
            })),
          )
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setRemoteReady(true)
      })
    return () => {
      alive = false
    }
  }, [identityKey])

  useEffect(() => {
    if (!isRemote || !remoteReady) return
    const timer = window.setTimeout(() => {
      saveRemoteState(identityKey, {
        // Akun lokal tidak disinkron: readUsers() memuat password plaintext.
        users: isServerMode ? readUsers() : [],
        hotspots: hotspotOverrides,
        favorites,
        media: persistableMedia(mediaOverrides),
        effects: effectsByScene,
        groups,
        sceneGroups: sceneGroupOverrides,
        sceneOrder,
        imageQuality,
        studioConfig,
        // Hanya sinkron panorama yang punya public URL. Blob URL lokal tidak
        // berguna di perangkat lain dan akan menampilkan gambar rusak.
        panoramas: panoramas
          .filter((p) => Boolean(p.url))
          .map<RemotePanorama>((p) => ({
            id: p.id,
            name: p.name,
            url: p.url ?? "",
            createdAt: p.createdAt,
          })),
      }).catch(() => undefined)
    }, 800)
    return () => window.clearTimeout(timer)
  }, [remoteReady, identityKey, hotspotOverrides, favorites, mediaOverrides, effectsByScene, groups, sceneGroupOverrides, sceneOrder, imageQuality, studioConfig, panoramas, user])

  useEffect(() => {
    return () => {
      assetUrls.current.forEach((url) => URL.revokeObjectURL(url))
      assetUrls.current.clear()
      urlCache.forEach((url) => URL.revokeObjectURL(url))
      // Kosongkan cache: StrictMode menjalankan cleanup saat mount pertama.
      // Tanpa ini, mount kedua memakai blob URL yang sudah di-revoke.
      urlCache.clear()
    }
  }, [])

  /* ---------------------------------- Auth --------------------------------- */

  const register = useCallback(async (name: string, email: string, password: string) => {
    if (isServerMode) {
      const result = await authRequest("register", { name, email, password })
      if (!result.ok) return result.error || "Gagal mendaftar."
      if (result.token) setAuthToken(result.token)
      const session = result.user as User
      const didReset = await resetWorkspaceIfOwnerChanged(session.email)
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setUser(session)
      if (didReset) {
        setPanoramas([])
        setHotspotOverrides({})
        setMediaOverrides({})
        setFavorites([])
        setEffectsByScene({})
      }
      return null
    }
    if (isAuthRemote()) {
      if (password.length < 6) return "Password minimal 6 karakter."
      const result = await remoteSignUp(name, email, password)
      if (!result.ok || !result.user) return result.error || "Gagal mendaftar."
      const didReset = await resetWorkspaceIfOwnerChanged(result.user.email)
      persist(SESSION_KEY, result.user)
      setUser(result.user)
      // Akun lokal lama tidak diperlukan lagi — semua kredensial ada di Supabase.
      localStorage.removeItem(USERS_KEY)
      if (didReset) {
        setPanoramas([])
        setHotspotOverrides({})
        setMediaOverrides({})
        setFavorites([])
        setEffectsByScene({})
        setGroups(["Uncategory"])
        setSceneOrder({})
        setSceneGroupOverrides({})
        setImageQualityState("standard")
        setStudioConfig(normalizeStudioConfig(null))
        setProjects([])
        setActiveProjectId(null)
        localStorage.removeItem(ACTIVE_PROJECT_KEY)
      }
      return null
    }
    const users = readUsers()
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return "Email sudah terdaftar. Silakan login."
    }
    if (password.length < 6) return "Password minimal 6 karakter."
    const next: StoredUser = { name: name.trim(), email: email.trim(), password, initials: makeInitials(name), uid: makePublicUid() }
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, next]))
    const session: User = { name: next.name, email: next.email, initials: next.initials, uid: next.uid }
    const didReset = await resetWorkspaceIfOwnerChanged(session.email)
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
    if (didReset) {
      setPanoramas([])
      setHotspotOverrides({})
      setMediaOverrides({})
      setFavorites([])
      setEffectsByScene({})
      setGroups(["Uncategory"])
      setSceneOrder({})
      setSceneGroupOverrides({})
      setImageQualityState("standard")
      setStudioConfig(normalizeStudioConfig(null))
      setProjects([])
      setActiveProjectId(null)
      localStorage.removeItem(ACTIVE_PROJECT_KEY)
    }
    return null
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    if (isServerMode) {
      const result = await authRequest("login", { email, password })
      if (!result.ok) return result.error || "Gagal masuk."
      if (result.token) setAuthToken(result.token)
      const session = result.user as User
      const didReset = await resetWorkspaceIfOwnerChanged(session.email)
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setUser(session)
      if (didReset) {
        setPanoramas([])
        setHotspotOverrides({})
        setMediaOverrides({})
        setFavorites([])
        setEffectsByScene({})
      }
      return null
    }
    if (isAuthRemote()) {
      let result = await remoteSignIn(email, password)
      if (!result.ok) {
        // Migrasi sekali: akun lokal lama dipindah ke tabel Supabase.
        const legacy = readUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
        if (legacy && legacy.password === password) {
          const migrated = await remoteSignUp(legacy.name, legacy.email, password, legacy.uid)
          if (migrated.ok && migrated.user) result = migrated
        }
      }
      if (!result.ok || !result.user) return result.error || "Gagal masuk."
      const session: User = result.user
      const didReset = await resetWorkspaceIfOwnerChanged(session.email)
      persist(SESSION_KEY, session)
      setUser(session)
      localStorage.removeItem(USERS_KEY)
      if (didReset) {
        setPanoramas([])
        setHotspotOverrides({})
        setMediaOverrides({})
        setFavorites([])
        setEffectsByScene({})
        setGroups(["Uncategory"])
        setSceneOrder({})
        setSceneGroupOverrides({})
        setImageQualityState("standard")
        setStudioConfig(normalizeStudioConfig(null))
        setProjects([])
        setActiveProjectId(null)
        localStorage.removeItem(ACTIVE_PROJECT_KEY)
      }
      return null
    }
    const found = readUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!found) return "Akun tidak ditemukan. Silakan daftar dulu."
    if (found.password !== password) return "Password salah."
    const resolvedUid = found.uid ?? makePublicUid()
    if (!found.uid) {
      localStorage.setItem(
        USERS_KEY,
        JSON.stringify(readUsers().map((u) => (u.email === found.email ? { ...u, uid: resolvedUid } : u))),
      )
    }
    const session: User = { name: found.name, email: found.email, initials: found.initials, uid: resolvedUid }
    const didReset = await resetWorkspaceIfOwnerChanged(session.email)
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
    if (didReset) {
      setPanoramas([])
      setHotspotOverrides({})
      setMediaOverrides({})
      setFavorites([])
      setEffectsByScene({})
      setGroups(["Uncategory"])
      setSceneOrder({})
      setSceneGroupOverrides({})
      setImageQualityState("standard")
      setStudioConfig(normalizeStudioConfig(null))
      setProjects([])
      setActiveProjectId(null)
      localStorage.removeItem(ACTIVE_PROJECT_KEY)
    }
    return null
  }, [])

  const logout = useCallback(() => {
    setAuthToken("")
    localStorage.removeItem(SESSION_KEY)
    // Kredensial tidak pernah disimpan lokal saat mode Supabase aktif.
    if (isAuthRemote()) localStorage.removeItem(USERS_KEY)
    setUser(null)
  }, [])

  const updateProfile = useCallback(
    async (name: string, email: string) => {
      if (!user) return "Anda belum login."
      if (isServerMode) {
        const result = await authRequest("profile", { name, email })
        if (!result.ok) return result.error || "Gagal menyimpan profil."
        if (result.token) setAuthToken(result.token)
        const session = result.user as User
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        setUser(session)
        return null
      }
      if (name.trim().length < 2) return "Nama minimal 2 karakter."
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Format email tidak valid."
      if (isAuthRemote()) {
        const result = await remoteUpdateProfile(user.email, name, email)
        if (!result.ok || !result.user) return result.error || "Gagal menyimpan profil."
        persist(SESSION_KEY, result.user)
        setUser(result.user)
        if (result.message) notify(result.message)
        return null
      }
      const users = readUsers()
      if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.email !== user.email)) {
        return "Email sudah dipakai akun lain."
      }
      const nextUsers = users.map((u) =>
        u.email === user.email
          ? { ...u, name: name.trim(), email: email.trim(), initials: makeInitials(name) }
          : u,
      )
      localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers))
      const session: User = {
        name: name.trim(),
        email: email.trim(),
        initials: makeInitials(name),
        uid: user.uid,
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setUser(session)
      return null
    },
    [user, notify],
  )

  const changePassword = useCallback(
    async (current: string, next: string) => {
      if (!user) return "Anda belum login."
      if (isServerMode) {
        const result = await authRequest("password", { current, next })
        if (!result.ok) return result.error || "Gagal mengubah password."
        return null
      }
      if (next.length < 6) return "Password baru minimal 6 karakter."
      if (isAuthRemote()) {
        const result = await remoteChangePassword(user.email, current, next)
        if (!result.ok) return result.error || "Gagal mengubah password."
        notify("Password berhasil diperbarui.")
        return null
      }
      const users = readUsers()
      const index = users.findIndex((u) => u.email === user.email)
      if (index < 0) return "Akun tidak ditemukan."
      if (users[index].password !== current) return "Password lama salah."
      users[index] = { ...users[index], password: next }
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
      return null
    },
    [user, notify],
  )

  /* ------------------------------- Panorama -------------------------------- */

  const addPanorama = useCallback(
    async (name: string, file: File) => {
      const item: StoredPanorama = {
        id: uid("pano"),
        name: name.trim() || file.name.replace(/\.[^.]+$/, ""),
        blob: file,
        createdAt: Date.now(),
        projectId: activeProject?.id,
        thumbnail: await makeThumbnail(file),
      }
      if (isRemote) {
        try {
          const url = await uploadPanoramaFile(item.id, file)
          if (url) item.url = url
        } catch {
          notify("Upload cloud gagal — panorama tetap tersimpan di browser ini.")
        }
      }
      const group = pendingGroup?.trim() || "Uncategory"
      setPanoramaGroups((prev) => {
        const next = { ...prev, [item.id]: group }
        persist(PANORAMA_GROUP_KEY, next)
        return next
      })
      setPendingGroup(null)
      logActivity(`Scene "${item.name}" ditambahkan ke grup ${group}`)
      await savePanorama(item)
      setPanoramas((prev) => [item, ...prev])
    },
    [notify, pendingGroup, logActivity, activeProject],
  )

  const removePanorama = useCallback(
    async (id: string) => {
      const target = panoramas.find((p) => p.id === id)
      if (target?.url) await removePanoramaFile(target.url).catch(() => undefined)
      await deletePanorama(id)
    await deleteAssetsForScene(id)
    assetsRef.current
      .filter((a) => a.sceneId === id)
      .forEach((a) => {
        const url = assetUrls.current.get(a.id)
        if (url) URL.revokeObjectURL(url)
        assetUrls.current.delete(a.id)
      })
    assetsRef.current = assetsRef.current.filter((a) => a.sceneId !== id)
    const url = urlCache.get(id)
    if (url) URL.revokeObjectURL(url)
    urlCache.delete(id)
    setPanoramas((prev) => prev.filter((p) => p.id !== id))
    setAudioByScene((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setAssetMedia((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setMediaOverrides((prev) => {
      const next = { ...prev }
      delete next[id]
      persist(MEDIA_KEY, persistableMedia(next))
      return next
    })
    },
    [panoramas],
  )

  /* ------------------------------- Hotspot --------------------------------- */

  const commitHotspots = useCallback((next: Record<string, Hotspot[]>) => {
    historyRef.current = [...historyRef.current.slice(-19), hotspotsRef.current]
    hotspotsRef.current = next
    setHotspotOverrides(next)
    setCanUndo(true)
    persist(HOTSPOTS_KEY, next)
  }, [])

  const addHotspot = useCallback(
    (sceneId: string, spot: Hotspot) => {
      const base = hotspotsRef.current[sceneId] ?? staticScenes.find((s) => s.id === sceneId)?.hotspots ?? []
      commitHotspots({ ...hotspotsRef.current, [sceneId]: [...base, spot] })
    },
    [commitHotspots],
  )

  const updateHotspot = useCallback(
    (sceneId: string, id: string, patch: Partial<Hotspot>) => {
      const base = hotspotsRef.current[sceneId] ?? staticScenes.find((s) => s.id === sceneId)?.hotspots ?? []
      commitHotspots({
        ...hotspotsRef.current,
        [sceneId]: base.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      })
    },
    [commitHotspots],
  )

  const removeHotspot = useCallback(
    (sceneId: string, id: string) => {
      const base = hotspotsRef.current[sceneId] ?? staticScenes.find((s) => s.id === sceneId)?.hotspots ?? []
      commitHotspots({
        ...hotspotsRef.current,
        [sceneId]: base.filter((h) => h.id !== id),
      })
    },
    [commitHotspots],
  )

  const undoEdit = useCallback(() => {
    const previous = historyRef.current.pop()
    if (!previous) {
      notify("Tidak ada perubahan yang bisa dibatalkan.")
      return
    }
    hotspotsRef.current = previous
    setHotspotOverrides(previous)
    setCanUndo(historyRef.current.length > 0)
    persist(HOTSPOTS_KEY, previous)
    notify("Perubahan terakhir dibatalkan.")
  }, [notify])

  /* --------------------------- Media & audio ------------------------------- */

  const setMedia = useCallback((sceneId: string, patch: SceneMedia, remove = false) => {
    setMediaOverrides((prev) => {
      const next = { ...prev }
      if (remove) delete next[sceneId]
      else next[sceneId] = { ...prev[sceneId], ...patch }
      persist(MEDIA_KEY, persistableMedia(next))
      return next
    })
  }, [])

  const captureThumbnail = useCallback(
    (sceneId: string, source: string) => setMedia(sceneId, { thumbnail: source }),
    [setMedia],
  )

  const setMediaFromScene = useCallback(
    (targetId: string, source: Scene) => setMedia(targetId, { panorama: source.panorama, thumbnail: source.thumbnail }),
    [setMedia],
  )

  const removeSceneMediaOverride = useCallback((sceneId: string) => {
    setMediaOverrides((prev) => {
      const next = { ...prev }
      delete next[sceneId]
      persist(MEDIA_KEY, persistableMedia(next))
      return next
    })
    const asset = assetsRef.current.find((a) => a.sceneId === sceneId && a.kind === "image")
    if (!asset) return
    const url = assetUrls.current.get(asset.id)
    if (url) URL.revokeObjectURL(url)
    assetUrls.current.delete(asset.id)
    void deleteAsset(asset.id).catch(() => undefined)
    assetsRef.current = assetsRef.current.filter((a) => a.id !== asset.id)
    setAssetMedia((prev) => {
      const next = { ...prev }
      delete next[sceneId]
      return next
    })
  }, [])

  const replaceSceneImage = useCallback(
    async (sceneId: string, file: File) => {
      const previousAudio = assetsRef.current.find((a) => a.sceneId === sceneId && a.kind === "image")
      if (previousAudio) {
        const url = assetUrls.current.get(previousAudio.id)
        if (url) URL.revokeObjectURL(url)
        assetUrls.current.delete(previousAudio.id)
        await deleteAsset(previousAudio.id)
        assetsRef.current = assetsRef.current.filter((a) => a.id !== previousAudio.id)
      }
      const asset: StoredAsset = {
        id: uid("asset"),
        sceneId,
        kind: "image",
        name: file.name,
        blob: file,
        createdAt: Date.now(),
        projectId: activeProject?.id,
      }
      await saveAsset(asset)
      assetsRef.current = [asset, ...assetsRef.current]
      assetUrls.current.set(asset.id, URL.createObjectURL(asset.blob))
      setAssetMedia((prev) => ({ ...prev, [sceneId]: { panorama: assetUrls.current.get(asset.id), thumbnail: assetUrls.current.get(asset.id) } }))
      setMediaOverrides((prev) => {
        const next = { ...prev }
        delete next[sceneId]
        persist(MEDIA_KEY, persistableMedia(next))
        return next
      })
    },
    [activeProject],
  )

  const setSceneAudio = useCallback(async (sceneId: string, file: File) => {
    const previous = assetsRef.current.find((a) => a.sceneId === sceneId && a.kind === "audio")
    if (previous) {
      const url = assetUrls.current.get(previous.id)
      if (url) URL.revokeObjectURL(url)
      assetUrls.current.delete(previous.id)
      await deleteAsset(previous.id)
      assetsRef.current = assetsRef.current.filter((a) => a.id !== previous.id)
    }
    const asset: StoredAsset = {
      id: uid("asset"),
      sceneId,
      kind: "audio",
      name: file.name,
      blob: file,
      createdAt: Date.now(),
      projectId: activeProject?.id,
    }
    await saveAsset(asset)
    assetsRef.current = [asset, ...assetsRef.current]
    const url = URL.createObjectURL(asset.blob)
    assetUrls.current.set(asset.id, url)
    setAudioByScene((prev) => ({ ...prev, [sceneId]: { url, name: asset.name } }))
  }, [activeProject])

  const removeSceneAudio = useCallback(async (sceneId: string) => {
    const asset = assetsRef.current.find((a) => a.sceneId === sceneId && a.kind === "audio")
    if (asset) {
      const url = assetUrls.current.get(asset.id)
      if (url) URL.revokeObjectURL(url)
      assetUrls.current.delete(asset.id)
      await deleteAsset(asset.id)
      assetsRef.current = assetsRef.current.filter((a) => a.id !== asset.id)
    }
    setAudioByScene((prev) => {
      const next = { ...prev }
      delete next[sceneId]
      return next
    })
  }, [])

  /* ------------------------------- Favorites -------------------------------- */

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
      persist(FAVORITES_KEY, next)
      return next
    })
  }, [])

  /* ------------------------------- Effects ----------------------------------- */

  const setSceneEffects = useCallback((sceneId: string, patch: Partial<SceneEffects>) => {
    setEffectsByScene((prev) => {
      const next = { ...prev, [sceneId]: normalizeEffects({ ...prev[sceneId], ...patch }) }
      persist(EFFECTS_KEY, next)
      return next
    })
  }, [])

  const resetSceneEffects = useCallback((sceneId: string) => {
    setEffectsByScene((prev) => {
      const next = { ...prev }
      delete next[sceneId]
      persist(EFFECTS_KEY, next)
      return next
    })
  }, [])

  /* -------------------------- Groups & scene order --------------------------- */

  const createGroup = useCallback((name: string) => {
    const clean = name.trim()
    if (!clean) return
    setGroups((prev) => {
      if (prev.includes(clean)) return prev
      const next = [...prev, clean]
      persist(GROUPS_KEY, next)
      return next
    })
  }, [])

  const renameGroup = useCallback((oldName: string, newName: string) => {
    const clean = newName.trim()
    if (!clean || clean === oldName) return
    setGroups((prev) => {
      const next = prev.map((g) => (g === oldName ? clean : g))
      persist(GROUPS_KEY, next)
      return next
    })
    setSceneGroupOverrides((prev) => {
      const next = Object.fromEntries(
        Object.entries(prev).map(([id, group]) => [id, group === oldName ? clean : group]),
      )
      persist(SCENE_GROUP_KEY, next)
      return next
    })
  }, [])

  const deleteGroup = useCallback((name: string) => {
    setGroups((prev) => {
      const next = prev.filter((g) => g !== name)
      persist(GROUPS_KEY, next.length ? next : ["Uncategory"])
      return next.length ? next : ["Uncategory"]
    })
    setSceneGroupOverrides((prev) => {
      const next = Object.fromEntries(
        Object.entries(prev).map(([id, group]) => [id, group === name ? "Uncategory" : group]),
      )
      persist(SCENE_GROUP_KEY, next)
      return next
    })
  }, [])

  const setSceneGroup = useCallback((sceneId: string, group: string) => {
    setSceneGroupOverrides((prev) => {
      const next = { ...prev, [sceneId]: group }
      persist(SCENE_GROUP_KEY, next)
      return next
    })
  }, [])

  const moveScene = useCallback((sceneId: string, direction: -1 | 1) => {
    setSceneOrder((prev) => {
      const next = { ...prev }
      next[sceneId] = (next[sceneId] ?? 0) + direction
      persist(ORDER_KEY, next)
      return next
    })
  }, [])

  /* -------------------------------- Scenes ---------------------------------- */

  const effectiveMedia = useMemo(
    () => ({ ...mediaOverrides, ...assetMedia }),
    [mediaOverrides, assetMedia],
  )

  const scenes = useMemo<Scene[]>(() => {
    const ownedPanoramas = demoMode
      ? []
      : activeProject
        ? panoramas.filter((p) => p.projectId === activeProject.id)
        : panoramas
    const uploaded: Scene[] = ownedPanoramas.map((p) => ({
      id: p.id,
      name: p.name,
      description: "Panorama 360° yang Anda unggah.",
      group: panoramaGroups[p.id] ?? "Uncategory",
      panorama: objectUrl(p),
      thumbnail: p.thumbnail ?? objectUrl(p),
      initialView: { yaw: 0, pitch: 0, zoom: 70 },
      hotspots: [],
      project: {
        title: p.name,
        role: "Panorama 360°",
        client: user?.name ?? "Saya",
        year: String(new Date(p.createdAt).getFullYear()),
        tags: ["360°", "Upload"],
      },
    }))
    // Akun baru mulai dari nol: tidak ada scene/template bawaan.
    // Template hanya dipakai mode tamu untuk demo publik.
    const base = user && !demoMode ? [] : staticScenes
    return [...base, ...uploaded]
      .map((scene) => ({
        ...scene,
        ...(sceneGroupOverrides[scene.id] ? { group: sceneGroupOverrides[scene.id] } : {}),
        ...(hotspotOverrides[scene.id] ? { hotspots: hotspotOverrides[scene.id] } : {}),
        ...(effectiveMedia[scene.id] ?? {}),
        ...(audioByScene[scene.id] ? { audio: audioByScene[scene.id].url } : {}),
      }))
      .sort((a, b) => (sceneOrder[a.id] ?? 0) - (sceneOrder[b.id] ?? 0))
  }, [panoramas, user, demoMode, activeProject, hotspotOverrides, effectiveMedia, audioByScene, sceneGroupOverrides, sceneOrder, panoramaGroups])

  /** Ambil scene project lain tanpa mengubah activeProject (untuk preview Dashboard). */
  const getProjectScenes = useCallback(
    (projectId: string): Scene[] =>
      panoramas
        .filter((p) => p.projectId === projectId)
        .map((p) => ({
          id: p.id,
          name: p.name,
          description: "Panorama 360° yang Anda unggah.",
          group: panoramaGroups[p.id] ?? "Uncategory",
          panorama: objectUrl(p),
          thumbnail: p.thumbnail ?? objectUrl(p),
          initialView: { yaw: 0, pitch: 0, zoom: 70 },
          hotspots: hotspotOverrides[p.id] ?? [],
          project: {
            title: p.name,
            role: "Panorama 360°",
            client: user?.name ?? "Saya",
            year: String(new Date(p.createdAt).getFullYear()),
            tags: ["360°", "Upload"],
          },
          ...(effectiveMedia[p.id] ?? {}),
          ...(audioByScene[p.id] ? { audio: audioByScene[p.id].url } : {}),
        })),
    [panoramas, panoramaGroups, user, hotspotOverrides, effectiveMedia, audioByScene],
  )

  return (
    <AppContext.Provider
      value={{
        user,
        demoMode,
        setDemoMode,
        guestId,
        isGuest: !user,
        register,
        login,
        logout,
        updateProfile,
        changePassword,
        panoramas,
        addPanorama,
        removePanorama,
        scenes,
        activeSceneId,
        setActiveSceneId,
        addHotspot,
        updateHotspot,
        removeHotspot,
        undoEdit,
        canUndo,
        captureThumbnail,
        setMediaFromScene,
        replaceSceneImage,
        removeSceneMediaOverride,
        setSceneAudio,
        removeSceneAudio,
        audioByScene,
        favorites,
        toggleFavorite,
        groups,
        createGroup,
        renameGroup,
        deleteGroup,
        setSceneGroup,
        moveScene,
        imageQuality,
        setImageQuality,
        studioConfig,
        updateStudioConfig,
        resetStudioConfig,
        projects,
        activeProject,
        createProject,
        setActiveProject,
        removeProject,
        setProjectStatus,
        setProjectPublishedUid,
        getProjectScenes,
        activity,
        logActivity,
        clearActivity,
        pendingGroup,
        setPendingGroup,
        effectsByScene,
        setSceneEffects,
        resetSceneEffects,
        authOpen,
        authMode,
        setAuthOpen: openAuth,
        uploadOpen,
        setUploadOpen,
        replaceSceneId,
        setReplaceSceneId,
        toast,
        notify,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

