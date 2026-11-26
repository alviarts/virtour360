import { useEffect, useMemo, useState } from "react"
import { Bell, Camera, Compass, Heart, MapPin, Search, User } from "lucide-react"
import { Logo360 } from "../components/ui/Logo360"
import { PublicViewerModal } from "../components/viewer/PublicViewerModal"
import { useApp } from "../context/useApp"
import { navigate, navigateCreator } from "../lib/navigation"
import { LOCAL_CREATORS } from "../data/creators"
import { buildCreatorScenes, buildExampleScenes } from "../data/examples"
import type { Scene } from "../types/tour"
import { loadPublicPayload, publicShareUrl, type PublicPayload } from "../lib/publicStore"

interface GalleryItem {
  id: string
  title: string
  image: string
  panorama: string
  category: string
  views: string
}

/** Tiap entri memakai panorama berbeda — tidak ada gambar yang dipakai dua kali. */
const ITEMS: GalleryItem[] = [
  { id: "h1", title: "Atrium — The Gallery", image: "/media/thumbnails/entrance_hall.jpg", panorama: "/media/panoramas/entrance_hall.jpg", category: "Interior", views: "2,4 rb" },
  { id: "h2", title: "Studio — Creative Room", image: "/media/thumbnails/art_studio.jpg", panorama: "/media/panoramas/art_studio.jpg", category: "Interior", views: "1,8 rb" },
  { id: "h3", title: "Terrace — Sunset View", image: "/media/thumbnails/hotel_room.jpg", panorama: "/media/panoramas/hotel_room.jpg", category: "Outdoor", views: "3,1 rb" },
  { id: "h4", title: "Ballroom", image: "/media/thumbnails/ballroom.jpg", panorama: "/media/panoramas/ballroom.jpg", category: "Arsitektur", views: "871" },
  { id: "h5", title: "Atelier seniman", image: "/media/thumbnails/artist_workshop.jpg", panorama: "/media/panoramas/artist_workshop.jpg", category: "Interior", views: "1,2 rb" },
  { id: "h6", title: "Cerro Toco", image: "/media/thumbnails/cerro-toco-0.jpg", panorama: "/media/panoramas/cerro-toco-0.jpg", category: "Travel", views: "4,7 rb" },
  { id: "h7", title: "Key Biscayne", image: "/media/thumbnails/key-biscayne-1.jpg", panorama: "/media/panoramas/key-biscayne-1.jpg", category: "Travel", views: "2,9 rb" },
  { id: "h8", title: "Dari atas pohon", image: "/media/thumbnails/from-tree.jpg", panorama: "/media/panoramas/from-tree.jpg", category: "Outdoor", views: "640" },
]

const CATEGORIES = ["Semua", "Interior", "Outdoor", "Travel", "Arsitektur", "Properti", "Publish"]

/** Satu cincin per panorama, satu tick per sudut pandang. */
function TourRing({ count, label }: { count: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-[12px] text-[#9BB8D4]">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7" stroke="#4CC9F0" strokeWidth="1.2" opacity="0.7" />
        {Array.from({ length: Math.min(Math.max(count, 3), 9) }, (_, i) => {
          const angle = (i / Math.min(Math.max(count, 3), 9)) * 360
          return <line key={i} x1="10" y1="1.5" x2="10" y2="4" stroke="#4CC9F0" strokeWidth="1.2" transform={`rotate(${angle} 10 10)`} />
        })}
        <circle cx="10" cy="10" r="1.4" fill="#4CC9F0" />
      </svg>
      {label}
    </span>
  )
}

export function PublicHomeView() {
  const { user, setAuthOpen, favorites, toggleFavorite, notify } = useApp()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("Semua")
  const [exploring, setExploring] = useState<GalleryItem | null>(null)
  const [exploringScenes, setExploringScenes] = useState<Scene[] | null>(null)
  const [publicData, setPublicData] = useState<PublicPayload | null>(null)
  const [typed, setTyped] = useState("")
  const [heroView, setHeroView] = useState({ yaw: 0, pitch: 0 })
  const exampleScenes = useMemo(() => buildExampleScenes(), [])
  const publishedUid = typeof window !== "undefined" ? localStorage.getItem("virtour360.publishedUid") : null

  // Satu efek mengetik di kolom cari, bukan animasi di setiap bagian.
  useEffect(() => {
    if (query) { setTyped(""); return }
    const phrases = ["Cari panorama, tempat, atau kreator", "CariApartemen 360°", "Cari ruang publik"]
    let phrase = 0
    let char = 0
    let deleting = false
    const timer = window.setInterval(() => {
      const full = phrases[phrase]
      if (!deleting) {
        char += 1
        setTyped(full.slice(0, char))
        if (char >= full.length) deleting = true
      } else {
        char -= 1
        setTyped(full.slice(0, Math.max(0, char)))
        if (char <= 0) { deleting = false; phrase = (phrase + 1) % phrases.length }
      }
    }, 90)
    return () => window.clearInterval(timer)
  }, [query])

  useEffect(() => {
    let alive = true
    const refresh = () => loadPublicPayload().then((data) => { if (alive && data) setPublicData(data) })
    refresh()
    window.addEventListener("focus", refresh)
    return () => { alive = false; window.removeEventListener("focus", refresh) }
  }, [])

  const publishedItems: GalleryItem[] = useMemo(
    () => (publicData?.scenes ?? []).map((scene, index) => ({
      id: `pub-${scene.id}`,
      title: scene.name,
      image: scene.thumbnail,
      panorama: scene.panorama,
      category: "Publish",
      views: `${index + 1} scene`,
    })),
    [publicData],
  )

  // Hilangkan duplikat berdasarkan gambar + judul sebelum dirender.
  const allItems = useMemo(() => {
    const seen = new Set<string>()
    return [...publishedItems, ...ITEMS].filter((item) => {
      const key = `${item.image}|${item.title.toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [publishedItems])

  const results = useMemo(
    () => allItems.filter((item) =>
      item.title.toLowerCase().includes(query.trim().toLowerCase()) &&
      (category === "Semua" || item.category === category)),
    [allItems, query, category],
  )

  const publishedCreators = useMemo(() => {
    const list: { id: string; name: string; initials: string; color: string; title: string; image: string; panorama: string; views: string; kind: "own" | "remote" | "local" }[] = []
    if (user && publishedUid) {
      list.push({
        id: publishedUid,
        name: user.name,
        initials: user.initials ?? user.name.slice(0, 2).toUpperCase(),
        color: "bg-[#123153] text-[#DCE9F7]",
        title: publicData?.folders?.[0]?.name ?? "Tour yang kamu publish",
        image: publicData?.scenes?.[0]?.thumbnail ?? "/media/thumbnails/entrance_hall.jpg",
        panorama: publicData?.scenes?.[0]?.panorama ?? "/media/panoramas/entrance_hall.jpg",
        views: `${publicData?.scenes?.length ?? 1} scene`,
        kind: "own" as const,
      })
    }
    for (const creator of publicData?.creators ?? []) {
      list.push({
        id: creator.id,
        name: creator.name,
        initials: creator.initials,
        color: creator.color,
        title: creator.posts?.[0]?.title ?? "Panorama 360°",
        image: creator.posts?.[0]?.image ?? "/media/thumbnails/ballroom.jpg",
        panorama: creator.posts?.[0]?.panorama ?? "/media/panoramas/ballroom.jpg",
        views: creator.posts?.[0]?.views ?? "1 karya",
        kind: "remote" as const,
      })
    }
    const seen = new Set<string>()
    const local = LOCAL_CREATORS.map((c) => ({
      id: c.id, name: c.name, initials: c.initials, color: c.color,
      title: c.title,
      image: c.image,
      panorama: c.panorama,
      views: c.views,
      kind: "local" as const,
    }))
    return [...list, ...local].filter((c) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
  }, [user, publishedUid, publicData])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: allItems.length }
    for (const item of allItems) counts[item.category] = (counts[item.category] ?? 0) + 1
    return counts
  }, [allItems])

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  const openItem = (item: GalleryItem, scenes?: Scene[]) => {
    setExploringScenes(scenes ?? exampleScenes)
    setExploring(item)
  }

  return (
    <div id="home-root" className="h-full w-full overflow-y-auto bg-[#061224] text-[#DCE9F7]">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#1E4A78] bg-[#061224]/92 px-5 backdrop-blur">
        <div className="flex items-center gap-7">
          <button onClick={() => scrollTo("home-root")} aria-label="Ke atas"><Logo360 tone="white" size={28} /></button>
          <nav className="hidden items-center gap-6 text-[13px] text-[#7F9FBF] md:flex">
            <button onClick={() => scrollTo("home-explore")} className="hover:text-[#DCE9F7]">Jelajahi</button>
            <button onClick={() => scrollTo("home-categories")} className="hover:text-[#DCE9F7]">Kategori</button>
            <button onClick={() => navigate("portfolio")} className="hover:text-[#DCE9F7]">Portofolio</button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (user ? navigate("dashboard") : setAuthOpen(true))}
            className="flex h-9 items-center gap-2 rounded-full bg-[#4CC9F0] px-4 text-xs font-semibold text-[#061224] transition-colors hover:bg-[#7ADDF5]"
          >
            <Camera size={14} /> Buat tour
          </button>
          <button
            onClick={() => (user ? navigate("dashboard") : setAuthOpen(true))}
            className="flex h-9 items-center gap-2 rounded-full border border-[#1E4A78] px-4 text-xs font-medium text-[#DCE9F7] hover:bg-[#123153]"
          >
            <Compass size={14} /> Studio
          </button>
          {user && (
            <button onClick={() => notify("Tidak ada notifikasi baru.")} className="grid size-9 place-items-center rounded-full border border-[#1E4A78] text-[#7F9FBF]" title="Notifikasi">
              <Bell size={15} />
            </button>
          )}
          <button
            onClick={() => (user ? navigate("dashboard") : setAuthOpen(true))}
            className="flex h-9 items-center gap-2 rounded-full border border-[#1E4A78] px-4 text-xs font-medium text-[#DCE9F7] hover:bg-[#123153]"
          >
            <span className="grid size-5 place-items-center rounded-full bg-[#123153] text-[9px] font-bold text-[#4CC9F0]">{user?.initials ?? "?"}</span>
            {user ? user.name : "Masuk"}
          </button>
        </div>
      </header>

      {/* Hero: teks di kiri, satu jendela panorama di kanan. */}
      <section className="border-b border-[#1E4A78] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative max-w-xl">
            <div className="pointer-events-none absolute -left-16 -top-20 size-72 rounded-full bg-[#4CC9F0]/10 blur-[90px]" />
            <TourRing count={8} label="Delapan sudut pandang" />
            <h1 className="relative mt-5 font-[family-name:var(--font-display)] text-[42px] font-semibold leading-[1.06] tracking-tight text-[#EFF6FD] sm:text-[56px]">
              Jelajahi dunia dalam satu panorama
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#7F9FBF]">
              Temukan ruang, tempat, dan karya 360°. Geser untuk melihat setiap sudutnya, lalu bagikan milikmu sendiri.
            </p>
            <div className="mt-7 flex h-12 max-w-md items-center gap-2 rounded-full border border-[#1E4A78] bg-[#0B1F3A] px-4">
              <Search size={17} className="shrink-0 text-[#7F9FBF]" />
              <div className="relative min-w-0 flex-1">
                {!query && (
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-sm text-[#5A7FA8]">
                    {typed}<span className="typing-caret text-[#4CC9F0]">|</span>
                  </span>
                )}
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Cari panorama, tempat, atau kreator"
                  className="relative w-full bg-transparent text-sm text-[#DCE9F7] outline-none"
                />
              </div>
              <button onClick={() => scrollTo("home-explore")} className="h-8 shrink-0 rounded-full bg-[#4CC9F0] px-4 text-xs font-semibold text-[#061224]">Cari</button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-2 text-xs text-[#5A7FA8]">
              <span>1.200+ panorama</span>
              <span>340 kreator</span>
              <span>86 ribu eksplorasi</span>
            </div>
          </div>

          <div
            className="relative h-[300px] overflow-hidden rounded-[22px] border border-[#1E4A78] bg-[#0B1F3A] sm:h-[380px]"
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect()
              setHeroView({
                yaw: Math.round(((event.clientX - rect.left) / rect.width) * 360 - 180),
                pitch: Math.round(90 - ((event.clientY - rect.top) / rect.height) * 180),
              })
            }}
          >
            <div
              className="hero-360 absolute inset-0"
              style={{
                backgroundImage: "url(/media/panoramas/entrance_hall.jpg)",
                backgroundSize: "220% 100%",
                backgroundPosition: "0% 50%",
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061224] via-[#061224]/10 to-transparent" />
            {/* Garis orientasi: horizon + pembagi, bukan dekorasi generic */}
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[#4CC9F0]/25" />
            <div className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-[#DCE9F7]/10" />
            <div className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-[#DCE9F7]/10" />
            <div className="pointer-events-none absolute right-4 top-4 rounded-md bg-[#061224]/80 px-2 py-1 font-[family-name:var(--font-mono)] text-[10px] text-[#4CC9F0] backdrop-blur">
              {heroView.yaw >= 0 ? "+" : ""}{heroView.yaw}° / {heroView.pitch >= 0 ? "+" : ""}{heroView.pitch}°
            </div>
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
              <div>
                <span className="rounded-full bg-[#4CC9F0] px-2.5 py-1 text-[10px] font-semibold text-[#061224]">360°</span>
                <p className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold text-[#EFF6FD]">Atrium — The Gallery</p>
                <p className="text-[11px] text-[#9BB8D4]">Panorama interior · 2,4 ribu penayangan</p>
              </div>
              <button
                onClick={() => openItem(ITEMS[0])}
                className="h-10 shrink-0 rounded-full bg-[#DCE9F7] px-4 text-xs font-semibold text-[#061224] hover:bg-white"
              >
                Buka panorama
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1180px] px-5 pb-28 sm:px-8">
        <section id="home-explore" className="pt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#EFF6FD]">Panorama pilihan</h2>
              <p className="mt-1 text-xs text-[#7F9FBF]">Tempat yang paling sering dijelajahi</p>
            </div>
            <button onClick={() => { setCategory("Semua"); setQuery("") }} className="text-xs font-semibold text-[#4CC9F0] hover:text-[#7ADDF5]">Lihat semua</button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((item, index) => {
              const favorite = favorites.includes(item.id)
              const feature = index === 0 && category === "Semua" && !query
              return (
                <article
                  key={item.id}
                  className={`group overflow-hidden border border-[#1E4A78] bg-[#0B1F3A] ${feature ? "rounded-[20px] sm:col-span-2" : "rounded-[12px]"}`}
                >
                  <div className={`relative overflow-hidden ${feature ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
                    <button onClick={() => openItem(item)} className="block h-full w-full">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                    </button>
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      title={favorite ? "Hapus dari favorit" : "Simpan ke favorit"}
                      className={`absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-[#061224]/70 text-[#DCE9F7] backdrop-blur ${favorite ? "text-[#4CC9F0]" : ""}`}
                    >
                      <Heart size={14} fill={favorite ? "currentColor" : "none"} />
                    </button>
                    <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-[#061224]/80 px-2 py-1 text-[10px] font-semibold text-[#4CC9F0] backdrop-blur">360°</span>
                    <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-[#061224]/80 px-2 py-1 text-[10px] text-[#9BB8D4] backdrop-blur">{item.views}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-4">
                    <button onClick={() => openItem(item)} className="min-w-0 truncate text-left text-[13px] font-semibold text-[#DCE9F7] hover:text-[#4CC9F0]">{item.title}</button>
                    {feature ? <TourRing count={4} label={item.category} /> : <span className="shrink-0 text-[11px] text-[#5A7FA8]">{item.category}</span>}
                  </div>
                </article>
              )
            })}
          </div>
          {results.length === 0 && (
            <p className="py-12 text-center text-sm text-[#7F9FBF]">Tidak ada panorama yang cocok.</p>
          )}
        </section>

        <section id="home-creators" className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#EFF6FD]">Kreator yang sudah mempublikasikan</h2>
              <p className="mt-1 text-xs text-[#7F9FBF]">Karya mereka bisa dibuka langsung dari sini</p>
            </div>
            <span className="rounded-full border border-[#1E4A78] px-3 py-1 text-[11px] text-[#7F9FBF]">{publishedCreators.length} kreator</span>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {publishedCreators.map((creator, index) => (
              <button
                key={creator.id}
                onClick={() => {
                  if (creator.kind === "own" && publicData?.scenes?.length) {
                    openItem({ id: creator.id, title: creator.title, image: creator.image, panorama: creator.panorama, category: "Publish", views: creator.views }, publicData.scenes)
                  } else if (creator.kind === "local") {
                    navigateCreator(creator.id)
                  } else {
                    openItem({ id: creator.id, title: creator.title, image: creator.image, panorama: creator.panorama, category: "Publish", views: creator.views }, buildCreatorScenes(index))
                  }
                }}
                className="flex items-center gap-3 rounded-[12px] border border-[#1E4A78] bg-[#0B1F3A] p-3 text-left transition-colors hover:border-[#4CC9F0]"
              >
                <img src={creator.image} alt="" className="size-14 shrink-0 rounded-[8px] object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[9px] font-bold ${creator.color}`}>{creator.initials}</span>
                    <span className="truncate text-[13px] font-semibold text-[#DCE9F7]">{creator.name}</span>
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-[#7F9FBF]">{creator.title}</span>
                </span>
                <span className="shrink-0 text-[10px] text-[#5A7FA8]">{creator.views}</span>
              </button>
            ))}
          </div>
          {publishedUid && user && (
            <p className="mt-3 text-[11px] text-[#5A7FA8]">
              Tour kamu: <a href={publicShareUrl(publishedUid)} className="text-[#4CC9F0] hover:underline">/p/{publishedUid}</a>
            </p>
          )}
        </section>

        <section id="home-categories" className="mt-16">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[#EFF6FD]">Jelajahi berdasarkan kategori</h2>
          <p className="mt-1 text-xs text-[#7F9FBF]">Pilih satu untuk memfilter panorama di atas</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                onClick={() => { setCategory(item); scrollTo("home-explore") }}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  category === item
                    ? "border-[#4CC9F0] bg-[#4CC9F0] text-[#061224]"
                    : "border-[#1E4A78] bg-[#0B1F3A] text-[#9BB8D4] hover:border-[#4CC9F0]"
                }`}
              >
                {item}
                <span className={category === item ? "text-[#061224]/60" : "text-[#5A7FA8]"}>{categoryCounts[item] ?? 0}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="mt-16 flex flex-col items-start justify-between gap-5 rounded-[20px] border border-[#1E4A78] bg-[#0B1F3A] p-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#123153] text-[#4CC9F0]"><MapPin size={18} /></span>
            <div>
              <h3 className="text-sm font-semibold text-[#DCE9F7]">Punya panorama 360° sendiri?</h3>
              <p className="mt-1 text-xs text-[#7F9FBF]">Unggah dan bagikan karyamu dalam beberapa menit.</p>
            </div>
          </div>
          <button onClick={() => setAuthOpen(true)} className="h-10 shrink-0 rounded-full bg-[#4CC9F0] px-5 text-xs font-semibold text-[#061224] hover:bg-[#7ADDF5]">Unggah panorama 360°</button>
        </div>
      </main>

      <footer className="border-t border-[#1E4A78] bg-[#061224] px-6 py-8">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo360 tone="white" size={26} />
          <p className="text-[11px] text-[#5A7FA8]">© 2026 Virtour360 — Jelajahi dunia dalam satu panorama.</p>
          <button onClick={() => navigate("portfolio")} className="flex items-center gap-1.5 text-xs text-[#7F9FBF] hover:text-[#DCE9F7]"><User size={13} /> Portofolio</button>
        </div>
      </footer>

      <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#1E4A78] bg-[#0B1F3A]/95 px-2 py-1.5 backdrop-blur">
        <button onClick={() => scrollTo("home-root")} className="flex items-center gap-1.5 rounded-full bg-[#123153] px-3 py-1.5 text-xs font-medium text-[#DCE9F7]"><Compass size={14} /> Home</button>
        <button onClick={() => scrollTo("home-explore")} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-[#7F9FBF] hover:text-[#DCE9F7]"><MapPin size={14} /> Jelajahi</button>
        <button onClick={() => navigate("portfolio")} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-[#7F9FBF] hover:text-[#DCE9F7]"><User size={14} /> Author</button>
        <button onClick={() => scrollTo("home-categories")} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-[#7F9FBF] hover:text-[#DCE9F7]"><Search size={14} /> Kategori</button>
      </div>

      {exploring && (
        <PublicViewerModal
          title={exploring.title}
          panorama={exploring.panorama}
          scenes={exploringScenes ?? exampleScenes}
          sceneId={exploring.id}
          onClose={() => { setExploring(null); setExploringScenes(null) }}
        />
      )}
    </div>
  )
}
