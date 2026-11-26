import { useEffect, useMemo, useState } from "react"
import { Camera, Compass, Heart, Search, User } from "lucide-react"
import { Logo360 } from "../components/ui/Logo360"
import { PublicViewerModal } from "../components/viewer/PublicViewerModal"
import { useApp } from "../context/useApp"
import { navigate, navigateCreator, navigateHash } from "../lib/navigation"
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

/** Penanda sudut pandang: satu tick per panorama, tanpa dekorasi tambahan. */
function RingTicks({ count }: { count: number }) {
  const n = Math.min(Math.max(count, 3), 9)
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.2" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      {Array.from({ length: n }, (_, i) => (
        <line key={i} x1="7" y1="0.8" x2="7" y2="2.6" stroke="currentColor" strokeWidth="1" transform={`rotate(${(i / n) * 360} 7 7)`} />
      ))}
    </svg>
  )
}

export function PublicHomeView() {
  const { user, setAuthOpen, favorites, toggleFavorite } = useApp()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("Semua")
  const [exploring, setExploring] = useState<GalleryItem | null>(null)
  const [exploringScenes, setExploringScenes] = useState<Scene[] | null>(null)
  const [publicData, setPublicData] = useState<PublicPayload | null>(null)
  const [typed, setTyped] = useState("")
  const [heroView, setHeroView] = useState({ yaw: 0, pitch: 0 })
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const exampleScenes = useMemo(() => buildExampleScenes(), [])
  const publishedUid = typeof window !== "undefined" ? localStorage.getItem("virtour360.publishedUid") : null

  useEffect(() => {
    if (query) { setTyped(""); return }
    const phrases = ["Cari panorama, tempat, atau kreator", "Cari Apartemen 360°", "Cari ruang publik"]
    let phrase = 0, char = 0, deleting = false
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
    () => (publicData?.scenes ?? []).map((scene, i) => ({
      id: `pub-${scene.id}`, title: scene.name, image: scene.thumbnail,
      panorama: scene.panorama, category: "Publish", views: `${i + 1} scene`,
    })),
    [publicData],
  )

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
    const list: { id: string; name: string; initials: string; title: string; image: string; panorama: string; views: string; kind: "own" | "remote" | "local" }[] = []
    if (user && publishedUid) {
      list.push({
        id: publishedUid, name: user.name, initials: user.initials ?? user.name.slice(0, 2).toUpperCase(),
        title: publicData?.folders?.[0]?.name ?? "Tour yang kamu publish",
        image: publicData?.scenes?.[0]?.thumbnail ?? ITEMS[0].image,
        panorama: publicData?.scenes?.[0]?.panorama ?? ITEMS[0].panorama,
        views: `${publicData?.scenes?.length ?? 1} scene`, kind: "own",
      })
    }
    for (const creator of publicData?.creators ?? []) {
      list.push({
        id: creator.id, name: creator.name, initials: creator.initials,
        title: creator.posts?.[0]?.title ?? "Panorama 360°",
        image: creator.posts?.[0]?.image ?? ITEMS[3].image,
        panorama: creator.posts?.[0]?.panorama ?? ITEMS[3].panorama,
        views: creator.posts?.[0]?.views ?? "1 karya", kind: "remote",
      })
    }
    const local = LOCAL_CREATORS.map((c) => ({
      id: c.id, name: c.name, initials: c.initials, title: c.title,
      image: c.image, panorama: c.panorama, views: c.views, kind: "local" as const,
    }))
    const seen = new Set<string>()
    return [...list, ...local].filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true })
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
  const goCreate = () => user ? navigate("dashboard") : setAuthOpen(true)

  return (
    <div id="home-root" className="h-full w-full overflow-y-auto bg-[#0A0E17] text-[#F5F7FA] antialiased">
      <header className="sticky top-0 z-30 border-b border-[#202A3A] bg-[#0A0E17]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <button onClick={() => scrollTo("home-root")} aria-label="Ke atas"><Logo360 tone="white" size={24} /></button>
            <nav className="hidden items-center gap-6 text-[13px] text-[#8C97A8] md:flex">
              <button onClick={() => scrollTo("home-explore")} className="hover:text-[#F5F7FA]">Jelajahi</button>
              <button onClick={() => scrollTo("home-categories")} className="hover:text-[#F5F7FA]">Kategori</button>
              <button onClick={() => navigate("portfolio")} className="hover:text-[#F5F7FA]">Portofolio</button>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goCreate} className="flex h-8 items-center gap-1.5 rounded-md bg-[#F5F7FA] px-3 text-xs font-medium text-[#0A0E17] hover:bg-white">
              <Camera size={13} /> Buat tour
            </button>
            <button onClick={goCreate} className="flex h-8 items-center gap-1.5 rounded-md border border-[#202A3A] px-3 text-xs text-[#C7D0DD] hover:bg-[#151D2B]">
              <Compass size={13} /> Studio
            </button>
            <button onClick={goCreate} className="ml-2 flex h-8 items-center gap-2 rounded-md px-2 text-xs text-[#8C97A8] hover:text-[#F5F7FA]">
              <span className="grid size-5 place-items-center rounded bg-[#151D2B] text-[9px] font-medium text-[#7AA2FF]">{user?.initials ?? "?"}</span>
              {user ? user.name : "Masuk"}
            </button>
          </div>
        </div>
      </header>

      <section
        className="relative overflow-hidden border-b border-[#202A3A] px-5 pb-24 pt-14 sm:px-8 lg:pb-32 lg:pt-20"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
          const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1
          setParallax({ x: nx, y: ny })
          setHeroView({
            yaw: Math.round(nx * 180),
            pitch: Math.round(-ny * 90),
          })
        }}
        onPointerLeave={() => { setParallax({ x: 0, y: 0 }); setHeroView({ yaw: 0, pitch: 0 }) }}
      >
        {/* Layer 0 — grid perspektif yang masuk ke dalam halaman */}
        <div
          className="pointer-events-none absolute inset-x-[-20%] bottom-[-30%] top-[30%] opacity-[0.18]"
          style={{
            backgroundImage: "linear-gradient(#7AA2FF33 1px,transparent 1px),linear-gradient(90deg,#7AA2FF33 1px,transparent 1px)",
            backgroundSize: "48px 48px",
            transform: `perspective(520px) rotateX(62deg) translate(${parallax.x * -14}px, ${parallax.y * -8}px) scale(1.25)`,
            maskImage: "linear-gradient(to bottom, transparent, black 35%, transparent 90%)",
          }}
        />
        {/* Layer 1 — cahaya redup di belakang judul */}
        <div
          className="pointer-events-none absolute -left-24 top-10 size-[420px] rounded-full bg-[#7AA2FF]/[0.07] blur-[110px]"
          style={{ transform: `translate(${parallax.x * -22}px, ${parallax.y * -14}px)` }}
        />
        <div className="relative z-10 mx-auto max-w-[1200px]">
          <div className="flex items-center gap-2 text-[11px] text-[#7AA2FF]">
            <RingTicks count={allItems.length} /> Virtour360 · arsip panorama
          </div>
          <h1
            className="mt-6 max-w-[820px] text-[40px] font-medium leading-[1.05] tracking-[-0.04em] text-[#F5F7FA] sm:text-[58px]"
            style={{ transform: `translate(${parallax.x * 6}px, ${parallax.y * 3}px)` }}
          >
            Jelajahi dunia dalam satu panorama
            <span className="text-[#8C97A8]">. Pilih sudutnya, lalu bagikan milikmu.</span>
          </h1>
          <p className="mt-5 max-w-[540px] text-[14px] leading-relaxed text-[#8C97A8]">
            Kumpulan ruang dan tempat yang bisa kamu putar, zoom, dan telusuri dari mana saja.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <button onClick={goCreate} className="h-9 rounded-md bg-[#F5F7FA] px-4 text-[13px] font-medium text-[#0A0E17] hover:bg-white">Buat tour</button>
            <button onClick={() => scrollTo("home-explore")} className="h-9 rounded-md border border-[#202A3A] px-4 text-[13px] text-[#C7D0DD] hover:bg-[#151D2B]">Lihat karya</button>
            <span className="ml-3 text-[11px] text-[#5F6B7C]">1.200+ panorama · 340 kreator · 86 ribu eksplorasi</span>
          </div>

          <div className="mt-6 flex h-10 max-w-[560px] items-center gap-2 rounded-md border border-[#202A3A] bg-[#0F1521] px-3">
            <Search size={15} className="shrink-0 text-[#5F6B7C]" />
            <div className="relative min-w-0 flex-1">
              {!query && (
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[13px] text-[#5F6B7C]">
                  {typed}<span className="typing-caret text-[#7AA2FF]">|</span>
                </span>
              )}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Cari panorama, tempat, atau kreator"
                className="relative w-full bg-transparent text-[13px] text-[#F5F7FA] outline-none"
              />
            </div>
          </div>

          {/* Layer 2 — panorama + layer 3 yang melayang di atasnya */}
          <div className="relative mt-12">
            <div className="relative h-[300px] overflow-hidden rounded-lg border border-[#202A3A] bg-[#0F1521] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] sm:h-[380px]">
              <div
                className="hero-360 absolute inset-[-8%]"
                style={{
                  backgroundImage: "url(/media/panoramas/entrance_hall.jpg)",
                  backgroundSize: "220% 100%",
                  backgroundPosition: "0% 50%",
                  transform: `translate(${parallax.x * -18}px, ${parallax.y * -10}px) scale(1.04)`,
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0E17] via-[#0A0E17]/10 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[#7AA2FF]/25" />
              <div className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-[#F5F7FA]/10" />
              <div className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-[#F5F7FA]/10" />
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded border border-[#202A3A]/80 bg-[#0A0E17]/80 px-2 py-1.5 backdrop-blur">
                <img src="/media/thumbnails/entrance_hall.jpg" alt="" className="size-6 rounded-sm object-cover" />
                <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#C7D0DD]">scene 01 / 08</span>
              </div>
            </div>

            {/* Foreground: kartu HUD menimpa tepi panorama dan turun ke seksi berikutnya */}
            <div
              className="relative z-20 mx-4 -mt-16 flex items-center justify-between gap-4 rounded-lg border border-[#202A3A] bg-[#0F1521]/95 px-4 py-3 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:mx-8"
              style={{ transform: `translate(${parallax.x * 12}px, ${parallax.y * 6}px)` }}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded border border-[#202A3A] text-[#7AA2FF]"><RingTicks count={8} /></span>
                <div>
                  <p className="text-[13px] font-medium text-[#F5F7FA]">Atrium — The Gallery</p>
                  <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[#5F6B7C]">8 panorama · 24 sudut</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden rounded border border-[#202A3A] px-2 py-1 font-[family-name:var(--font-mono)] text-[10px] text-[#7AA2FF] sm:inline">
                  {heroView.yaw >= 0 ? "+" : ""}{heroView.yaw}° / {heroView.pitch >= 0 ? "+" : ""}{heroView.pitch}°
                </span>
                <button onClick={() => openItem(ITEMS[0])} className="h-8 shrink-0 rounded-md bg-[#F5F7FA] px-3 text-xs font-medium text-[#0A0E17] hover:bg-white">Buka</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-5 pb-24 sm:px-8">
        <section id="home-explore" className="pt-12">
          <div className="flex items-end justify-between border-b border-[#202A3A] pb-3">
            <div>
              <h2 className="text-[17px] font-medium tracking-[-0.02em] text-[#F5F7FA]">Panorama pilihan</h2>
              <p className="mt-1 text-[12px] text-[#8C97A8]">Yang paling sering dijelajahi</p>
            </div>
            <button onClick={() => { setCategory("Semua"); setQuery("") }} className="text-[12px] text-[#7AA2FF] hover:text-[#A8C5FF]">Lihat semua</button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((item, index) => {
              const favorite = favorites.includes(item.id)
              const feature = index === 0 && category === "Semua" && !query
              return (
                <article
                  key={item.id}
                  className={`${feature ? "relative z-10 -mt-6 sm:col-span-2" : index % 2 === 0 ? "sm:translate-y-6" : ""}`}
                >
                  <div className={`relative overflow-hidden rounded-md ${feature ? "aspect-[16/8]" : "aspect-[4/3]"}`}>
                    <button onClick={() => openItem(item)} className="block h-full w-full">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover opacity-95 transition-opacity hover:opacity-100" />
                    </button>
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      title={favorite ? "Hapus dari favorit" : "Simpan ke favorit"}
                      className={`absolute right-2 top-2 z-10 grid size-7 place-items-center rounded border border-[#202A3A] bg-[#0A0E17]/80 text-[#8C97A8] backdrop-blur ${favorite ? "text-[#7AA2FF]" : ""}`}
                    >
                      <Heart size={13} fill={favorite ? "currentColor" : "none"} />
                    </button>
                    {feature && (
                      <span className="absolute bottom-3 right-3 rounded border border-[#202A3A]/80 bg-[#0A0E17]/80 px-2 py-1 font-[family-name:var(--font-mono)] text-[10px] text-[#C7D0DD] backdrop-blur">
                        360° · pilihan
                      </span>
                    )}
                  </div>
                  <div className={`${feature ? "relative z-20 -mt-8 ml-6 mr-6 flex items-center justify-between gap-3 rounded-md border border-[#202A3A] bg-[#0F1521]/95 px-4 py-3 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.9)] backdrop-blur" : "mt-3 flex items-center justify-between gap-3 border-b border-[#202A3A] pb-3"}`}>
                    <button onClick={() => openItem(item)} className="min-w-0 truncate text-left text-[13px] text-[#F5F7FA] hover:text-[#7AA2FF]">{item.title}</button>
                    <span className="flex shrink-0 items-center gap-2 font-[family-name:var(--font-mono)] text-[10px] text-[#5F6B7C]">
                      <RingTicks count={4} /> {item.category} · {item.views}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
          {results.length === 0 && <p className="py-12 text-center text-[13px] text-[#8C97A8]">Tidak ada panorama yang cocok.</p>}
        </section>

        <section id="home-creators" className="mt-16">
          <div className="flex items-end justify-between border-b border-[#202A3A] pb-3">
            <div>
              <h2 className="text-[17px] font-medium tracking-[-0.02em] text-[#F5F7FA]">Kreator yang sudah mempublikasikan</h2>
              <p className="mt-1 text-[12px] text-[#8C97A8]">Satu baris untuk setiap karya</p>
            </div>
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#5F6B7C]">{publishedCreators.length}</span>
          </div>
          <div className="mt-2">
            {publishedCreators.map((creator) => (
              <button
                key={creator.id}
                onClick={() => {
                  if (creator.kind === "own" && publicData?.scenes?.length) {
                    openItem({ id: creator.id, title: creator.title, image: creator.image, panorama: creator.panorama, category: "Publish", views: creator.views }, publicData.scenes)
                    return
                  }
                  const index = LOCAL_CREATORS.findIndex((c) => c.id === creator.id)
                  if (creator.kind === "local" && index >= 0) {
                    openItem({ id: creator.id, title: creator.title, image: creator.image, panorama: creator.panorama, category: "Publish", views: creator.views }, buildCreatorScenes(index))
                  } else if (creator.kind === "local") {
                    navigateCreator(creator.id)
                  } else {
                    navigateHash(`#/p/${creator.id}`)
                  }
                }}
                className="group flex w-full items-center gap-4 border-b border-[#202A3A] py-3 text-left hover:bg-[#0F1521]"
              >
                <img src={creator.image} alt="" className="size-11 shrink-0 rounded object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded bg-[#151D2B] font-[family-name:var(--font-mono)] text-[9px] text-[#7AA2FF]">{creator.initials}</span>
                    <span className="truncate text-[13px] text-[#F5F7FA] group-hover:text-[#7AA2FF]">{creator.name}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-[#8C97A8]">{creator.title}</span>
                </span>
                <span className="shrink-0 font-[family-name:var(--font-mono)] text-[10px] text-[#5F6B7C]">{creator.views}</span>
              </button>
            ))}
          </div>
          {publishedUid && user && (
            <p className="mt-3 font-[family-name:var(--font-mono)] text-[10px] text-[#5F6B7C]">
              tour kamu: <a href={publicShareUrl(publishedUid)} className="text-[#7AA2FF] hover:underline">/p/{publishedUid}</a>
            </p>
          )}
        </section>

        <section id="home-categories" className="mt-16">
          <h2 className="text-[17px] font-medium tracking-[-0.02em] text-[#F5F7FA]">Jelajahi berdasarkan kategori</h2>
          <p className="mt-1 text-[12px] text-[#8C97A8]">Filter panorama di atas</p>
          <div className="mt-4 flex flex-wrap gap-x-6 border-b border-[#202A3A]">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                onClick={() => { setCategory(item); scrollTo("home-explore") }}
                className={`-mb-px border-b py-2 text-[12px] transition-colors ${
                  category === item ? "border-[#F5F7FA] text-[#F5F7FA]" : "border-transparent text-[#8C97A8] hover:text-[#C7D0DD]"
                }`}
              >
                {item} <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#5F6B7C]">{categoryCounts[item] ?? 0}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border border-[#202A3A] rounded-md px-5 py-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-[14px] text-[#F5F7FA]">Punya panorama 360° sendiri?</h3>
            <p className="mt-1 text-[12px] text-[#8C97A8]">Unggah dan bagikan karyamu dalam beberapa menit.</p>
          </div>
          <button onClick={() => setAuthOpen(true)} className="h-8 shrink-0 rounded-md bg-[#F5F7FA] px-3 text-xs font-medium text-[#0A0E17] hover:bg-white">Unggah panorama 360°</button>
        </div>
      </main>

      <footer className="border-t border-[#202A3A] px-6 py-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo360 tone="white" size={22} />
          <p className="font-[family-name:var(--font-mono)] text-[10px] text-[#5F6B7C]">© 2026 Virtour360</p>
          <button onClick={() => navigate("portfolio")} className="flex items-center gap-1.5 text-[11px] text-[#8C97A8] hover:text-[#F5F7FA]"><User size={12} /> Portofolio</button>
        </div>
      </footer>

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
