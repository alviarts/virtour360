import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react"
import {
  Bell,
  ChevronDown,
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
import { creatorFromHash, navigate } from "../lib/navigation"
import { buildPublicFolders, hashPassword, loadPublicPayload, publicUidFromHash, type PublicPayload } from "../lib/publicStore"
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#1E4A78] bg-[#0B1F3A]/95 px-5 backdrop-blur">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("home")} title="Kembali ke Home" aria-label="Kembali ke Home" className="flex items-center">
          <Logo360 tone="dark" size={28} />
        </button>
        <div className="flex h-9 w-64 items-center gap-2 rounded-full bg-[#123153] px-3.5">
          <Search size={15} className="text-[#5A7FA8]" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Cari karya⬦"
            className="min-w-0 flex-1 bg-transparent text-xs text-[#C3D6E8] outline-none placeholder:text-[#5A7FA8]"
          />
          {query && <button onClick={() => onQuery("")} title="Hapus" className="text-[#5A7FA8] hover:text-[#9BB8D4]"><X size={13} /></button>}
        </div>
      </div>
      {!hideActions && (
        <div className="flex items-center gap-2">
          <button onClick={onCreate} className="flex h-9 items-center gap-1.5 rounded-full bg-[#4CC9F0] px-3.5 text-xs font-semibold text-[#061224] hover:bg-[#7ADDF5]">
            <Upload size={13} /> Create
          </button>
          <button onClick={() => (userName ? navigate("dashboard") : onLogin())} style={{ background: primaryColor }} className="flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold text-white opacity-95 hover:opacity-100">
            <Compass size={13} /> Studio
          </button>
          {userName && (
            <button onClick={() => notify("Tidak ada notifikasi baru.")} className="grid size-9 place-items-center rounded-full border border-[#1E4A78] text-[#7F9FBF]">
              <Bell size={15} />
            </button>
          )}
          <button onClick={onLogin} className="h-9 max-w-32 truncate rounded-full border border-[#1E4A78] px-4 text-xs font-medium text-[#9BB8D4]">
            {userName ?? "Masuk"}
          </button>
        </div>
      )}
      {hideActions && <span className="rounded-full bg-[#123153] px-2.5 py-1 text-[10px] font-semibold text-[#7F9FBF]">Tour privat</span>}
    </header>
  )
}

function ProfileHeader({ name, initials, postCount, tourCount, likes, badge, showBadge = true }: { name: string; initials: string; postCount: number; tourCount: number; likes: number; badge?: string; showBadge?: boolean }) {
  const stats = [
    { value: String(postCount), label: "Posts" },
    { value: String(tourCount), label: "Tours" },
    { value: "1313", label: "Views" },
    { value: String(likes), label: "Likes" },
  ]
  return (
    <div className="flex flex-col items-center bg-[#0B1F3A] px-4 py-10" id="portfolio-author">
      <div className="grid size-24 place-items-center rounded-full border-4 border-white bg-emerald-200 text-3xl shadow-md">
        {initials.toUpperCase()}
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#DCE9F7]">{name}</h1>
      <p className="mt-0.5 text-sm text-[#5A7FA8]">
        {badge && showBadge ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#4CC9F0]/10 px-2.5 py-1 text-[11px] font-semibold text-[#4CC9F0]">
            <Folder size={11} /> {badge}
          </span>
        ) : (
          "@virtour360"
        )}
      </p>
      <div className="mt-6 flex items-start gap-8 sm:gap-10">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center">
            <span className="text-xl font-bold text-[#DCE9F7]">{stat.value}</span>
            <span className="mt-0.5 text-xs text-[#5A7FA8]">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#DCE9F7]">
      <Folder size={18} className="text-[#DCE9F7]" /> {children}
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
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#123153]">
        <button onClick={onOpen} className="block h-full w-full">
          <img src={item.image} alt={item.title} className="pano-drift h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        </button>
        <button
          onClick={onToggleFavorite}
          title={favorite ? "Hapus dari favorit" : "Simpan ke favorit"}
          className={`absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-slate-800/60 text-white backdrop-blur transition-colors ${favorite ? "text-rose-400" : "hover:text-rose-300"}`}
        >
          <Heart size={13} fill={favorite ? "currentColor" : "none"} />
        </button>
        <span className="pointer-events-none absolute bottom-2 left-2 flex h-6 items-center gap-1 rounded-md bg-[#4CC9F0] px-1.5 text-[10px] font-bold text-white">360°</span>
        {item.count !== undefined && (
          <span className="pointer-events-none absolute bottom-2 right-2 flex h-6 items-center gap-1 rounded-md bg-slate-900/70 px-1.5 text-[10px] font-medium text-white">{item.count} ▣</span>
        )}
        {!!item.comments && (
          <span className="pointer-events-none absolute right-2 top-10 flex h-6 items-center gap-1 rounded-md bg-slate-900/70 px-1.5 text-[10px] text-white">
            <MessageCircle size={10} /> {item.comments}
          </span>
        )}
      </div>
      <button onClick={onOpen} className="mt-2 block w-full truncate text-left text-xs font-medium text-[#C3D6E8] hover:text-slate-950">{item.title}</button>
    </div>
  )
}

function DetailModal({ item, onClose, onExplore }: { item: CardItem; onClose: () => void; onExplore: () => void }) {
  const { favorites, toggleFavorite } = useApp()
  const favorite = favorites.includes(item.id)
  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md animate-fade-up overflow-hidden rounded-2xl bg-[#0B1F3A] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-52">
          <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
          <button onClick={onClose} className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"><X size={15} /></button>
        </div>
        <div className="p-5">
          <h3 className="truncate text-base font-bold text-[#DCE9F7]">{item.title}</h3>
          <p className="mt-1 text-xs text-[#7F9FBF]">Panorama 360° · {item.count ?? 1} scene</p>
          <div className="mt-4 flex gap-2">
            <button onClick={onExplore} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#4CC9F0] text-xs font-semibold text-[#061224] hover:bg-[#7ADDF5]">
              Jelajahi 360°   →
            </button>
            <button
              onClick={() => toggleFavorite(item.id)}
              className={`flex h-9 items-center gap-1.5 rounded-full border px-4 text-xs font-medium ${favorite ? "border-rose-300 bg-rose-50 text-rose-600" : "border-[#1E4A78] text-[#9BB8D4]"}`}
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
    { label: "Map", icon: MapPin, run: () => scrollTo("portfolio-map") },
    { label: "Author", icon: User, run: () => scrollTo("portfolio-author") },
    { label: "Explore", icon: Compass, run: () => scrollTo("portfolio-explore") },
  ]
  return (
    <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/70 bg-[#0B1F3A]/90 px-2 py-1.5 shadow-xl backdrop-blur-md">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.label}
            onClick={item.run}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-[#7F9FBF] hover:bg-[#123153] hover:text-[#DCE9F7]"
          >
            <Icon size={14} /> {item.label}
          </button>
        )
      })}
    </div>
  )
}

export function PublicPortfolioView() {
  const { scenes, user, setAuthOpen, favorites, toggleFavorite, studioConfig } = useApp()
  const [query, setQuery] = useState("")
  const [detail, setDetail] = useState<CardItem | null>(null)
  const [exploring, setExploring] = useState<CardItem | null>(null)
  const [publicData, setPublicData] = useState<PublicPayload | null>(null)
  const [allPosts, setAllPosts] = useState(false)
  const [allTours, setAllTours] = useState(false)
  const [openFolder, setOpenFolder] = useState<string | null>(null)
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
    loadPublicPayload(publicUidFromHash()).then((data) => {
      if (!alive) return
      setPublicData(
        data ?? {
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
        },
      )
    })
    return () => {
      alive = false
    }
  }, [])

  // Pengunjung melihat data hasil publish; fallback ke data lokal.
  const sourceScenes = useMemo(
    () => (publicData?.scenes?.length ? publicData.scenes : scenes),
    [publicData, scenes],
  )
  const uploaded = sourceScenes.filter((s) => s.id.startsWith("pano-"))
  const basePosts: CardItem[] = useMemo(
    () => [
      ...uploaded.map((s) => ({ id: s.id, title: s.name, image: s.thumbnail, panorama: s.panorama, count: 1, sceneId: s.id })),
      ...postCards.map((item, i) => ({ id: `post-${i}`, ...item })),
    ],
    [uploaded],
  )
  const baseTours: CardItem[] = useMemo(
    () => [
      ...uploaded.map((s) => ({ id: `tour-${s.id}`, title: s.name, image: s.thumbnail, panorama: s.panorama, likes: 0, sceneId: s.id })),
      ...tourCards.map((item, i) => ({ id: `tour-${i}`, ...item })),
    ],
    [uploaded],
  )

  // Portofolio yang dibuka mengikuti kreator yang dipilih di Home.
  const remoteCreator = publicData?.creators?.find((c) => c.id === creatorId)
  const localCreator = LOCAL_CREATORS.find((c) => c.id === creatorId)
  const selected = remoteCreator ?? localCreator ?? null

  // Link publish (#/p/<uid>) membuka portofolio PER PROJECT, bukan profil user.
  const sharedUid = publicUidFromHash()
  const projectName =
    publicData?.folders?.[0]?.name ??
    publicData?.scenes?.[0]?.project?.title ??
    null

  const displayName = sharedUid
    ? projectName ?? "Project Virtour360"
    : selected?.name ?? publicData?.profile.name ?? user?.name ?? "Kreator Virtour360"
  const displayInitials = sharedUid
    ? (projectName ?? "Project").slice(0, 2).toUpperCase()
    : selected?.initials ?? publicData?.profile.initials ?? user?.initials ?? "V3"

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
  const isLocked = access === "draft" || (access === "password" && !unlocked)

  const unlock = () => {
    const expected = publicData?.passwordHash ?? ""
    if (hashPassword(gatePassword) !== expected) {
      setGateError("Password salah.")
      return
    }
    sessionStorage.setItem(gateKey, "1")
    setUnlocked(true)
    setGateError("")
  }

  if (isLocked) {
    return (
      <div className="grid h-full w-full place-items-center bg-[#061224] px-4 text-[#DCE9F7]">
        <div className="w-full max-w-sm rounded-2xl border border-[#1E4A78] bg-[#0B1F3A] p-6 text-center shadow-xl">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#123153] text-[#7F9FBF]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          </div>
          <h1 className="mt-4 text-lg font-bold">
            {access === "draft" ? "Tour masih dalam draft" : "Tour dilindungi password"}
          </h1>
          <p className="mt-2 text-xs text-[#7F9FBF]">
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
                className="h-10 rounded-lg border border-[#1E4A78] px-3 text-sm outline-none focus:border-sky-500"
              />
              {gateError && <p className="text-[11px] text-red-500">{gateError}</p>}
              <button onClick={unlock} className="h-10 rounded-lg bg-sky-500 text-sm font-semibold text-white hover:bg-sky-600">Buka tour</button>
            </div>
          )}
          <button onClick={() => navigate("home")} className="mt-4 text-[11px] text-[#5A7FA8] hover:underline">Kembali ke Home</button>
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
    <div ref={rootRef} id="portfolio-root" style={rootStyle} className="h-full w-full overflow-y-auto bg-[#061224] text-[#DCE9F7]">
      <Header onCreate={() => setAuthOpen(true)} onLogin={() => setAuthOpen(true)} userName={user?.name} query={query} onQuery={setQuery} primaryColor={design.theme.primaryColor} hideActions={access !== "public"} />
      <ProfileHeader
        name={displayName}
        initials={displayInitials}
        postCount={posts.length}
        tourCount={tours.length}
        likes={favorites.length}
        badge={sharedUid ? `by Project · /p/${sharedUid}` : undefined}
        showBadge={!design.theme.hideProjectTitle}
      />

      <div className="mx-auto max-w-[1200px] px-4 pb-28 sm:px-6 lg:px-8">
        {/* Struktur folder hasil publish: Project   → Scenes */}
        {!selected && !!publicData?.folders?.length && (
          <section className="mt-4 rounded-2xl bg-[#0B1F3A] p-6" id="portfolio-folders">
            <SectionTitle>Project &amp; folder</SectionTitle>
            <p className="mb-4 text-xs text-[#7F9FBF]">
              {publicData.folders.length} folder dipublikasikan · klik untuk melihat scene di dalamnya
            </p>
            <div className="flex flex-col gap-3">
              {publicData.folders.map((folder) => {
                const scenes = folder.sceneIds
                  .map((id) => sourceScenes.find((scene) => scene.id === id))
                  .filter((scene): scene is NonNullable<typeof scene> => !!scene)
                const open = openFolder === folder.id
                return (
                  <div key={folder.id} className="overflow-hidden rounded-xl border border-[#1E4A78] bg-[#0B1F3A]">
                    <button
                      onClick={() => setOpenFolder(open ? null : folder.id)}
                      className="flex w-full items-center gap-3 p-3 text-left hover:bg-[#0F294B]"
                    >
                      <img src={folder.cover} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[#DCE9F7]">{folder.name}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-[#7F9FBF]">
                          {folder.description}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          {folder.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-full bg-[#123153] px-2 py-0.5 text-[9px] text-[#7F9FBF]">{tag}</span>
                          ))}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-[#123153] px-2.5 py-1 text-[10px] font-semibold text-[#7F9FBF]">
                        <Folder size={10} className="mr-1 inline" />{scenes.length} scene
                      </span>
                      <ChevronDown size={15} className={`shrink-0 text-[#5A7FA8] transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && (
                      <div className="animate-fade-up grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-4 border-t border-slate-100 p-4">
                        {scenes.map((scene) => (
                          <Card
                            key={scene.id}
                            item={{
                              id: scene.id,
                              title: scene.name,
                              image: scene.thumbnail,
                              panorama: scene.panorama,
                              count: 1,
                              sceneId: scene.id,
                            }}
                            favorite={favorites.includes(scene.id)}
                            onToggleFavorite={() => toggleFavorite(scene.id)}
                            onOpen={() =>
                              setDetail({
                                id: scene.id,
                                title: scene.name,
                                image: scene.thumbnail,
                                panorama: scene.panorama,
                                count: 1,
                                sceneId: scene.id,
                              })
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {query && (
          <p className="mt-4 text-xs text-[#7F9FBF]">
            Hasil pencarian "{query}" — {posts.filter(matches).length} post, {tours.filter(matches).length} tour.
          </p>
        )}

        <section className="mt-4 rounded-2xl bg-[#0B1F3A] p-6" id="portfolio-explore">
          <SectionTitle>{sharedUid ? `360° posts — ${displayName}` : `360° posts by ${displayInitials}`}</SectionTitle>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,220px),1fr))] gap-6">
            {shownPosts.map((item) => (
              <Card
                key={item.id}
                item={item}
                favorite={favorites.includes(item.id)}
                onToggleFavorite={() => toggleFavorite(item.id)}
                onOpen={() => setDetail(item)}
              />
            ))}
          </div>
          {shownPosts.length === 0 && <p className="py-8 text-center text-xs text-[#7F9FBF]">Tidak ada post yang cocok.</p>}
          {posts.length > 4 && (
            <div className="mt-6 text-center">
              <button onClick={() => setAllPosts((v) => !v)} className="rounded-full bg-[#123153] px-5 py-2 text-xs font-semibold text-white">
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

        <section className="mt-10 rounded-2xl bg-[#0B1F3A] p-6" id="portfolio-tours">
          <SectionTitle>{sharedUid ? `Virtual tours — ${displayName}` : `Virtual tours by ${displayInitials}`}</SectionTitle>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-6">
            {shownTours.map((item) => (
              <Card
                key={item.id}
                item={item}
                favorite={favorites.includes(item.id)}
                onToggleFavorite={() => toggleFavorite(item.id)}
                onOpen={() => setDetail(item)}
              />
            ))}
          </div>
          {shownTours.length === 0 && <p className="py-8 text-center text-xs text-[#7F9FBF]">Tidak ada tour yang cocok.</p>}
          {tours.length > 3 && (
            <div className="mt-6 text-center">
              <button onClick={() => setAllTours((v) => !v)} className="rounded-full bg-[#123153] px-5 py-2 text-xs font-semibold text-white">
                {allTours ? "View less" : "View more"}
              </button>
            </div>
          )}
        </section>

        <div className="mt-8 flex items-center gap-3 rounded-xl border border-[#1E4A78] bg-[#0B1F3A] p-5" id="portfolio-map">
          <MapPin size={20} className="shrink-0 text-sky-500" />
          <div>
            <h3 className="text-sm font-bold text-[#DCE9F7]">Lokasi &amp; kontak</h3>
            <p className="mt-1 text-xs text-[#7F9FBF]">{profile.location} · {profile.email}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-[#1E4A78] bg-[#0B1F3A] p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold text-[#DCE9F7]">Share your world in 360</h3>
            <p className="mt-1 text-xs text-[#7F9FBF]">
              Turn this dead-end into your next discovery by publishing your own panorama.
            </p>
          </div>
          <button onClick={() => setAuthOpen(true)} className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#4CC9F0] px-4 text-xs font-semibold text-[#061224] hover:bg-[#7ADDF5]">
            Upload your own 360   →
          </button>
        </div>

        {/* Call To Action dari panel Design */}
        {design.cta.title && (
          <div
            className={`mt-8 flex items-center justify-between gap-4 rounded-xl border border-[#1E4A78] bg-[#0B1F3A] p-4 ${design.cta.position === "left" ? "flex-row-reverse" : ""}`}
            style={{ marginInline: design.cta.offset }}
          >
            <div>
              <p className="text-sm font-bold text-[#DCE9F7]">{design.cta.title}</p>
              <p className="mt-0.5 text-xs text-[#7F9FBF]">{design.cta.description}</p>
            </div>
            <a
              href={design.cta.href}
              className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-[#061224]"
              style={{ background: design.theme.primaryColor }}
            >
              {design.cta.layout === "bubble" ? "Hubungi" : "Lihat detail"}
            </a>
          </div>
        )}

        {/* Copyright / branding dari panel Setting */}
        {design.setting.copyrightEnabled && (
          <div className="py-8 text-center text-[10px] text-[#5A7FA8]">
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
      <FloatingNav />
    </div>
  )
}
