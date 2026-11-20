import { useMemo, useState } from "react"
import {
  ChevronDown,
  Gift,
  Grid2X2,
  List,
  LogOut,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { useApp } from "../context/AppContext"
import { Logo360 } from "../components/ui/Logo360"
import { navigate } from "../lib/navigation"
import type { Scene } from "../types/tour"

const navItems = ["Project", "Media", "Tools", "Promotion", "Enterprise"]

function BrandLogo() {
  return (
    <button onClick={() => navigate("studio")} className="mr-3 flex shrink-0 items-center" title="Buka Studio">
      <Logo360 tone="pink" />
    </button>
  )
}

function ProjectCard({
  scene,
  view,
  onOpen,
  onDelete,
}: {
  scene: Scene
  view: "grid" | "list"
  onOpen: () => void
  onDelete: () => void
}) {
  const uploaded = scene.id.startsWith("pano-")
  if (view === "list") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-[#0c1612] p-2 transition-colors hover:border-zinc-500">
        <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <img src={scene.thumbnail} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-100">{scene.project.title}</p>
            <p className="mt-1 truncate text-[10px] text-zinc-500">{scene.project.role} · {scene.project.year}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="flex h-5 items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-[10px] text-zinc-300">
                <MapPin size={10} /> {scene.hotspots.length}
              </span>
              <span className="flex h-5 items-center rounded-full bg-[#0f9d6e] px-2 text-[10px] font-semibold text-white">
                Published
              </span>
            </div>
          </div>
        </button>
        {uploaded && (
          <button onClick={onDelete} title="Hapus proyek" className="grid size-8 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="group w-[248px] overflow-hidden rounded-xl border border-zinc-700 bg-[#0c1612] transition-colors hover:border-zinc-500">
      <button onClick={onOpen} className="block w-full text-left">
        <div className="relative h-[132px] overflow-hidden">
          <img
            src={scene.thumbnail}
            alt="Pratinjau proyek"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-5 items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-[10px] text-zinc-300">
              <MapPin size={10} /> {scene.hotspots.length}
            </span>
            <span className="flex h-5 items-center rounded-full bg-[#0f9d6e] px-2 text-[10px] font-semibold text-white">
              Published
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-zinc-700 text-[9px] font-semibold">
              {scene.project.title.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <span className="block truncate text-[11px] font-medium text-zinc-200">{scene.project.title}</span>
              <span className="block truncate text-[10px] text-zinc-500">{scene.project.role}</span>
            </div>
          </div>
        </div>
      </button>
      {uploaded && (
        <div className="flex justify-end border-t border-zinc-800 px-2 py-1.5">
          <button onClick={onDelete} title="Hapus proyek" className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-red-400">
            <Trash2 size={11} /> Hapus
          </button>
        </div>
      )}
    </div>
  )
}

const selectClass =
  "h-9 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-300 outline-none focus:border-zinc-600"

export function DashboardView() {
  const [tab, setTab] = useState<"studio" | "live">("studio")
  const [showNotice, setShowNotice] = useState(true)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [query, setQuery] = useState("")
  const [source, setSource] = useState<"all" | "uploaded" | "static">("all")
  const [category, setCategory] = useState<"all" | "360" | "tour">("all")
  const [accountOpen, setAccountOpen] = useState(false)
  const { scenes, user, setAuthOpen, setUploadOpen, setActiveSceneId, removePanorama, logout, notify } = useApp()

  const projects = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scenes.filter((s) => {
      if (source === "uploaded" && !s.id.startsWith("pano-")) return false
      if (source === "static" && s.id.startsWith("pano-")) return false
      if (category === "360" && !s.project.tags.some((t) => t.includes("360"))) return false
      if (category === "tour" && !s.project.tags.some((t) => t.toLowerCase().includes("tour"))) return false
      if (!q) return true
      return [s.name, s.project.title, s.project.role, s.project.client, ...s.project.tags]
        .some((field) => field.toLowerCase().includes(q))
    })
  }, [scenes, query, source, category])

  const visible = tab === "live" ? scenes.filter((s) => s.id.startsWith("pano-")) : projects

  const openProject = (scene: Scene) => {
    setActiveSceneId(scene.id)
    navigate("studio")
  }

  const deleteProject = (scene: Scene) => {
    void removePanorama(scene.id).then(() => notify(`Proyek "${scene.name}" dihapus.`))
  }

  return (
    <div className="relative h-full w-full overflow-y-auto bg-zinc-950 text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-1">
            <BrandLogo />
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => notify(item === "Project" ? "Anda sedang di halaman Project." : `Menu ${item} tidak tersedia di mode lokal (butuh backend).`)}
                  className={`relative h-8 items-center gap-1.5 rounded-full px-3 text-xs whitespace-nowrap transition-colors ${item === "Tools" || item === "Enterprise" ? "hidden lg:flex" : "flex"} ${
                    item === "Project" ? "bg-zinc-800 text-zinc-50" : "text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {item}
                  {item === "Tools" && <ChevronDown size={12} />}
                  {item === "Promotion" && (
                    <span className="grid size-4 place-items-center rounded-full bg-amber-400 text-[9px] font-bold text-black">3</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => notify("Masa trial aktif: 7d 10h 5m 12s.")} className="hidden h-6 items-center rounded-full bg-amber-400 px-2.5 text-[11px] font-semibold text-black whitespace-nowrap md:flex">
              7d 10h 5m 12s Trial left
            </button>
            <button onClick={() => notify("Changelog: peningkatan viewer & upload 360.")} className="hidden h-8 items-center gap-1.5 rounded-full border border-zinc-700 px-3 text-xs whitespace-nowrap text-zinc-200 hover:bg-white/5 lg:flex">
              <Sparkles size={13} /> Changelog
            </button>
            <button
              onClick={() => setUploadOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-full bg-[#d1005c] px-3 text-xs font-semibold whitespace-nowrap text-white hover:bg-[#b80051]"
            >
              <Plus size={14} strokeWidth={2.6} /> New Project
            </button>
            <div className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                title={user ? "Akun" : "Mode tamu — masuk opsional"}
                className="grid size-8 place-items-center rounded-full bg-orange-400 text-xs font-bold text-black"
              >
                {(user?.initials ?? "G")[0]}
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-10 z-30 w-44 animate-fade-up rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-2xl text-left">
                  <p className="truncate border-b border-zinc-800 px-2 pb-2 text-[11px] text-zinc-200">{user?.name ?? "Tamu"}</p>
                  {user ? (
                    <button onClick={() => { logout(); setAccountOpen(false); notify("Anda telah keluar.") }} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] text-red-400 hover:bg-red-500/10">
                      <LogOut size={12} /> Keluar
                    </button>
                  ) : (
                    <button onClick={() => { setAccountOpen(false); setAuthOpen(true) }} className="mt-1 w-full rounded-lg px-2 py-2 text-left text-[11px] text-sky-400 hover:bg-sky-500/10">
                      Masuk / Daftar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-8 py-3">
        <div className="flex flex-col justify-between gap-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-zinc-800 p-0.5">
              {(["live", "studio"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`h-8 rounded px-3 text-xs font-medium capitalize transition-colors ${
                    tab === item ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <button onClick={() => navigate("portfolio")} className="flex items-center gap-1.5 text-xs font-medium text-zinc-200 hover:text-white">
              ↗ View Public Profile
            </button>
          </div>

          {tab === "studio" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-md border border-zinc-800 p-0.5">
                <button onClick={() => setView("grid")} className={`grid size-7 place-items-center rounded ${view === "grid" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-200"}`} title="Tampilan grid">
                  <Grid2X2 size={13} />
                </button>
                <button onClick={() => setView("list")} className={`grid size-7 place-items-center rounded ${view === "list" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-200"}`} title="Tampilan daftar">
                  <List size={13} />
                </button>
              </div>
              <select value={source} onChange={(e) => setSource(e.target.value as typeof source)} className={selectClass} title="Filter sumber proyek">
                <option value="all">Semua sumber</option>
                <option value="uploaded">Upload saya</option>
                <option value="static">Scene bawaan</option>
              </select>
              <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className={selectClass} title="Filter kategori">
                <option value="all">Semua kategori</option>
                <option value="360">360°</option>
                <option value="tour">Tour</option>
              </select>
              <div className="flex h-9 w-48 items-center gap-2 rounded-md border border-zinc-800 px-2.5">
                <Search size={13} className="text-zinc-500" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari proyek…" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-zinc-600" />
                {query && <button onClick={() => setQuery("")} title="Hapus" className="text-zinc-600 hover:text-zinc-200"><X size={11} /></button>}
              </div>
            </div>
          )}
        </div>

        {tab === "studio" ? (
          visible.length ? (
            <div className={`pt-2 ${view === "grid" ? "grid grid-cols-[repeat(auto-fill,248px)] gap-4" : "flex max-w-[720px] flex-col gap-2"}`}>
              {visible.map((scene) => (
                <ProjectCard
                  key={scene.id}
                  scene={scene}
                  view={view}
                  onOpen={() => openProject(scene)}
                  onDelete={() => deleteProject(scene)}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-sm text-zinc-500">Tidak ada proyek yang cocok dengan filter.</p>
              <button onClick={() => { setQuery(""); setSource("all"); setCategory("all") }} className="mt-3 text-xs font-semibold text-sky-400 hover:text-sky-300">Reset filter</button>
            </div>
          )
        ) : visible.length ? (
          <div className={`pt-2 ${view === "grid" ? "grid grid-cols-[repeat(auto-fill,248px)] gap-4" : "flex max-w-[720px] flex-col gap-2"}`}>
            {visible.map((scene) => (
              <ProjectCard
                key={scene.id}
                scene={scene}
                view={view}
                onOpen={() => openProject(scene)}
                onDelete={() => deleteProject(scene)}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-sm text-zinc-500">No posts on Live yet...</p>
            <p className="mt-1 text-[11px] text-zinc-600">Unggah panorama untuk mempublikasikannya ke tab Live.</p>
            <button onClick={() => setUploadOpen(true)} className="mt-4 rounded-full bg-[#d1005c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#b80051]">Unggah panorama</button>
          </div>
        )}
      </main>

      {showNotice && (
        <div className="fixed bottom-8 right-8 z-30 w-[310px] animate-fade-up rounded-xl border border-zinc-800 bg-zinc-900/95 p-4 shadow-2xl">
          <div className="flex items-start justify-between">
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-black">Policy update</span>
            <button onClick={() => setShowNotice(false)} className="text-zinc-500 hover:text-zinc-200"><X size={13} /></button>
          </div>
          <h3 className="mt-3 text-sm font-semibold text-zinc-50">Changes after unsubscribing</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            From Oct 1/2026, premium features may be disabled or adjusted to Free plan limits.
          </p>
          <button onClick={() => notify("Kebijakan berlaku mulai 1 Oktober 2026.")} className="mt-3 text-xs font-semibold text-zinc-100 hover:text-white">Learn more</button>
        </div>
      )}

      <button onClick={() => notify("Hadiah harian tersedia besok.")} className="fixed bottom-6 left-6 z-30 grid size-10 place-items-center rounded-full bg-amber-500 text-black shadow-lg" title="Hadiah harian">
        <Gift size={17} />
      </button>
    </div>
  )
}
