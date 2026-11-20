import { ChevronDown, Grip } from "lucide-react"
import type { Scene } from "../../types/tour"
import type { ViewState } from "../../hooks/useTourViewer"

interface MiniMapProps {
  scene: Scene
  view: ViewState
  hotspotCount: number
  onSeek: (yaw: number) => void
}

export function MiniMap({ scene, view, hotspotCount, onSeek }: MiniMapProps) {
  const markerLeft = ((view.yaw + 180) / 360) * 100

  return (
    <div className="fixed left-[264px] top-[100px] z-20 hidden w-80 overflow-hidden rounded-xl bg-zinc-800 shadow-2xl sm:block">
      <div className="flex cursor-grab items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <Grip size={13} className="text-zinc-500" />
          <span className="text-sm font-semibold text-white">Mini-map</span>
        </div>
        <ChevronDown size={14} className="text-zinc-400" />
      </div>

      <div
        className="relative h-40 w-full overflow-hidden bg-zinc-900"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const ratio = (event.clientX - rect.left) / rect.width
          onSeek(ratio * 360 - 180)
        }}
      >
        <img
          src={scene.thumbnail}
          alt="Pratinjau panorama"
          className="h-full w-full select-none object-cover opacity-90"
          draggable={false}
        />
        <span className="pointer-events-none absolute left-2 top-2 font-mono text-xs text-white text-shadow-sm">
          {hotspotCount} hotspots
        </span>

        {/* Penunjuk arah pandang */}
        <span
          className="pointer-events-none absolute bottom-0 top-0 w-[2px] bg-amber-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
          style={{ left: `${Math.max(0, Math.min(100, markerLeft))}%` }}
        >
          <span className="absolute -left-[3px] top-0 size-2 rounded-full bg-amber-400" />
        </span>
      </div>
    </div>
  )
}
