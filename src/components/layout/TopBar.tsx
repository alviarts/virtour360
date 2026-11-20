import {
  Box,
  ChartNoAxesCombined,
  ChevronDown,
  Grid3x3,
  MapPin,
  MousePointer2,
  PenLine,
  Pencil,
  Play,
  Settings2,
  SlidersHorizontal,
  Undo2,
} from "lucide-react"
import { profile } from "../../data/profile"
import { theme } from "../../config/theme"
import { navigate } from "../../lib/navigation"

const tools = [
  { id: "select", icon: Pencil, label: "Pilih" },
  { id: "cursor", icon: MousePointer2, label: "Kursor" },
  { id: "pin", icon: MapPin, label: "Hotspot" },
  { id: "undo", icon: Undo2, label: "Urungkan" },
  { id: "draw", icon: PenLine, label: "Gambar" },
  { id: "model", icon: Box, label: "Model 3D" },
  { id: "grid", icon: Grid3x3, label: "Grid" },
  { id: "chart", icon: ChartNoAxesCombined, label: "Analitik" },
  { id: "settings", icon: Settings2, label: "Pengaturan" },
]

interface TopBarProps {
  activeTool: string
  onToolChange: (id: string) => void
  onToggleSettings: () => void
}

export function TopBar({ activeTool, onToolChange, onToggleSettings }: TopBarProps) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-14">
      {/* Area kiri — workspace */}
      <div
        className="pointer-events-auto flex shrink-0 items-center bg-zinc-900 px-2"
        style={{ width: theme.size.sidebar }}
      >
        <button
          onClick={() => navigate("dashboard")}
          title="Ke Dashboard"
          className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left transition-colors hover:bg-white/5"
        >
          <span className="grid size-7 place-items-center rounded-full bg-zinc-700 text-[11px] font-semibold text-zinc-100">
            {profile.initials}
          </span>
          <ChevronDown size={13} className="text-zinc-500" />
        </button>
      </div>

      {/* Area tengah — toolbar mengambang */}
      <div className="relative flex min-w-0 flex-1">
        <div className="pointer-events-auto absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-black/60 p-1 backdrop-blur-md">
          {tools.map((tool) => {
            const Icon = tool.icon
            const active = activeTool === tool.id
            return (
              <button
                key={tool.id}
                type="button"
                title={tool.label}
                onClick={() => onToolChange(tool.id)}
                className={`grid size-8 place-items-center rounded-full transition-colors ${
                  active ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Area kanan — aksi global */}
      <div
        className="pointer-events-auto flex shrink-0 items-center justify-between bg-zinc-900 px-2"
        style={{ width: theme.size.inspector }}
      >
        <button className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-zinc-50 transition-colors hover:bg-white/5">
          <span className="size-2 rounded-full border border-zinc-500" />
          3 Suggestion
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Pratinjau"
            className="grid size-8 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Play size={14} fill="currentColor" />
          </button>
          <button
            type="button"
            className="flex h-8 items-center rounded-lg bg-sky-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-sky-400"
          >
            Published
          </button>
        </div>
      </div>

      {/* Tombol pengaturan viewer, melayang di sisi kanan viewer */}
      <button
        type="button"
        onClick={onToggleSettings}
        title="Pengaturan tampilan"
        className="pointer-events-auto absolute right-[calc(260px+12px)] top-2 grid size-9 place-items-center rounded-full bg-black/70 text-zinc-200 backdrop-blur-md transition-colors hover:bg-black/90 hover:text-white"
      >
        <SlidersHorizontal size={16} />
      </button>
    </header>
  )
}
