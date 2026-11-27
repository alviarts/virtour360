import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react"
import {
  ArrowUpRight,
  Bell,
  Compass,
  Folder,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Search,
  Upload,
  User,
  X,
} from "lucide-react"
import { useApp } from "../context/useApp"
import { Logo360 } from "../components/ui/Logo360"
import { PublicViewerModal } from "../components/viewer/PublicViewerModal"
import { creatorFromHash, effectiveProfileSlug, navigate, navigateHash, profileFromHash } from "../lib/navigation"
import {
  buildPublicFolders,
  loadPublicMetrics,
  listPublishedPayloads,
  loadPublicPayload,
  normalizeSlug,
  publicUidFromHash,
  recordPublicLike,
  unlockPublicPayload,
  type PublicPayload,
} from "../lib/publicStore"
import { LOCAL_CREATORS } from "../data/creators"
import { profile } from "../data/profile"
import { normalizeStudioConfig } from "../types/studio"

const THUMBS = [
  "/media/thumbnails/entrance_hall.jpg",
  "/media/thumbnails/art_studio.jpg",
  "/media/thumbnails/hotel_room.jpg",
]

const PANOS = [
  "/media/panoramas/entrance_hall.jpg",
  "/media/panoramas/art_studio.jpg",
  "/media/panoramas/hotel_room.jpg",
]

const postCards = [
  { title: "Atrium — The Gallery", image: THUMBS[0], panorama: PANOS[0], count: 4 },
  { title: "Studio — Creative Room", image: THUMBS[1], panorama: PANOS[1], count: 1 },
  { title: "Terrace — Sunset View", image: THUMBS[2], panorama: PANOS[2], count: 2 },
  { title: "2BR MASTER BEDROOM", image: THUMBS[0], panorama: PANOS[0], count: 1 },
  { title: "Living Room 360", image: THUMBS[1], panorama: PANOS[1], count: 3 },
  { title: "Trungtamyte", image: THUMBS[2], panorama: PANOS[2], count: 1 },
  { title: "CT05 20260512 OVERVIEW 1", image: THUMBS[0], panorama: PANOS[0], count: 1 },
  { title: "0512a", image: THUMBS[1], panorama: PANOS[1], count: 1 },
]

const tourCards = [
  { title: "2BR CXL 20261119", image: THUMBS[0], panorama: PANOS[0], comments: 0, likes: 1 },
  { title: "4BR CXL 20261119", image: THUMBS[1], panorama: PANOS[1], comments: 0, likes: 1 },
  { title: "TienichTrongNha CXL 20261119", image: THUMBS[2], panorama: PANOS[2], comments: 0, likes: 1 },
  { title: "ED CXL 20261119", image: THUMBS[0], panorama: PANOS[0], comments: 2, likes: 0 },
  { title: "ED CXL 20261113", image: THUMBS[1], panorama: PANOS[1], comments: 0, likes: 0 },
  { title: "Tienich ID CXL 20261024", image: THUMBS[2], panorama: PANOS[2], comments: 8, likes: 0 },
]

interface CardItem {
  id: string
  title: string
  image: string
  panorama: string
  count?: number
  comments?: number
  likes?: number
  sceneId?: string
}

function Header({
  onCreate,
  onLogin,
  userName,
  query,
  onQuery,
  primaryColor,
  hideActions = false,
}: {
  onCreate: () => void
  onLogin: () => void
  userName?: string
  query: string
  onQuery: (value: string) => void
  primaryColor: string
  hideActions?: boolean
}) {
  const { notify } = useApp()
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#23252a] bg-[#0f1011]/95 px-5 backdrop-blur">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("home")} title="Kembali ke Home" aria-label="Kembali ke Home" className="flex items-center">
          <Logo360 tone="white" size={28} />
        </button>
        <div className="flex h-9 w-64 items-center gap-2 rounded-full bg-[#1c1d1f] px-3.5">
          <Search size={15} className="text-[#62666d]" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Cari karya⬦"
            className="min-w-0 flex-1 bg-transparent text-xs text-[#E2E8F0] outline-none placeholder:text-[#62666d]"
          />
          {query && <button onClick={() => onQuery("")} title="Hapus" className="text-[#62666d] hover:text-[#d0d6e0]"><X size={13} /></button>}
        </div>
      </div>
      {!hideActions && (
        <div className="flex items-center gap-2">
          <button onClick={onCreate} className="flex h-9 items-center gap-1.5 rounded-full bg-[#e4f222] px-3.5 text-xs font-semibold text-[#08090a] hover:bg-[#f0ff7a]">
            <Upload size={13} /> Create
          </button>
          <button onClick={() => (userName ? navigate("dashboard") : onLogin())} style={{ background: primaryColor }} className="flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold text-white opacity-95 hover:opacity-100">
            <Compass size={13} /> Studio
          </button>
          {userName && (
            <button onClick={() => notify("Tidak ada notifikasi baru.")} className="grid size-9 place-items-center rounded-full border border-[#23252a] text-[#8a8f98]">
              <Bell size={15} />
            </button>
          )}
          <button onClick={onLogin} className="h-9 max-w-32 truncate rounded-full border border-[#23252a] px-4 text-xs font-medium text-[#d0d6e0]">
            {userName ?? "Masuk"}
          </button>
        </div>
      )}
      {hideActions && <span className="rounded-full bg-[#1c1d1f] px-2.5 py-1 text-[10px] font-semibold text-[#8a8f98]">Tour privat</span>}
    </header>
  )
}

function ProfileHeader({ name, initials, postCount, tourCount, viewCount, likes, badge, showBadge = true }: { name: string; initials: string; postCount: number; tourCount: number; viewCount: number; likes: number; badge?: string; showBadge?: boolean }) {
  const stats = [
    { value: postCount.toLocaleString("id-ID"), label: "Posts" },
    { value: tourCount.toLocaleString("id-ID"), label: "Tours" },
    { value: viewCount.toLocaleString("id-ID"), label: "Views" },
    { value: likes.toLocaleString("id-ID"), label: "Likes" },
  ]
  return (
    <div className="flex flex-col items-center bg-[#0f1011] px-4 py-10" id="portfolio-author">
      <div className="grid size-24 place-items-center rounded-full border-4 border-white bg-emerald-200 text-3xl shadow-md">
        {initials.toUpperCase()}
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#ffffff]">{name}</h1>
      <p className="mt-0.5 text-sm text-[#62666d]">
        {badge && showBadge ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e4f222]/10 px-2.5 py-1 text-[11px] font-semibold text-[#e4f222]">
            <Folder size={11} /> {badge}
          </span>
        ) : (
          "@virtour360"
        )}
      </p>
      <div className="mt-6 flex items-start gap-8 sm:gap-10">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center">
            <span className="text-xl font-bold text-[#ffffff]">{stat.value}</span>
            <span className="mt-0.5 text-xs text-[#62666d]">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#ffffff]">
      <Folder size={18} className="text-[#ffffff]" /> {children}
    </h2>
  )
}

function Card({
  item,
  favorite,
  onToggleFavorite,
  onOpen,
}: {
  item: CardItem
  favorite: boolean
  onToggleFavorite: () => void
  onOpen: () => void
}) {
  return (
    <div className="group text-left">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#1c1d1f]">
        <button onClick={onOpen} className="block h-full w-full">
          <img
            src={item.image || "/media/thumbnails/entrance_hall.jpg"}
            onError={(e) => { e.currentTarget.src = "/media/thumbnails/entrance_hall.jpg" }}
            alt={item.title}
            className="pano-drift h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </button>
        <button
          onClick={onToggleFavorite}
          title={favorite ? "Hapus dari favorit" : "Simpan ke favorit"}
          className={`absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-slate-800/60 text-white backdrop-blur transition-colors ${favorite ? "text-rose-400" : "hover:text-rose-300"}`}
        >
          <Heart size={13} fill={favorite ? "currentColor" : "none"} />
        </button>
        <span className="pointer-events-none absolute bottom-2 left-2 flex h-6 items-center gap-1 rounded-md bg-[#e4f222] px-1.5 text-[10px] font-bold text-[#08090a]">360°</span>
        {item.count !== undefined && (
          <span className="pointer-events-none absolute bottom-2 right-2 flex h-6 items-center gap-1 rounded-md bg-slate-900/70 px-1.5 text-[10px] font-medium text-white">{item.count} ▣</span>
        )}
        {!!item.comments && (
          <span className="pointer-events-none absolute right-2 top-10 flex h-6 items-center gap-1 rounded-md bg-slate-900/70 px-1.5 text-[10px] text-white">
            <MessageCircle size={10} /> {item.comments}
          </span>
        )}
      </div>
      <button onClick={onOpen} className="mt-2 block w-full truncate text-left text-xs font-medium text-[#E2E8F0] hover:text-slate-950">{item.title}</button>
    </div>
  )
}

function DetailModal({ item, onClose, onExplore, onToggleFavorite }: { item: CardItem; onClose: () => void; onExplore: () => void; onToggleFavorite: (item: CardItem) => void }) {
  const { favorites } = useApp()
  const favorite = favorites.includes(item.id)
  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md animate-fade-up overflow-hidden rounded-2xl bg-[#0f1011] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-52">
          <img src={item.image || "/media/thumbnails/entrance_hall.jpg"} onError={(e) => { e.currentTarget.src = "/media/thumbnails/entrance_hall.jpg" }} alt={item.title} className="h-full w-full object-cover" />
          <button onClick={onClose} className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"><X size={15} /></button>
        </div>
        <div className="p-5">
          <h3 className="truncate text-base font-bold text-[#ffffff]">{item.title}</h3>
          <p className="mt-1 text-xs text-[#8a8f98]">Panorama 360° · {item.count ?? 1} scene</p>
          <div className="mt-4 flex gap-2">
            <button onClick={onExplore} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#e4f222] text-xs font-semibold text-[#08090a] hover:bg-[#f0ff7a]">
              Jelajahi 360°   →
            </button>
            <button
              onClick={() => onToggleFavorite(item)}
              className={`flex h-9 items-center gap-1.5 rounded-full border px-4 text-xs font-medium ${favorite ? "border-rose-300 bg-rose-50 text-rose-600" : "border-[#23252a] text-[#d0d6e0]"}`}
            >
              <Heart size={13} fill={favorite ? "currentColor" : "none"} /> {favorite ? "Favorit" : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FloatingNav() {
  const scrollTo = (id?: string) => {
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    else document.getElementById("portfolio-root")?.scrollTo({ top: 0, behavior: "smooth" })
  }
  const items = [
    { label: "Home", icon: Home, run: () => scrollTo() },
    { label: "Map", icon: MapPin, run: () => scrollTo("portfolio-contact") },
    { label: "Author", icon: User, run: () => scrollTo("portfolio-author") },
    { label: "Explore", icon: Compass, run: () => scrollTo("portfolio-explore") },
  ]
  return (
    <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/70 bg-[#0f1011]/90 px-2 py-1.5 shadow-xl backdrop-blur-md">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.label}
            onClick={item.run}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[#8a8f98] hover:bg-[#1c1d1f] hover:text-[#ffffff]"
          >
            <Icon size={14} /> {item.label}
          </button>
        )
      })}
    </div>
  )
}

export function PublicPortfolioView() {
  const { scenes, user, favorites, toggleFavorite, studioConfig, demoMode, projects } = useApp()
  const [query, setQuery] = useState("")
  const [detail, setDetail] = useState<CardItem | null>(null)
  const [exploring, setExploring] = useState<CardItem | null>(null)
  const [publicData, setPublicData] = useState<PublicPayload | null>(null)
  const [allPosts, setAllPosts] = useState(false)
  const [allTours, setAllTours] = useState(false)
  const [metrics, setMetrics] = useState<{ views: Record<string, number>; likes: Record<string, number> }>({ views: {}, likes: {} })
  const [creatorId, setCreatorId] = useState<string | null>(creatorFromHash())
  const [gatePassword, setGatePassword] = useState("")
  const [gateError, setGateError] = useState("")
  const [unlocked, setUnlocked] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onHash = () => setCreatorId(creatorFromHash())
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  useEffect(() => {
    let alive = true
    const fallback: PublicPayload = {
      profile: {
        name: user?.name ?? "Ardhana Wicaksono",
        initials: user?.initials ?? "AW",
        location: profile.location,
        email: profile.email,
        website: profile.website,
        bio: profile.bio,
      },
      scenes,
      folders: buildPublicFolders(scenes),
      updatedAt: new Date().toISOString(),
    }
    const load = async () => {
      const hashUid = publicUidFromHash()
      if (hashUid) {
        // Link publish: tampilkan tepat project yang diminta UID-nya.
        const data = await loadPublicPayload(hashUid)
        if (alive) setPublicData(data ?? fallback)
        return
      }
      // Profil user: kumpulkan HANYA project milik user yang benar-benar dipublish.
      const published = (projects ?? []).filter((p) => p.publishedUid)
      if (published.length) {
        const loaded = await Promise.all(published.map((p) => loadPublicPayload(p.publishedUid!)))
        const payloads = loaded.filter((x): x is PublicPayload => !!x?.scenes?.length)
        if (payloads.length) {
          if (alive) setPublicData({
            ...payloads[0],
            scenes: payloads.flatMap((x) => x.scenes),
            folders: payloads.flatMap((x) => x.folders ?? []),
            updatedAt: payloads[0].updatedAt,
          })
          return
        }
      }
      // Pengunjung/portofolio publik tidak punya project lokal. Ambil tour
      // milik pemilik profil dari feed publish (Supabase/localhost proxy).
      const route = profileFromHash()
      const owner = normalizeSlug(route ?? user?.name ?? "").replace(/-[a-z0-9]{6}$/, "")
      const feed = await listPublishedPayloads()
      const matched = feed.filter((item) => {
        const name = normalizeSlug(item.payload.profile?.name ?? "")
        return !!name && !!owner && (name === owner || owner.startsWith(name))
      })
      if (matched.length) {
        const payloads = matched.map((item) => ({
          ...item.payload,
          uid: item.payload.uid ?? item.uid,
          folders: (item.payload.folders?.length
            ? item.payload.folders
            : buildPublicFolders(item.payload.scenes, item.uid)
          ).map((folder) => ({ ...folder, uid: folder.uid ?? item.uid })),
        }))
        if (alive) setPublicData({
          ...payloads[0],
          scenes: payloads.flatMap((x) => x.scenes),
          folders: payloads.flatMap((x) => x.folders),
          updatedAt: payloads[0].updatedAt,
        })
        return
      }
      if (alive) setPublicData(fallback)
    }
    void load()
    return () => {
      alive = false
    }
  }, [])

  // Pengunjung melihat data hasil publish; fallback ke data lokal.
  const sourceScenes = useMemo(
    () => (publicData?.scenes?.length ? publicData.scenes : scenes),
    [publicData, scenes],
  )
  const routeSlug = profileFromHash()
  const uploaded = sourceScenes.filter((s) => s.id.startsWith("pano-"))

  // Metrik portofolio dihitung dari data publish nyata, bukan angka dekoratif.
  const publishedFolders = useMemo(
    () => (publicData?.folders ?? []).filter((folder) => folder.uid || publicData?.uid),
    [publicData],
  )
  const publishedUids = useMemo(
    () => [...new Set(publishedFolders.map((folder) => folder.uid || publicData?.uid!).filter(Boolean))],
    [publishedFolders, publicData?.uid],
  )
  const refreshMetrics = useCallback(() => {
    if (!publishedUids.length) {
      setMetrics({ views: {}, likes: {} })
      return
    }
    void loadPublicMetrics(publishedUids, setMetrics).then(setMetrics)
  }, [publishedUids])
  useEffect(refreshMetrics, [refreshMetrics])

  const totalViews = publishedUids.reduce((sum, uid) => sum + (metrics.views[uid] ?? 0), 0)
  const totalLikes = publishedUids.reduce((sum, uid) => sum + (metrics.likes[uid] ?? 0), 0)
  const uidForScene = (sceneId?: string) => publishedFolders.find((folder) => folder.sceneIds.includes(sceneId ?? ""))?.uid || publicData?.uid
  const handleFavorite = (item: CardItem) => {
    const wasFavorite = favorites.includes(item.id)
    toggleFavorite(item.id)
    const uid = uidForScene(item.sceneId)
    if (uid) {
      recordPublicLike(uid, !wasFavorite)
      refreshMetrics()
    }
  }
  const basePosts: CardItem[] = useMemo(
    () => [
      ...uploaded.map((s) => ({ id: s.id, title: s.name, image: s.thumbnail, panorama: s.panorama, count: 1, sceneId: s.id })),
      ...(routeSlug ? [] : postCards.map((item, i) => ({ id: `post-${i}`, ...item }))),
    ],
    [uploaded, routeSlug],
  )
  const baseTours: CardItem[] = useMemo(
    () => [
      ...uploaded.map((s) => ({ id: `tour-${s.id}`, title: s.name, image: s.thumbnail, panorama: s.panorama, likes: 0, sceneId: s.id })),
      ...(routeSlug ? [] : tourCards.map((item, i) => ({ id: `tour-${i}`, ...item }))),
    ],
    [uploaded, routeSlug],
  )

  // Portofolio yang dibuka mengikuti kreator yang dipilih di Home.
  const remoteCreator = publicData?.creators?.find((c) => c.id === creatorId)
  const localCreator = LOCAL_CREATORS.find((c) => c.id === creatorId)
  const selected = remoteCreator ?? localCreator ?? null

  // Link publish (#/p/<uid>) membuka portofolio PER PROJECT, bukan profil user.
  const sharedUid = publicUidFromHash()
  const isOwnProfile = !!user && routeSlug === effectiveProfileSlug(user.name, user.uid)
  const projectName =
    publicData?.folders?.[0]?.name ??
    publicData?.scenes?.[0]?.project?.title ??
    null

  // Di halaman akun, identitas mengikuti user yang sedang login.
  // Di link publish, yang tampil adalah project yang dipilih.
  const displayName = sharedUid
    ? projectName ?? publicData?.profile.name ?? "Project Virtour360"
    : routeSlug
      ? isOwnProfile ? user!.name : routeSlug
      : demoMode || !user ? "Demo Portofolio" : selected?.name ?? publicData?.profile.name ?? "Kreator Virtour360"
  const displayInitials = sharedUid
    ? (displayName ?? "Project").slice(0, 2).toUpperCase()
    : user?.initials ?? selected?.initials ?? publicData?.profile.initials ?? "V3"

  // Saat membuka kreator tertentu, karya yang tampil adalah milik kreator itu.
  const creatorPosts: CardItem[] = selected
    ? "posts" in selected && Array.isArray(selected.posts)
      ? selected.posts.map((post) => ({
          id: post.id,
          title: post.title,
          image: post.image,
          panorama: post.panorama,
          count: 1,
        }))
      : "title" in selected
        ? [{
            id: selected.id,
            title: selected.title,
            image: selected.image,
            panorama: selected.panorama,
            count: 1,
          }]
        : []
    : []

  const posts = creatorPosts.length ? creatorPosts : basePosts
  const tours = creatorPosts.length
    ? creatorPosts.map((item, i) => ({ ...item, id: `tour-${item.id}-${i}`, likes: 0 }))
    : baseTours

  /** Konfigurasi Studio hasil publish, atau config lokal jika buka portofolio sendiri. */
  const design = useMemo(
    () => normalizeStudioConfig(publicData?.studioConfig ?? studioConfig),
    [publicData?.studioConfig, studioConfig],
  )

  const matches = (item: CardItem) => item.title.toLowerCase().includes(query.trim().toLowerCase())
  const shownPosts = (allPosts ? posts : posts.slice(0, 4)).filter(matches)
  const shownTours = (allTours ? tours : tours.slice(0, 3)).filter(matches)

  /** SEO dinamis dari panel Marketing — sebelumnya hanya meta statis. */
  useEffect(() => {
    const seoTitle = design.marketing.seoTitle.trim() || displayName
    const seoDescription = design.marketing.seoDescription.trim() || "Virtual tour 360° — jelajahi panorama, scene, dan karya di Virtour360."
    document.title = seoTitle
    const applyMeta = (key: string, content: string, attribute: "name" | "property" = "name") => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
      if (!el) {
        el = document.createElement("meta")
        el.setAttribute(attribute, key)
        document.head.appendChild(el)
      }
      el.content = content
    }
    applyMeta("description", seoDescription)
    applyMeta("og:title", seoTitle, "property")
    applyMeta("og:description", seoDescription, "property")
    if (design.marketing.seoImage) applyMeta("og:image", design.marketing.seoImage, "property")
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement("link")
      canonical.rel = "canonical"
      document.head.appendChild(canonical)
    }
    canonical.href = window.location.href.split("#")[0]
    return () => { document.title = "Virtour360 — Studio Virtual Tour" }
  }, [design.marketing.seoTitle, design.marketing.seoDescription, design.marketing.seoImage, displayName])

  /* ------------------------- Gate akses publish ------------------------ */
  const shareUid = publicUidFromHash()
  const gateKey = `virtour360.unlocked:${shareUid ?? "default"}`
  useEffect(() => setUnlocked(sessionStorage.getItem(gateKey) === "1"), [gateKey])

  const access = publicData?.access ?? "public"
  const isLocked = publicData?.locked === true || access === "draft" || (access === "password" && !unlocked)

  const unlock = async () => {
    const ok = await unlockPublicPayload(
      shareUid ?? publicData?.uid ?? "public",
      gatePassword,
    )
    if (!ok) {
      setGateError("Password salah.")
      return
    }
    sessionStorage.setItem(gateKey, "1")
    setUnlocked(true)
    setGateError("")
    const refreshed = await loadPublicPayload(shareUid ?? publicData?.uid ?? undefined)
    if (refreshed) setPublicData(refreshed)
  }

  if (isLocked) {
    return (
      <div className="grid h-full w-full place-items-center bg-[#08090a] px-4 text-[#ffffff]">
        <div className="w-full max-w-sm rounded-2xl border border-[#23252a] bg-[#0f1011] p-6 text-center shadow-xl">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#1c1d1f] text-[#8a8f98]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          </div>
          <h1 className="mt-4 text-lg font-bold">
            {access === "draft" ? "Tour masih dalam draft" : "Tour dilindungi password"}
          </h1>
          <p className="mt-2 text-xs text-[#8a8f98]">
            {access === "draft"
              ? "Pemilik belum mempublikasikan tour ini."
              : "Masukkan password untuk melihat virtual tour ini."}
          </p>
          {access === "password" && (
            <div className="mt-4 flex flex-col gap-2">
              <input
                type="password"
                value={gatePassword}
                onChange={(e) => setGatePassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") unlock() }}
                placeholder="Password tour"
                className="h-10 rounded-lg border border-[#23252a] px-3 text-sm outline-none focus:border-sky-500"
              />
              {gateError && <p className="text-[11px] text-red-500">{gateError}</p>}
              <button onClick={unlock} className="h-10 rounded-lg bg-sky-500 text-sm font-semibold text-white hover:bg-sky-600">Buka tour</button>
            </div>
          )}
          <button onClick={() => navigate("home")} className="mt-4 text-[11px] text-[#62666d] hover:underline">Kembali ke Home</button>
        </div>
      </div>
    )
  }

  const rootStyle = {
    "--studio-primary": design.theme.primaryColor,
    "--studio-text": design.theme.textColor,
    fontFamily: `"${design.theme.primaryFont}", "${design.theme.secondaryFont}", sans-serif`,
  } as CSSProperties

  return (
    <div ref={rootRef} id="portfolio-root" style={rootStyle} className="h-full w-full overflow-y-auto bg-[#08090a] text-[#ffffff]">
      <Header
        onCreate={() => navigate(user ? "dashboard" : "signup")}
        onLogin={() => navigate(user ? "dashboard" : "login")}
        userName={user?.name}
        query={query}
        onQuery={setQuery}
        primaryColor={design.theme.primaryColor}
        hideActions={access !== "public"}
      />
      <ProfileHeader
        name={displayName}
        initials={displayInitials}
        postCount={uploaded.length}
        tourCount={publishedFolders.length || (routeSlug ? 0 : tours.length)}
        viewCount={totalViews}
        likes={totalLikes}
        badge={routeSlug ? `@${routeSlug}` : selected ? `@${selected.name}` : `@${(user?.name ?? "demo").toLowerCase().replace(/\s+/g, "")}`}
        showBadge={!design.theme.hideProjectTitle}
      />

      <div className="mx-auto max-w-[1200px] px-4 pb-28 sm:px-6 lg:px-8">
        {/* Hanya project yang dipublikasikan — scene tetap berada di dalam tour. */}
        {!selected && !!publishedFolders.length && (
          <section className="mt-4 rounded-2xl bg-[#0f1011] p-6" id="portfolio-folders">
            <SectionTitle>Project</SectionTitle>
            <p className="mb-4 text-xs text-[#8a8f98]">
              {publishedFolders.length} project dipublikasikan · klik kartu untuk membuka tour 360°
            </p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-4">
              {publishedFolders.map((folder, i) => {
                const uid = folder.uid || publicData?.uid
                const sceneCount = folder.sceneIds.filter((id) => sourceScenes.some((scene) => scene.id === id)).length || folder.sceneIds.length
                return (
                  <button
                    key={`${folder.uid ?? "local"}-${folder.id}-${i}`}
                    onClick={() => uid && navigateHash(`#/p/${uid.split("/").map(encodeURIComponent).join("/")}`)}
                    disabled={!uid}
                    className="group overflow-hidden rounded-xl border border-[#23252a] bg-[#0f1011] text-left transition-colors hover:border-zinc-600 disabled:cursor-default"
                  >
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={folder.cover && !folder.cover.startsWith("blob:") ? folder.cover : "/media/thumbnails/entrance_hall.jpg"}
                        alt=""
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
                        <Folder size={10} className="mr-1 inline" />{sceneCount} scene
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="line-clamp-1 text-sm font-semibold text-[#ffffff]">{folder.name}</span>
                        <ArrowUpRight size={14} className="shrink-0 text-[#62666d]" />
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-[#8a8f98]">{folder.description}</p>
                      <div className="mt-3 flex items-center gap-3 text-[10px] text-[#8a8f98]">
                        <span>{metrics.views[uid ?? ""] ?? 0} views</span>
                        <span><Heart size={10} className="mr-1 inline" />{metrics.likes[uid ?? ""] ?? 0} suka</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {query && (
          <p className="mt-4 text-xs text-[#8a8f98]">
            Hasil pencarian "{query}" — {posts.filter(matches).length} post, {tours.filter(matches).length} tour.
          </p>
        )}

        <section className="mt-4 rounded-2xl bg-[#0f1011] p-6" id="portfolio-explore">
          <SectionTitle>360° posts — {displayName}</SectionTitle>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-6">
            {shownPosts.map((item, i) => (
              <Card
                key={`post-${item.id}-${i}`}
                item={item}
                favorite={favorites.includes(item.id)}
                onToggleFavorite={() => handleFavorite(item)}
                onOpen={() => setDetail(item)}
              />
            ))}
          </div>
          {shownPosts.length === 0 && <p className="py-8 text-center text-xs text-[#8a8f98]">Tidak ada post yang cocok.</p>}
          {posts.length > 4 && (
            <div className="mt-6 text-center">
              <button onClick={() => setAllPosts((v) => !v)} className="rounded-full bg-[#1c1d1f] px-5 py-2 text-xs font-semibold text-white">
                {allPosts ? "View less" : "View more"}
              </button>
            </div>
          )}
        </section>

        <div className="mx-auto mt-8 flex max-w-[620px] overflow-hidden rounded-xl">
          <div className="relative w-2/5 bg-gradient-to-br from-fuchsia-600 via-pink-600 to-cyan-400">
            <div className="absolute inset-0 opacity-40 [background-image:repeating-linear-gradient(115deg,transparent,transparent_12px,rgba(255,255,255,0.35)_12px,rgba(255,255,255,0.35)_14px)]" />
          </div>
          <div className="flex w-3/5 flex-col justify-center bg-[var(--studio-primary)] px-5 py-5 text-white">
            <p className="text-sm font-bold leading-snug">
              Karya 360° untuk teman — dibuat dengan senang, tanpa biaya.
            </p>
            <button onClick={() => navigate("home")} className="mt-3 w-fit rounded border border-white/60 px-3 py-1.5 text-[10px] font-semibold tracking-wide">
              JELAJAHI   →
            </button>
          </div>
        </div>

        <section className="mt-10 rounded-2xl bg-[#0f1011] p-6" id="portfolio-tours">
          <div className="flex items-end justify-between gap-4">
            <SectionTitle>Virtual tours — {displayName}</SectionTitle>
            <button onClick={() => navigate("customers")} className="mb-4 text-[11px] text-[#4CC9F0] hover:text-white">Explore komunitas →</button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-6">
            {shownTours.map((item, i) => (
              <Card
                key={`tour-${item.id}-${i}`}
                item={item}
                favorite={favorites.includes(item.id)}
                onToggleFavorite={() => handleFavorite(item)}
                onOpen={() => setDetail(item)}
              />
            ))}
          </div>
          {shownTours.length === 0 && <p className="py-8 text-center text-xs text-[#8a8f98]">Tidak ada tour yang cocok.</p>}
          {tours.length > 3 && (
            <div className="mt-6 text-center">
              <button onClick={() => setAllTours((v) => !v)} className="rounded-full bg-[#1c1d1f] px-5 py-2 text-xs font-semibold text-white">
                {allTours ? "View less" : "View more"}
              </button>
            </div>
          )}
        </section>

        <div className="mt-8 flex items-center gap-3 rounded-xl border border-[#23252a] bg-[#0f1011] p-5" id="portfolio-contact">
          <MapPin size={20} className="shrink-0 text-sky-500" />
          <div>
            <h3 className="text-sm font-bold text-[#ffffff]">Lokasi &amp; kontak</h3>
            <p className="mt-1 text-xs text-[#8a8f98]">{profile.location} · {profile.email}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-[#23252a] bg-[#0f1011] p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold text-[#ffffff]">Share your world in 360</h3>
            <p className="mt-1 text-xs text-[#8a8f98]">
              Turn this dead-end into your next discovery by publishing your own panorama.
            </p>
          </div>
          <button onClick={() => navigate(user ? "dashboard" : "signup")} className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#e4f222] px-4 text-xs font-semibold text-[#08090a] hover:bg-[#f0ff7a]">
            Upload your own 360   →
          </button>
        </div>

        {/* Call To Action dari panel Design */}
        {design.cta.title && (
          <div
            className={`mt-8 flex items-center justify-between gap-4 rounded-xl border border-[#23252a] bg-[#0f1011] p-4 ${design.cta.position === "left" ? "flex-row-reverse" : ""}`}
            style={{ marginInline: design.cta.offset }}
          >
            <div>
              <p className="text-sm font-bold text-[#ffffff]">{design.cta.title}</p>
              <p className="mt-0.5 text-xs text-[#8a8f98]">{design.cta.description}</p>
            </div>
            <a
              href="#/contact"
              onClick={(e) => { e.preventDefault(); navigate("contact") }}
              className="cursor-pointer shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-[#08090a]"
              style={{ background: design.theme.primaryColor }}
            >
              {design.cta.layout === "bubble" ? "Hubungi" : "Lihat detail"}
            </a>
          </div>
        )}

        {/* Copyright / branding dari panel Setting */}
        {design.setting.copyrightEnabled && (
          <div className="py-8 text-center text-[10px] text-[#62666d]">
            {design.setting.logo && <img src={design.setting.logo} alt="" className="mx-auto mb-2 max-h-8" />}
            <a href={design.setting.copyrightLink} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
              {design.setting.copyrightAuthor}
            </a>
            <span className="mx-1">·</span>
            {design.setting.copyrightDescription}
          </div>
        )}
      </div>

      {detail && (
        <DetailModal
          item={detail}
          onClose={() => setDetail(null)}
          onToggleFavorite={handleFavorite}
          onExplore={() => {
            setExploring(detail)
            setDetail(null)
          }}
        />
      )}
      {exploring && (
        <PublicViewerModal
          title={exploring.title}
          panorama={exploring.panorama}
          scenes={exploring.sceneId ? sourceScenes : undefined}
          sceneId={exploring.sceneId ?? undefined}
          onClose={() => setExploring(null)}
        />
      )}
      <footer className="border-t border-[#23252a] px-6 py-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Logo360 tone="white" size={24} />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-[#8a8f98]">
            <button onClick={() => navigate("home")} className="hover:text-white">Home</button>
            <button onClick={() => navigate("product")} className="hover:text-white">Product</button>
            <button onClick={() => navigate("customers")} className="hover:text-white">Explore</button>
            <button onClick={() => navigate("resources")} className="hover:text-white">Resources</button>
            <button onClick={() => navigate("contact")} className="hover:text-white">Contact</button>
            <a href="https://instagram.com/vwrks" target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a>
          </div>
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">© 2026 Virtour360</span>
        </div>
      </footer>
      <FloatingNav />
    </div>
  )
}
