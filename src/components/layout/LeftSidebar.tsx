import {
  ChevronDown,
  Folder,
  Group,
  Images,
  Info,
  List,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react"
import type { Scene } from "../../types/tour"

interface LeftSidebarProps {
  scenes: Scene[]
  currentSceneId: string
  onSelect: (id: string) => void
  onAddScene: () => void
}

const quickActions = [
  { icon: Group, label: "Group" },
  { icon: Folder, label: "Collapse" },
  { icon: Info, label: "Info" },
  { icon: Search, label: "Search" },
  { icon: MoreHorizontal, label: "More" },
]

export function LeftSidebar({ scenes, currentSceneId, onSelect, onAddScene }: LeftSidebarProps) {
  return (
    <aside className="fixed bottom-0 left-0 top-14 z-20 flex w-60 flex-col gap-2 overflow-hidden bg-zinc-900 p-2">
      {/* Aksi utama */}
      <div className="grid min-h-8 grid-cols-[1fr_max-content] items-center gap-2">
        <button className="flex h-8 w-full items-center justify-center gap-2 rounded-lg bg-white text-xs font-medium text-black transition-colors hover:bg-zinc-200">
          <Plus size={14} strokeWidth={2.4} />
          Create
        </button>
        <div className="flex gap-1">
          <button title="Tampilan galeri" className="grid size-8 place-items-center rounded-lg border border-zinc-700 text-zinc-300 transition-colors hover:bg-white/5">
            <Images size={14} />
          </button>
          <button title="Tampilan daftar" className="grid size-8 place-items-center rounded-lg border border-zinc-700 text-zinc-300 transition-colors hover:bg-white/5">
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
              className="flex w-10 flex-col items-center gap-1 text-[9px] font-medium text-zinc-500 transition-colors hover:text-zinc-200"
            >
              <Icon size={14} strokeWidth={1.8} />
              {action.label}
            </button>
          )
        })}
      </div>

      {/* Daftar scene */}
      <div className="hide-scrollbar flex min-h-0 flex-1 flex-col overflow-auto">
        <div className="flex h-8 items-center gap-1.5 px-1">
          <ChevronDown size={12} className="text-zinc-500" />
          <span className="truncate text-xs font-medium text-zinc-300">Uncategory</span>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800 bg-black p-2">
          <button
            type="button"
            onClick={onAddScene}
            className="flex h-9 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-400/10"
          >
            <Plus size={14} strokeWidth={2.4} />
            Add Scene
          </button>

          <div className="grid gap-2">
            {scenes.map((scene) => {
              const active = scene.id === currentSceneId
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => onSelect(scene.id)}
                  className={`group relative h-[74px] overflow-hidden rounded-xl border transition-all ${
                    active
                      ? "border-amber-400 ring-1 ring-amber-400/40"
                      : "border-zinc-800 hover:border-zinc-600"
                  }`}
                  style={{
                    backgroundImage: `url(${scene.thumbnail})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <span
                    className={`absolute bottom-2 left-2 truncate text-[11px] font-medium ${
                      active ? "text-amber-300" : "text-zinc-100"
                    }`}
                  >
                    {scene.name}
                  </span>
                  <span className="absolute left-2 top-2 size-3 rounded-full border border-white/50 bg-black/40" />
                  {active && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-amber-400" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}
