import { useEffect, useRef } from "react"
import { Viewer } from "@photo-sphere-viewer/core"
import { X } from "lucide-react"
import { tourConfig } from "../../config/tour.config"

interface PublicViewerModalProps {
  title: string
  panorama: string
  onClose: () => void
}

/** Viewer 360° penuh layar untuk pengunjung public view (tanpa masuk Studio). */
export function PublicViewerModal({ title, panorama, onClose }: PublicViewerModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const viewer = new Viewer({
      container: containerRef.current,
      panorama,
      navbar: false,
      minFov: tourConfig.minFov,
      maxFov: tourConfig.maxFov,
      defaultZoomLvl: tourConfig.defaultZoom,
      mousewheelCtrlKey: false,
      touchmoveTwoFingers: true,
    })
    return () => viewer.destroy()
  }, [panorama])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[120] bg-black">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Virtual tour</p>
          <h3 className="mt-0.5 text-sm font-semibold text-white">{title}</h3>
        </div>
        <button
          onClick={onClose}
          title="Tutup (Esc)"
          className="pointer-events-auto grid size-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
        >
          <X size={17} />
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-[11px] text-white/80 backdrop-blur">
        Geser untuk melihat 360° · scroll untuk zoom · Esc untuk keluar
      </div>
    </div>
  )
}
