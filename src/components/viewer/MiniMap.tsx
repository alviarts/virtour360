import { useRef, useState } from "react"
import { ChevronDown, Grip } from "lucide-react"
import type { Scene } from "../../types/tour"
import type { ViewState } from "../../hooks/useTourViewer"
import { formatAngle } from "../../lib/format"

interface MiniMapProps {
  scene: Scene
  view: ViewState
  hotspotCount: number
  onSeek: (yaw: number) => void
}

export function MiniMap({ scene, view, hotspotCount, onSeek }: MiniMapProps) {
  const [open, setOpen] = useState(true)
  const dragging = useRef(false)
  const markerLeft = ((view.yaw + 180) / 360) * 100

  const seek = (clientX: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    onSeek(ratio * 360 - 180)
  }

  return (
    <div className="fixed left-[264px] top-[100px] z-20 hidden w-80 overflow-hidden rounded-xl bg-zinc-800 shadow-2xl sm:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-grab items-center justify-between px-3 py-2"
      >
        <div className="flex items-center gap-2">
          <Grip size={13} className="text-zinc-500" />
          <span className="text-sm font-semibold text-white">Mini-map</span>
        </div>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>

      {open && (
        <div
          className="relative h-40 w-full cursor-crosshair overflow-hidden bg-zinc-900"
          onPointerDown={(event) => {
            dragging.current = true
            event.currentTarget.setPointerCapture?.(event.pointerId)
            seek(event.clientX, event.currentTarget)
          }}
          onPointerMove={(event) => {
            if (dragging.current) seek(event.clientX, event.currentTarget)
          }}
          onPointerUp={(event) => {
            dragging.current = false
            event.currentTarget.releasePointerCapture?.(event.pointerId)
          }}
          onPointerCancel={() => { dragging.current = false }}
          title="Klik atau geser untuk mengarahkan pandangan"
        >
          {/* Pakai panorama equirectangular (2:1), bukan thumbnail crop — dan geser
              sesuai yaw agar seluruh 360° bisa dijelajah dari mini-map. */}
          <img
            src={scene.panorama || scene.thumbnail}
            alt="Pratinjau panorama 360°"
            className="pointer-events-none absolute top-0 h-full w-[200%] max-w-none select-none object-cover opacity-90"
            style={{ left: `-${Math.max(0, Math.min(100, markerLeft / 2))}%` }}
            draggable={false}
          />
          <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white/80">360°</span>
          <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-white">
            {hotspotCount} hotspots · yaw {formatAngle(view.yaw)}°
          </span>

          {/* Penunjuk arah pandang */}
          <span
            className="pointer-events-none absolute bottom-0 top-0 w-[2px] bg-amber-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
            style={{ left: `${Math.max(0, Math.min(100, markerLeft))}%` }}
          >
            <span className="absolute -left-[3px] top-0 size-2 rounded-full bg-amber-400" />
          </span>

          {/* Titik hotspot — seperti mini-map platform referensi */}
          {scene.hotspots.map((spot) => {
            const left = Math.max(0, Math.min(100, ((spot.yaw + 180) / 360) * 100))
            const top = Math.max(0, Math.min(100, ((90 - spot.pitch) / 180) * 100))
            return (
              <span
                key={spot.id}
                title={spot.title}
                className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-amber-400 shadow-[0_0_6px_rgba(250,204,21,0.9)]"
                style={{ left: `${left}%`, top: `${top}%` }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
