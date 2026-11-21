import { useEffect, useMemo, useState } from "react"
import { Bell, Camera, Compass, Heart, MapPin, Search, Sparkles, User } from "lucide-react"
import { Logo360 } from "../components/ui/Logo360"
import { PublicViewerModal } from "../components/viewer/PublicViewerModal"
import { useApp } from "../context/AppContext"
import { navigate, navigateCreator } from "../lib/navigation"
import { LOCAL_CREATORS } from "../data/creators"
import { buildExampleScenes } from "../data/examples"
import { loadPublicPayload, type PublicPayload } from "../lib/publicStore"

const ITEMS = [
  { id: "h1", title: "Atrium — The Gallery", image: "/media/thumbnails/key-biscayne-1.jpg", panorama: "/media/panoramas/key-biscayne-1.jpg", category: "Interior", views: "2.4k" },
  { id: "h2", title: "Studio — Creative Room", image: "/media/thumbnails/key-biscayne-2.jpg", panorama: "/media/panoramas/key-biscayne-2.jpg", category: "Interior", views: "1.8k" },
  { id: "h3", title: "Terrace — Sunset View", image: "/media/thumbnails/key-biscayne-3.jpg", panorama: "/media/panoramas/key-biscayne-3.jpg", category: "Outdoor", views: "3.1k" },
  { id: "h4", title: "Living Room 360", image: "/media/thumbnails/key-biscayne-1.jpg", panorama: "/media/panoramas/key-biscayne-2.jpg", category: "Interior", views: "956" },
  { id: "h5", title: "Trungtamyte", image: "/media/thumbnails/key-biscayne-2.jpg", panorama: "/media/panoramas/key-biscayne-1.jpg", category: "Outdoor", views: "1.2k" },
  { id: "h6", title: "Sunset Harbor", image: "/media/thumbnails/key-biscayne-3.jpg", panorama: "/media/panoramas/key-biscayne-3.jpg", category: "Travel", views: "4.7k" },
]

const CATEGORIES = ["Semua", "Interior", "Outdoor", "Travel", "Arsitektur", "Properti", "Publish"]

export function PublicHomeView() {
  const { user, setAuthOpen, favorites, toggleFavorite, notify } = useApp()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("Semua")
  const [exploring, setExploring] = useState<(typeof ITEMS)[number] | null>(null)
  const [publicData, setPublicData] = useState<PublicPayload | null>(null)
  const [typed, setTyped] = useState("")
  const exampleScenes = useMemo(() => buildExampleScenes(), [])

  // Efek mengetik pada kolom pencarian saat kosong.
  useEffect(() => {
    if (query) {
      setTyped("")
      return
    }
    const phrases = [
      "Cari panorama, tempat, atau kreator…",
      "Cari Apartemen 360°…",
      "Cari ruang publik…",
    ]
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
        if (char <= 0) {
          deleting = false
          phrase = (phrase + 1) % phrases.length
        }
      }
    }, 80)
    return () => window.clearInterval(timer)
  }, [query])

  useEffect(() => {
    let alive = true
    loadPublicPayload().then((data) => {
      if (alive && data) setPublicData(data)
    })
    // Muat ulang setiap kali kembali ke Home setelah publish.
    const onFocus = () => loadPublicPayload().then((data) => data && setPublicData(data))
    window.addEventListener("focus", onFocus)
    return () => {
      alive = false
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  // Panorama hasil publish tampil lebih dulu di halaman publik.
  const publishedItems: (typeof ITEMS)[number][] = useMemo(
    () =>
      (publicData?.scenes ?? []).map((scene, index) => ({
        id: `pub-${scene.id}`,
        title: scene.name,
        image: scene.thumbnail,
        panorama: scene.panorama,
        category: "Publish",
        views: `${index + 1} scene`,
      })),
    [publicData],
  )

  const allItems = useMemo(() => [...publishedItems, ...ITEMS], [publishedItems])

  const results = useMemo(
    () =>
      allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.trim().toLowerCase()) &&
          (category === "Semua" || item.category === category),
      ),
    [allItems, query, category],
  )

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <div id="home-root" className="h-full w-full overflow-y-auto bg-[#f7f9fc] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur">
        <div className="flex items-center gap-6">
          <button onClick={() => scrollTo("home-root")} className="flex items-center">
            <Logo360 tone="dark" size={28} />
          </button>
          <nav className="hidden items-center gap-5 text-xs font-medium text-slate-500 md:flex">
            <button onClick={() => scrollTo("home-explore")} className="hover:text-slate-900">Jelajahi</button>
            <button onClick={() => scrollTo("home-categories")} className="hover:text-slate-900">Kategori</button>
            <button onClick={() => navigate("portfolio")} className="hover:text-slate-900">Portofolio</button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (user ? navigate("studio") : setAuthOpen(true))}
            title={user ? "Buka Studio untuk membuat" : "Masuk untuk membuat 360°"}
            className="flex h-9 items-center gap-1.5 rounded-full bg-cyan-500 px-3.5 text-xs font-semibold text-white hover:bg-cyan-600"
          >
            <Camera size={13} /> Create
          </button>
          <button
            onClick={() => (user ? navigate("studio") : setAuthOpen(true))}
            title={user ? "Buka Studio" : "Masuk untuk membuka Studio"}
            className="flex h-9 items-center gap-1.5 rounded-full bg-[#d1005c] px-4 text-xs font-semibold text-white hover:bg-[#b80051]"
          >
            <Compass size={13} /> Studio
          </button>
          {user && (
            <button onClick={() => notify("Tidak ada notifikasi baru.")} className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-500" title="Notifikasi">
              <Bell size={15} />
            </button>
          )}
          <button
            onClick={() => (user ? navigate("dashboard") : setAuthOpen(true))}
            className="h-9 rounded-full border border-slate-200 px-4 text-xs font-medium text-slate-700"
          >
            {user ? (
              <span className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-700">{user.initials}</span>
                {user.name}
              </span>
            ) : (
              "Masuk"
            )}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
        {/* Panorama 360° bergerak pelan sebagai latar — sengaja redup agar teks tetap jelas */}
        <div
          className="hero-360 pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: "url(/media/panoramas/key-biscayne-1.jpg)",
            backgroundSize: "200% 100%",
            filter: "blur(2px) saturate(0.7)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 via-white/70 to-white" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.25] [background-image:linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[520px] -translate-x-1/2 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-semibold text-cyan-700">
            <Sparkles size={12} /> 360° Virtual Tour
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Jelajahi dunia dalam <span className="text-[#d1005c]">satu panorama.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
            Temukan ruang, tempat, dan karya dalam pengalaman 360° yang imersif.
            Geser, zoom, dan jelajahi setiap sudutnya.
          </p>
          <div className="mx-auto mt-7 flex h-12 max-w-lg items-center gap-2 rounded-full border border-slate-200 bg-white px-4 shadow-sm">
            <Search size={17} className="shrink-0 text-slate-400" />
            <div className="relative min-w-0 flex-1">
              {!query && (
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-sm text-slate-400">
                  {typed}<span className="typing-caret">|</span>
                </span>
              )}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Cari panorama, tempat, atau kreator"
                className="relative min-w-0 w-full bg-transparent text-sm text-slate-800 outline-none"
              />
            </div>
            <button onClick={() => scrollTo("home-explore")} className="h-8 shrink-0 rounded-full bg-slate-900 px-4 text-xs font-semibold text-white">
              Cari
            </button>
          </div>
          <div className="mt-7 flex justify-center gap-8 text-xs text-slate-400">
            <span><b className="text-slate-800">1.200+</b> panorama</span>
            <span><b className="text-slate-800">340</b> kreator</span>
            <span><b className="text-slate-800">86k</b> eksplorasi</span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1120px] px-4 pb-28 sm:px-6 lg:px-8">
        {/* Trending */}
        <section id="home-explore" className="pt-16">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Trending panoramas</h2>
              <p className="mt-1 text-xs text-slate-500">Paling banyak dijelajahi minggu ini</p>
            </div>
            <button onClick={() => { setCategory("Semua"); setQuery("") }} className="text-xs font-semibold text-cyan-600 hover:text-cyan-700">
              Browse more →
            </button>
          </div>

          <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-6">
            {results.map((item) => {
              const favorite = favorites.includes(item.id)
              return (
                <div key={item.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <button onClick={() => setExploring(item)} className="block h-full w-full">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </button>
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      title={favorite ? "Hapus dari favorit" : "Simpan ke favorit"}
                      className={`absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-slate-800/60 text-white backdrop-blur ${favorite ? "text-rose-400" : "hover:text-rose-300"}`}
                    >
                      <Heart size={13} fill={favorite ? "currentColor" : "none"} />
                    </button>
                    <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">360°</span>
                    <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] text-white">{item.views} views</span>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <button onClick={() => setExploring(item)} className="min-w-0 truncate text-left text-xs font-semibold text-slate-800 hover:text-slate-950">{item.title}</button>
                    <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{item.category}</span>
                  </div>
                </div>
              )
            })}
          </div>
          {results.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">Tidak ada panorama yang cocok.</p>
          )}
        </section>

        {/* Banyak user / kreator — 1 post gambar untuk 1 user (dari database jika ada) */}
        <section id="home-creators" className="mt-16">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Kreator &amp; karya mereka</h2>
              <p className="mt-1 text-xs text-slate-500">
                {publicData?.creators?.length
                  ? `${publicData.creators.length} kreator dari database · satu post 360° untuk setiap kreator`
                  : "Satu post 360° untuk setiap kreator — jelajahi semuanya"}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold text-slate-500">
              {(publicData?.creators?.length ?? LOCAL_CREATORS.length)} kreator
            </span>
          </div>
          <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-6">
            {(publicData?.creators?.length
              ? publicData.creators.map((creator) => ({
                  id: creator.id,
                  name: creator.name,
                  initials: creator.initials,
                  color: creator.color,
                  title: creator.posts?.[0]?.title ?? "360° panorama",
                  image: creator.posts?.[0]?.image ?? "",
                  panorama: creator.posts?.[0]?.panorama ?? "",
                  category: creator.posts?.[0]?.category ?? "360°",
                  views: creator.posts?.[0]?.views ?? "1 post",
                }))
              : LOCAL_CREATORS
            ).map((creator) => {
              const title = creator.title
              const image = creator.image
              const panorama = creator.panorama
              const views = creator.views
              return (
                <div key={creator.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <button
                      onClick={() => setExploring({ id: creator.id, title, image, panorama, category: creator.category, views })}
                      className="block h-full w-full"
                    >
                      <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </button>
                    <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">360°</span>
                  </div>
                  <div className="flex items-center gap-3 p-4">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-bold ${creator.color}`}>
                      {creator.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <button onClick={() => navigateCreator(creator.id)} className="block max-w-full truncate text-left text-xs font-semibold text-slate-800 hover:text-[#d1005c]">
                        {creator.name}
                      </button>
                      <span className="block truncate text-[10px] text-slate-500">{title}</span>
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-400">{views}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Kategori */}
        <section id="home-categories" className="mt-16">
          <h2 className="text-lg font-bold text-slate-900">Jelajahi berdasarkan kategori</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  category === item ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-50 text-[#d1005c]"><MapPin size={19} /></span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Punya panorama 360° sendiri?</h3>
              <p className="mt-1 text-xs text-slate-500">Unggah dan bagikan karyamu dalam beberapa menit.</p>
            </div>
          </div>
          <button onClick={() => setAuthOpen(true)} className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-cyan-500 px-4 text-xs font-semibold text-white hover:bg-cyan-600">
            Upload your own 360 →
          </button>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo360 tone="dark" size={26} />
          <p className="text-[11px] text-slate-400">© 2026 Virtour360 — Jelajahi dunia dalam satu panorama.</p>
          <button onClick={() => navigate("portfolio")} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900">
            <User size={13} /> Portofolio
          </button>
        </div>
      </footer>

      {/* Floating nav */}
      <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/70 bg-white/90 px-2 py-1.5 shadow-xl backdrop-blur-md">
        <button onClick={() => scrollTo("home-root")} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900"><Compass size={14} /> Home</button>
        <button onClick={() => scrollTo("home-explore")} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"><MapPin size={14} /> Jelajahi</button>
        <button onClick={() => navigate("portfolio")} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"><User size={14} /> Author</button>
        <button onClick={() => scrollTo("home-categories")} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"><Sparkles size={14} /> Explore</button>
      </div>

      {exploring && (
        <PublicViewerModal
          title={exploring.title}
          panorama={exploring.panorama}
          scenes={exampleScenes}
          sceneId={exploring.id}
          onClose={() => setExploring(null)}
        />
      )}
    </div>
  )
}
