import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Hotspot, Scene } from "../types/tour"
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
import { getAuthToken, setAuthToken } from "../lib/authToken"
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

interface AppContextValue {
  user: User | null
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

  authOpen: boolean
  setAuthOpen: (open: boolean) => void
  uploadOpen: boolean
  setUploadOpen: (open: boolean) => void
  replaceSceneId: string | null
  setReplaceSceneId: (id: string | null) => void

  toast: string | null
  notify: (message: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

const USERS_KEY = "virtour360.users"
const SESSION_KEY = "virtour360.session"
const GUEST_KEY = "virtour360.guestId"
const OWNER_KEY = "virtour360.owner"
const HOTSPOTS_KEY = "virtour360.hotspots"
const MEDIA_KEY = "virtour360.media"
const FAVORITES_KEY = "virtour360.favorites"
const EFFECTS_KEY = "virtour360.effects"

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
  ;[HOTSPOTS_KEY, MEDIA_KEY, FAVORITES_KEY, EFFECTS_KEY].forEach((key) => localStorage.removeItem(key))
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
  const [activeSceneId, setActiveSceneId] = useState<string>("atrium")
  const [audioByScene, setAudioByScene] = useState<Record<string, SceneAudio>>({})
  const [assetMedia, setAssetMedia] = useState<Record<string, SceneMedia>>({})
  const [authOpen, setAuthOpen] = useState(false)
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
        if (remote.users.length) localStorage.setItem(USERS_KEY, JSON.stringify(remote.users))
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
        users: readUsers(),
        hotspots: hotspotOverrides,
        favorites,
        media: persistableMedia(mediaOverrides),
        effects: effectsByScene,
        // Mode server tidak punya public URL Storage, jadi metadata panorama
        // tidak ikut disinkron agar device lain tidak menampilkan gambar rusak.
        panoramas: isServerMode
          ? []
          : panoramas.map<RemotePanorama>((p) => ({
              id: p.id,
              name: p.name,
              url: p.url ?? "",
              createdAt: p.createdAt,
            })),
      }).catch(() => undefined)
    }, 800)
    return () => window.clearTimeout(timer)
  }, [remoteReady, identityKey, hotspotOverrides, favorites, mediaOverrides, effectsByScene, panoramas, user])

  useEffect(() => {
    return () => {
      assetUrls.current.forEach((url) => URL.revokeObjectURL(url))
      urlCache.forEach((url) => URL.revokeObjectURL(url))
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
    const users = readUsers()
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return "Email sudah terdaftar. Silakan login."
    }
    if (password.length < 6) return "Password minimal 6 karakter."
    const next: StoredUser = { name: name.trim(), email: email.trim(), password, initials: makeInitials(name) }
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, next]))
    const session: User = { name: next.name, email: next.email, initials: next.initials }
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
    const found = readUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!found) return "Akun tidak ditemukan. Silakan daftar dulu."
    if (found.password !== password) return "Password salah."
    const session: User = { name: found.name, email: found.email, initials: found.initials }
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
  }, [])

  const logout = useCallback(() => {
    setAuthToken("")
    localStorage.removeItem(SESSION_KEY)
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
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setUser(session)
      return null
    },
    [user],
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
      const users = readUsers()
      const index = users.findIndex((u) => u.email === user.email)
      if (index < 0) return "Akun tidak ditemukan."
      if (users[index].password !== current) return "Password lama salah."
      users[index] = { ...users[index], password: next }
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
      return null
    },
    [user],
  )

  /* ------------------------------- Panorama -------------------------------- */

  const addPanorama = useCallback(
    async (name: string, file: File) => {
      const item: StoredPanorama = {
        id: uid("pano"),
        name: name.trim() || file.name.replace(/\.[^.]+$/, ""),
        blob: file,
        createdAt: Date.now(),
      }
      if (isRemote) {
        try {
          const url = await uploadPanoramaFile(item.id, file)
          if (url) item.url = url
        } catch {
          notify("Upload cloud gagal — panorama tetap tersimpan di browser ini.")
        }
      }
      await savePanorama(item)
      setPanoramas((prev) => [item, ...prev])
    },
    [notify],
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
    [],
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
    }
    await saveAsset(asset)
    assetsRef.current = [asset, ...assetsRef.current]
    const url = URL.createObjectURL(asset.blob)
    assetUrls.current.set(asset.id, url)
    setAudioByScene((prev) => ({ ...prev, [sceneId]: { url, name: asset.name } }))
  }, [])

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

  /* -------------------------------- Scenes ---------------------------------- */

  const effectiveMedia = useMemo(
    () => ({ ...mediaOverrides, ...assetMedia }),
    [mediaOverrides, assetMedia],
  )

  const scenes = useMemo<Scene[]>(() => {
    const uploaded: Scene[] = panoramas.map((p) => ({
      id: p.id,
      name: p.name,
      description: "Panorama 360° yang Anda unggah.",
      group: "Uncategory",
      panorama: objectUrl(p),
      thumbnail: objectUrl(p),
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
    return [...staticScenes, ...uploaded].map((scene) => ({
      ...scene,
      ...(hotspotOverrides[scene.id] ? { hotspots: hotspotOverrides[scene.id] } : {}),
      ...(effectiveMedia[scene.id] ?? {}),
      ...(audioByScene[scene.id] ? { audio: audioByScene[scene.id].url } : {}),
    }))
  }, [panoramas, user, hotspotOverrides, effectiveMedia, audioByScene])

  return (
    <AppContext.Provider
      value={{
        user,
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
        effectsByScene,
        setSceneEffects,
        resetSceneEffects,
        authOpen,
        setAuthOpen,
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

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp harus dipakai di dalam AppProvider")
  return ctx
}
