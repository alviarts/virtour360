import { useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Folder,
  Group,
  Images,
  Info,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react"
import type { Scene } from "../../types/tour"
import { useApp } from "../../context/useApp"
import { navigate } from "../../lib/navigation"

interface LeftSidebarProps {
  scenes: Scene[]
  currentSceneId: string
  onSelect: (id: string) => void
  onAddScene: () => void
  onCreate: () => void
  onRemoveScene: (id: string) => void
}

type GroupMode = "none" | "source" | "category"

export function LeftSidebar({ scenes, currentSceneId, onSelect, onAddScene, onCreate, onRemoveScene }: LeftSidebarProps) {
  const { notify, groups: allGroups, createGroup, renameGroup, deleteGroup, setSceneGroup, moveScene } = useApp()
  const [view, setView] = useState<"grid" | "list">("grid")
  const [newGroup, setNewGroup] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [collapsed, setCollapsed] = useState(false)
  const [groupMode, setGroupMode] = useState<GroupMode>("none")
  const [infoOpen, setInfoOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return scenes
    return scenes.filter((s) =>
      [s.name, s.project.title, s.group, ...s.project.tags].some((field) => field.toLowerCase().includes(q)),
    )
  }, [scenes, query])

  const groupedScenes = useMemo(() => {
    const bucket = new Map<string, Scene[]>()
    filtered.forEach((scene) => {
      const key =
        groupMode === "source"
          ? scene.id.startsWith("pano-") ? "Upload Anda" : "Scene bawaan"
          : groupMode === "category"
            ? scene.group || "Uncategory"
            : "Uncategory"
      bucket.set(key, [...(bucket.get(key) ?? []), scene])
    })
    return [...bucket.entries()]
  }, [filtered, groupMode])

  const hotspots = scenes.reduce((sum, s) => sum + s.hotspots.length, 0)
  const uploads = scenes.filter((s) => s.id.startsWith("pano-")).length

  const quickActions = [
    { label: "Group", icon: Group, action: () => setGroupMode((m) => (m === "none" ? "source" : m === "source" ? "category" : "none")) },
    { label: "Collapse", icon: Folder, action: () => setCollapsed((v) => !v) },
    { label: "Info", icon: Info, action: () => setInfoOpen((v) => !v) },
    { label: "Search", icon: Search, action: () => setSearchOpen((v) => !v) },
    { label: "More", icon: MoreHorizontal, action: () => setMoreOpen((v) => !v) },
  ]

  return (
    <aside className="fixed bottom-0 left-0 top-14 z-20 flex w-60 flex-col gap-2 overflow-hidden bg-zinc-900 p-2">
      {/* Aksi utama */}
      <div className="grid min-h-8 grid-cols-[1fr_max-content] items-center gap-2">
        <button
          onClick={onCreate}
          className="flex h-8 w-full items-center justify-center gap-2 rounded-lg bg-white text-xs font-medium text-black transition-colors hover:bg-zinc-200"
        >
          <Plus size={14} strokeWidth={2.4} />
          Create
        </button>
        <div className="flex gap-1">
          <button
            title="Tampilan galeri"
            onClick={() => setView("grid")}
            className={`grid size-8 place-items-center rounded-lg border ${view === "grid" ? "border-zinc-500 bg-white/10 text-white" : "border-zinc-700 text-zinc-300 hover:bg-white/5"}`}
          >
            <Images size={14} />
          </button>
          <button
            title="Tampilan daftar"
            onClick={() => setView("list")}
            className={`grid size-8 place-items-center rounded-lg border ${view === "list" ? "border-zinc-500 bg-white/10 text-white" : "border-zinc-700 text-zinc-300 hover:bg-white/5"}`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Aksi cepat */}
      <div className="hide-scrollbar mb-1 flex items-center justify-between overflow-x-auto px-1">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.label}
              title={action.label}
              onClick={action.action}
              className="flex w-10 flex-col items-center gap-1 text-[9px] font-medium text-zinc-500 transition-colors hover:text-zinc-200"
            >
              <Icon size={14} strokeWidth={1.8} />
              {action.label}
            </button>
          )
        })}
      </div>

      {groupMode !== "none" && (
        <p className="px-1 text-[10px] text-zinc-600">
          GRUP: {groupMode === "source" ? "Sumber scene" : "Kategori"}
        </p>
      )}

      {infoOpen && (
        <div className="animate-fade-up rounded-lg border border-zinc-700 bg-black/40 p-2.5 text-[10px] text-zinc-400">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-semibold text-zinc-200">Info tur</span>
            <button onClick={() => setInfoOpen(false)} className="text-zinc-600 hover:text-zinc-200"><X size={11} /></button>
          </div>
          <div className="grid grid-cols-2 gap-y-1">
            <span>Scene</span><span className="text-right text-zinc-200">{scenes.length}</span>
            <span>Hotspot</span><span className="text-right text-zinc-200">{hotspots}</span>
            <span>Upload</span><span className="text-right text-zinc-200">{uploads}</span>
            <span>Tampilan</span><span className="text-right uppercase text-zinc-200">{view}</span>
          </div>
        </div>
      )}

      {moreOpen && (
        <div className="animate-fade-up flex flex-col gap-0.5 rounded-lg border border-zinc-700 bg-black/40 p-1 text-[10px] text-zinc-300">
          <button onClick={() => { setQuery(""); setSearchOpen(false); notify("Filter pencarian dihapus.") }} className="rounded px-2 py-1.5 text-left hover:bg-white/5">Hapus pencarian</button>
          <button onClick={() => { setView("grid"); setCollapsed(false); notify("Tampilan galeri dipulihkan.") }} className="rounded px-2 py-1.5 text-left hover:bg-white/5">Pulihkan tampilan</button>
          <button onClick={() => { setMoreOpen(false); navigate("dashboard") }} className="rounded px-2 py-1.5 text-left hover:bg-white/5">Buka Dashboard</button>
        </div>
      )}

      {searchOpen && (
        <div className="flex h-8 items-center gap-2 rounded-lg border border-zinc-700 px-2">
          <Search size={12} className="text-zinc-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama / tag⬦"
            className="min-w-0 flex-1 bg-transparent text-[11px] text-zinc-100 outline-none placeholder:text-zinc-600"
          />
          {query && <button onClick={() => setQuery("")} title="Hapus" className="text-zinc-600 hover:text-zinc-200"><X size={11} /></button>}
        </div>
      )}

      {/* Daftar scene */}
      <div className="hide-scrollbar flex min-h-0 flex-1 flex-col overflow-auto">
        {groupedScenes.map(([label, items]) => (
          <div key={label}>
            <div className="flex h-8 items-center gap-1.5 px-1">
              <button onClick={() => setCollapsed((v) => !v)} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
                {collapsed ? <ChevronUp size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
                <span className="truncate text-xs font-medium text-zinc-300">{label}</span>
                <span className="text-[10px] text-zinc-600">{items.length}</span>
              </button>
              <button
                onClick={() => {
                  const next = window.prompt("Nama grup baru", label)
                  if (next && next.trim() && next.trim() !== label) { renameGroup(label, next.trim()); notify("Grup diganti nama.") }
                }}
                title="Ganti nama grup"
                className="grid size-6 place-items-center rounded text-zinc-600 hover:bg-white/5 hover:text-zinc-200"
              >
                <Pencil size={11} />
              </button>
              {allGroups.length > 1 && (
                <button
                  onClick={() => { deleteGroup(label); notify("Grup dihapus � scene dipindah ke Uncategory.") }}
                  title="Hapus grup"
                  className="grid size-6 place-items-center rounded text-zinc-600 hover:bg-white/5 hover:text-red-400"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>

            {!collapsed && (
              <div className="mb-2 flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-black p-2">
                <button
                  type="button"
                  onClick={onAddScene}
                  className="flex h-9 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-400/10"
                >
                  <Plus size={14} strokeWidth={2.4} />
                  Add Scene
                </button>

                <div className={`grid gap-2 ${view === "grid" ? "" : "grid-cols-1"}`}>
                  {items.map((scene) => {
                    const active = scene.id === currentSceneId
                    const uploaded = scene.id.startsWith("pano-")
                    if (view === "list") {
                      return (
                        <div key={scene.id} className={`flex h-11 items-center gap-2 rounded-lg border px-1.5 transition-colors ${active ? "border-amber-400" : "border-zinc-800 hover:border-zinc-600"}`}>
                          <button onClick={() => onSelect(scene.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                            <img src={scene.thumbnail} alt="" className="size-8 rounded object-cover" />
                            <span className={`min-w-0 flex-1 truncate text-[11px] ${active ? "text-amber-300" : "text-zinc-200"}`}>{scene.name}</span>
                          </button>
                          <button onClick={() => moveScene(scene.id, -1)} title="Naik" className="grid size-5 shrink-0 place-items-center rounded text-zinc-600 hover:bg-white/5 hover:text-zinc-200">� </button>
                          <button onClick={() => moveScene(scene.id, 1)} title="Turun" className="grid size-5 shrink-0 place-items-center rounded text-zinc-600 hover:bg-white/5 hover:text-zinc-200">� </button>
                          <select
                            value={scene.group || "Uncategory"}
                            onChange={(e) => { setSceneGroup(scene.id, e.target.value); notify(`Scene dipindah ke grup ${e.target.value}.`) }}
                            title="Pindah grup"
                            className="h-6 max-w-16 shrink-0 rounded border border-zinc-700 bg-zinc-950 px-1 text-[9px] text-zinc-400 outline-none"
                          >
                            {allGroups.map((g) => <option key={g} value={g}>{g}</option>)}
                          </select>
                          {uploaded && <button onClick={() => onRemoveScene(scene.id)} title="Hapus scene" className="grid size-6 shrink-0 place-items-center rounded text-zinc-600 hover:bg-white/5 hover:text-red-400"><Trash2 size={11} /></button>}
                        </div>
                      )
                    }
                    return (
                      <div
                        key={scene.id}
                        className={`group relative h-[74px] overflow-hidden rounded-xl border transition-all ${active ? "border-amber-400 ring-1 ring-amber-400/40" : "border-zinc-800 hover:border-zinc-600"}`}
                        style={{
                          backgroundImage: `url(${scene.thumbnail})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <button onClick={() => onSelect(scene.id)} className="absolute inset-0 h-full w-full text-left">
                          <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                          <span className={`absolute bottom-2 left-2 max-w-[80%] truncate text-[11px] font-medium ${active ? "text-amber-300" : "text-zinc-100"}`}>{scene.name}</span>
                          <span className="absolute left-2 top-2 size-3 rounded-full border border-white/50 bg-black/40" />
                          {active && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-amber-400" />}
                        </button>
                        {uploaded && (
                          <button
                            onClick={() => onRemoveScene(scene.id)}
                            title="Hapus scene"
                            className="absolute right-1.5 top-1.5 z-10 grid size-6 place-items-center rounded-full bg-black/60 text-zinc-300 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {items.length === 0 && (
                    <p className="py-4 text-center text-[11px] text-zinc-600">Tidak ada scene cocok.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="py-4 text-center text-[11px] text-zinc-600">Tidak ada scene cocok.</p>}

        {newGroup ? (
          <div className="mt-2 flex gap-1">
            <input
              autoFocus
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  createGroup(groupName)
                  notify(`Grup "${groupName.trim()}" dibuat.`)
                  setGroupName("")
                  setNewGroup(false)
                }
                if (e.key === "Escape") setNewGroup(false)
              }}
              placeholder="Nama grup"
              className="h-8 min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-[11px] text-zinc-100 outline-none"
            />
            <button onClick={() => setNewGroup(false)} className="grid size-8 place-items-center rounded-lg border border-zinc-700 text-zinc-400"><X size={12} /></button>
          </div>
        ) : (
          <button onClick={() => setNewGroup(true)} className="mt-2 flex h-8 items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-700 text-[11px] text-zinc-500 hover:border-zinc-500 hover:text-zinc-300">
            <Plus size={12} /> Grup baru
          </button>
        )}
      </div>
    </aside>
  )
}
