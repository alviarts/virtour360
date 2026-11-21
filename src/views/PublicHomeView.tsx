import { useEffect, useMemo, useState } from "react"
import { Bell, Camera, Compass, Heart, MapPin, Search, Sparkles, User } from "lucide-react"
import { Logo360 } from "../components/ui/Logo360"
import { PublicViewerModal } from "../components/viewer/PublicViewerModal"
import { useApp } from "../context/AppContext"
import { navigate } from "../lib/navigation"
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
  const { user, setAuthOpen, setUploadOpen, favorites, toggleFavorite } = useApp()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("Semua")
  const [exploring, setExploring] = useState<(typeof ITEMS)[number] | null>(null)
  const [publicData, setPublicData] = useState<PublicPayload | null>(null)

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
          <button onClick={() => setUploadOpen(true)} className="flex h-9 items-center gap-1.5 rounded-full bg-cyan-500 px-3.5 text-xs font-semibold text-white hover:bg-cyan-600">
            <Camera size={13} /> Create
          </button>
          <button onClick={() => navigate("studio")} className="flex h-9 items-center gap-1.5 rounded-full bg-[#d1005c] px-4 text-xs font-semibold text-white hover:bg-[#b80051]">
            <Compass size={13} /> Studio
          </button>
          <button onClick={() => setAuthOpen(true)} className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-500" title="Notifikasi">
            <Bell size={15} />
          </button>
          <button onClick={() => (user ? navigate("dashboard") : setAuthOpen(true))} className="h-9 rounded-full border border-slate-200 px-4 text-xs font-medium text-slate-700">
            {user?.name ?? "Masuk (opsional)"}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white px-6 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] [background-size:32px_32px]" />
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
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari panorama, tempat, atau kreator…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
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

      <main className="mx-auto max-w-[1120px] px-6 pb-28">
        {/* Trending */}
        <section id="home-explore" className="pt-10">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Trending panoramas</h2>
              <p className="mt-1 text-xs text-slate-500">Paling banyak dijelajahi minggu ini</p>
            </div>
            <button onClick={() => { setCategory("Semua"); setQuery("") }} className="text-xs font-semibold text-cyan-600 hover:text-cyan-700">
              Browse more →
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  <div className="flex items-center justify-between p-3">
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

        {/* Kategori */}
        <section id="home-categories" className="mt-12">
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
        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-50 text-[#d1005c]"><MapPin size={19} /></span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Punya panorama 360° sendiri?</h3>
              <p className="mt-1 text-xs text-slate-500">Unggah dan bagikan karyamu dalam beberapa menit.</p>
            </div>
          </div>
          <button onClick={() => setUploadOpen(true)} className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-cyan-500 px-4 text-xs font-semibold text-white hover:bg-cyan-600">
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
        <PublicViewerModal title={exploring.title} panorama={exploring.panorama} onClose={() => setExploring(null)} />
      )}
    </div>
  )
}
