import { useMemo, useState } from "react"
import {
  Eye,
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
import { useApp } from "../context/useApp"
import { NewProjectModal } from "../components/auth/NewProjectModal"
import { Logo360 } from "../components/ui/Logo360"
import { ThemeToggle } from "../components/ui/ThemeToggle"
import { navigate, navigateProfile, profileSlug } from "../lib/navigation"
import { PublicViewerModal } from "../components/viewer/PublicViewerModal"
import type { Scene } from "../types/tour"

const navItems = ["Project", "Media", "Portofolio"]

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
  const [editingSlug, setEditingSlug] = useState(false)
  const [customSlug, setCustomSlug] = useState(() => localStorage.getItem("virtour360.customSlug") || "")
  const [changelogOpen, setChangelogOpen] = useState(false)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [query, setQuery] = useState("")
  const [source, setSource] = useState<"all" | "uploaded" | "static">("all")
  const [category, setCategory] = useState<"all" | "360" | "tour">("all")
  const [accountOpen, setAccountOpen] = useState(false)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [preview, setPreview] = useState<{ title: string; scenes: Scene[]; uid?: string } | null>(null)
  const { scenes, user, setAuthOpen, setUploadOpen, setActiveSceneId, removePanorama, logout, notify, favorites, projects, activeProject, createProject, setActiveProject, removeProject, setProjectStatus, getProjectScenes } = useApp()
  const userSlug = customSlug || profileSlug(user?.name, user?.uid)

  const filteredScenes = useMemo(() => {
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

  const visible = tab === "live" ? scenes.filter((s) => s.id.startsWith("pano-")) : filteredScenes

  const openProject = (scene: Scene) => {
    setActiveSceneId(scene.id)
    navigate("studio")
  }

  const deleteProject = (scene: Scene) => {
    void removePanorama(scene.id).then(() => notify(`Proyek "${scene.name}" dihapus.`))
  }

  const handleCreateProject = (name: string, projectCategory: string) => {
    const project = createProject(name, projectCategory)
    setNewProjectOpen(false)
    notify(`Project "${project.name}" (${project.category}) dibuat. Selamat datang di Studio!`)
    navigate("studio")
  }

  /** Klik kartu hanya mengganti selection; Studio dibuka lewat tombol eksplisit. */
  const selectProject = (id: string) => setActiveProject(id)

  /** Link publish hanya dibuat lewat modal Publish di Studio. */
  const openPublishFor = (id: string) => {
    setActiveProject(id)
    try { sessionStorage.setItem("virtour360.openPublish", "1") } catch { /* sesi privat */ }
    navigate("studio")
  }

  const openStudioFor = (id: string) => {
    setActiveProject(id)
    navigate("studio")
  }

  /** Pratinjau dipanggil eksplisit lewat tombol mata; klik kartu = ganti project aktif. */
  const previewProject = (project: (typeof projects)[number]) => {
    const owned = getProjectScenes(project.id)
    setPreview({ title: project.name, scenes: owned, uid: project.publishedUid })
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
                  onClick={() => {
                    if (item === "Project") notify("Anda sedang di halaman Project.")
                    else if (item === "Media") setUploadOpen(true)
                    else navigateProfile(user?.name, user?.uid)
                  }}
                  className={`relative flex h-8 items-center gap-1.5 rounded-full px-3 text-xs whitespace-nowrap transition-colors ${
                    item === "Project" ? "bg-zinc-800 text-zinc-50" : "text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {editingSlug ? (
              <input
                autoFocus
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                onBlur={() => { localStorage.setItem("virtour360.customSlug", customSlug); setEditingSlug(false) }}
                onKeyDown={(e) => { if (e.key === "Enter") { localStorage.setItem("virtour360.customSlug", customSlug); setEditingSlug(false) } }}
                className="hidden h-6 w-40 rounded-full border border-zinc-600 bg-zinc-950 px-2.5 font-mono text-[10px] text-white outline-none md:block"
              />
            ) : (
              <button
                onClick={() => setEditingSlug(true)}
                title="Klik untuk mengganti path portofolio"
                className="hidden h-6 items-center rounded-full border border-zinc-700 bg-zinc-900 px-2.5 font-mono text-[10px] whitespace-nowrap text-zinc-200 hover:text-white md:flex"
              >
                /u/{userSlug}
              </button>
            )}
            <ThemeToggle compact />
            <button onClick={() => setChangelogOpen((v) => !v)} className="hidden h-8 items-center gap-1.5 rounded-full border border-zinc-700 px-3 text-xs whitespace-nowrap text-zinc-200 hover:bg-white/5 lg:flex">
              <Sparkles size={13} /> Changelog
            </button>
            {changelogOpen && (
              <div className="absolute right-24 top-12 z-40 w-80 animate-fade-up rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-2xl">
                <p className="px-1 pb-2 text-[10px] font-semibold text-zinc-300">Workflow changelog</p>
                {[
                  ["10.11.2026 · 09:12", "Panel Design", "7 preset tema + style hotspot"],
                  ["04.11.2026 · 14:30", "Publish", "Slug, QR, embed, password"],
                  ["27.10.2026 · 08:45", "Demo session", "Mode demo per browser"],
                  ["12.10.2026 · 16:20", "Hotspot", "9 tipe data sungguhan"],
                ].map(([when, title, desc]) => (
                  <div key={title} className="flex gap-2 border-b border-zinc-800 py-2 text-[10px]">
                    <span className="shrink-0 font-mono text-zinc-500">{when}</span>
                    <span><b className="text-zinc-100">{title}</b><span className="block text-zinc-400">{desc}</span></span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setNewProjectOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-full bg-[#d1005c] px-3 text-xs font-semibold whitespace-nowrap text-white hover:bg-[#b80051]"
            >
              <Plus size={14} strokeWidth={2.6} /> New Project
            </button>
            <div className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                title={user ? "Akun" : "Publik — masuk untuk mengunggah"}
                className="grid size-8 place-items-center rounded-full bg-orange-400 text-xs font-bold text-black"
              >
                {(user?.initials ?? "G")[0]}
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-10 z-30 w-44 animate-fade-up rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-2xl text-left">
                  <p className="truncate border-b border-zinc-800 px-2 pb-2 text-[11px] text-white">{user?.name ?? "Publik"}</p>
                  {user ? (
                    <button onClick={() => { logout(); setAccountOpen(false); notify("Anda telah keluar."); navigate("home") }} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] text-red-400 hover:bg-red-500/10">
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

      <main className="mx-auto max-w-[1400px] px-4 py-3 min-[112.5rem]:max-w-[1640px] sm:px-6 lg:px-8">
        {/* Project — dibuat di Dashboard, dibuka di Studio */}
        <section className="pt-6" id="dashboard-projects">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Project kamu</h2>
              <p className="mt-0.5 text-[11px] text-zinc-500">Buat project baru lalu lanjut mengedit di Studio.</p>
            </div>
            <button
              onClick={() => setNewProjectOpen(true)}
              className="flex h-8 items-center gap-1.5 rounded-full border border-[#d1005c]/40 bg-[#d1005c]/10 px-3 text-[11px] font-semibold text-pink-200 hover:bg-[#d1005c]/20"
            >
              <Plus size={13} /> Buat Project
            </button>
          </div>

          {projects.length ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,248px),1fr))] gap-4">
              {projects.map((project) => {
                const owned = getProjectScenes(project.id)
                const cover = owned[0]?.thumbnail
                return (
                <div
                  key={project.id}
                  onClick={() => selectProject(project.id)}
                  title="Pilih project ini"
                  className={`group cursor-pointer overflow-hidden rounded-xl border transition-colors ${
                    activeProject?.id === project.id ? "border-[#d1005c] bg-[#d1005c]/5" : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600"
                  }`}
                >
                  <button onClick={(e) => { e.stopPropagation(); selectProject(project.id) }} className="block h-[120px] w-full overflow-hidden bg-zinc-950 text-left" title="Pilih project ini">
                    {cover ? (
                      <img src={cover} alt={`Pratinjau ${project.name}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <span className="grid h-full place-items-center text-[11px] text-zinc-600">Belum ada 360° — buka Studio untuk mengunggah</span>
                    )}
                  </button>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-800 text-[11px] font-semibold text-white">
                        {project.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-medium text-zinc-100">{project.name}</p>
                          {activeProject?.id === project.id && <span className="shrink-0 rounded-full bg-[#d1005c]/20 px-1.5 py-0.5 text-[9px] text-pink-200">Dipilih</span>}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="inline-block rounded-full bg-cyan-500/15 px-2 py-0.5 text-[9px] font-medium text-cyan-300">{project.category}</span>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-medium ${
                            project.status === "published" ? "bg-[#27a644]/15 text-[#5fd486]"
                              : project.status === "review" ? "bg-[#f2c14e]/15 text-[#f2c14e]"
                                : "bg-white/10 text-zinc-400"
                          }`}>{project.status === "published" ? "Dipublikasi" : project.status === "review" ? "Dalam review" : "Draft"}</span>
                          <span className="inline-block rounded-full bg-white/5 px-2 py-0.5 text-[9px] text-zinc-400">{owned.length} scene</span>
                        </div>
                      </div>
                    </div>
                    <select
                      value={project.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setProjectStatus(project.id, e.target.value as typeof project.status)}
                      title="Status project"
                      className="mt-3 h-7 w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 text-[10px] text-zinc-300 outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="review">Dalam review</option>
                      <option value="published">Dipublikasi</option>
                    </select>
                    {project.status === "published" && !project.publishedUid && (
                      <div className="mt-2 rounded-lg border border-[#f2c14e]/25 bg-[#f2c14e]/[0.08] p-2">
                        <p className="text-[10px] leading-relaxed text-[#f2c14e]">Link publish belum dibuat — status saja tidak membuat link.</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); openPublishFor(project.id) }}
                          className="mt-1.5 text-[10px] font-semibold text-zinc-100 underline decoration-[#f2c14e]/50 underline-offset-2 hover:text-white"
                        >
                          Buat link lewat modal Publish →
                        </button>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openStudioFor(project.id) }} className="h-8 flex-1 rounded-lg bg-white text-[11px] font-semibold text-black hover:bg-zinc-200">
                        Buka Studio
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); previewProject(project) }} title="Pratinjau 360° project ini" className="grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-700 text-zinc-300 hover:border-white/30 hover:text-white">
                        <Eye size={13} />
                      </button>
                      {project.publishedUid && (
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(`#/p/${project.publishedUid}`, "_blank") }}
                          title="Buka link publish"
                          className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#27a644]/40 text-[#5fd486] hover:bg-[#27a644]/10"
                        >
                          <Sparkles size={13} />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); removeProject(project.id); notify(`Project "${project.name}" dihapus.`) }} title="Hapus project" className="grid size-8 shrink-0 place-items-center rounded-lg border border-zinc-700 text-zinc-500 hover:border-red-500/40 hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-700 py-10 text-center">
              <p className="text-xs text-zinc-500">Belum ada project. Buat project pertama untuk masuk ke Studio.</p>
              <button onClick={() => setNewProjectOpen(true)} className="mt-3 h-9 rounded-full bg-[#d1005c] px-4 text-[11px] font-semibold text-white hover:bg-[#b80051]">
                Buat Project pertama
              </button>
            </div>
          )}
        </section>

        {/* KPI strip — ringkasan portofolio pribadi */}
        <div className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3">
          {[
            { label: "Proyek", value: String(projects.length), hint: "project dibuat dari Dashboard" },
            { label: "Dipublikasikan", value: String(scenes.filter((s) => s.id.startsWith("pano-")).length), hint: "karya dari upload" },
            { label: "Favorit", value: String(favorites.length), hint: "disimpan pengunjung" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
              <p className="text-xs font-medium text-zinc-400">{kpi.label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-50">{kpi.value}</p>
              <p className="mt-1 text-[10px] text-zinc-600">{kpi.hint}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-between gap-4 py-6 sm:flex-row sm:items-center">
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
            <button
              onClick={() => user?.uid
                ? navigateProfile(user.name, user.uid)
                : notify("UID publik belum tersedia. Silakan logout lalu masuk lagi.")}
              title="Buka tour publik sesuai UID akun kamu"
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-200 hover:text-white"
            >
              — View Public Profile
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
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari proyek⬦" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-zinc-600" />
                {query && <button onClick={() => setQuery("")} title="Hapus" className="text-zinc-600 hover:text-zinc-200"><X size={11} /></button>}
              </div>
            </div>
          )}
        </div>

        {tab === "studio" ? (
          visible.length ? (
            <div className={`pt-2 ${view === "grid" ? "grid grid-cols-[repeat(auto-fill,minmax(min(100%,248px),1fr))] gap-8" : "flex max-w-[720px] flex-col gap-3"}`}>
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
          <div className={`pt-2 ${view === "grid" ? "grid grid-cols-[repeat(auto-fill,minmax(min(100%,248px),1fr))] gap-8" : "flex max-w-[720px] flex-col gap-3"}`}>
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
            <span className="rounded-full bg-[#27a644]/20 px-2 py-0.5 text-[10px] font-semibold text-[#5fd486]">Free usage</span>
            <button onClick={() => setShowNotice(false)} className="text-zinc-500 hover:text-zinc-200"><X size={13} /></button>
          </div>
          <h3 className="mt-3 text-sm font-semibold text-zinc-50">Paket gratis</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            Project unlimited, 3 GB storage, publish ke link sendiri tanpa watermark. Bayar hanya saat butuh storage lebih.
          </p>
          <button onClick={() => notify("Storage 3 GB · unlimited project · tanpa watermark.")} className="mt-3 text-xs font-semibold text-zinc-100 hover:text-white">Lihat detail paket</button>
        </div>
      )}

      {newProjectOpen && (
        <NewProjectModal onClose={() => setNewProjectOpen(false)} onCreate={handleCreateProject} />
      )}

      {preview && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/80 p-3 backdrop-blur-sm sm:p-6" onClick={() => setPreview(null)}>
          <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-100">{preview.title} · pratinjau 360°</p>
                <p className="truncate text-[10px] text-zinc-500">
                  {preview.scenes.length ? `${preview.scenes.length} scene tersimpan di project ini` : "Belum ada panorama yang di-upload"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {preview.uid && (
                  <button onClick={() => window.open(`#/p/${preview.uid}`, "_blank")} className="h-8 rounded-lg border border-[#27a644]/40 px-3 text-[11px] font-semibold text-[#5fd486] hover:bg-[#27a644]/10">
                    Link publish
                  </button>
                )}
                <button onClick={() => setPreview(null)} className="grid size-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white" title="Tutup"><X size={16} /></button>
              </div>
            </div>
            <div className="relative min-h-0 flex-1">
              {preview.scenes.length ? (
                <PublicViewerModal
                  title={preview.scenes[0].name}
                  panorama={preview.scenes[0].panorama}
                  scenes={preview.scenes.length > 1 ? preview.scenes : undefined}
                  sceneId={preview.scenes.length > 1 ? preview.scenes[0].id : undefined}
                  onClose={() => setPreview(null)}
                />
              ) : (
                <div className="grid h-full place-items-center px-6 text-center">
                  <div>
                    <p className="text-sm text-zinc-300">Belum ada 360° di project ini.</p>
                    <button onClick={() => { const id = projects.find((p) => p.name === preview.title)?.id; if (id) openStudioFor(id) }} className="mt-4 rounded-full bg-white px-4 py-2 text-[11px] font-semibold text-black">
                      Unggah di Studio
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
