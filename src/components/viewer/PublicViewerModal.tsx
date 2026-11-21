import { useEffect, useRef, useState } from "react"
import { Viewer } from "@photo-sphere-viewer/core"
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { tourConfig } from "../../config/tour.config"
import type { Scene } from "../../types/tour"

interface PublicViewerModalProps {
  title: string
  panorama: string
  onClose: () => void
  scenes?: Scene[]
  sceneId?: string
}

/** Viewer 360° penuh layar untuk pengunjung public view (tanpa masuk Studio). */
export function PublicViewerModal({ title, panorama, onClose, scenes, sceneId }: PublicViewerModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const tourRef = useRef<VirtualTourPlugin | null>(null)
  const [currentTitle, setCurrentTitle] = useState(title)
  const [currentIndex, setCurrentIndex] = useState(0)

  const hasTour = !!scenes?.length

  useEffect(() => {
    if (!containerRef.current) return

    if (!hasTour) {
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
    }

    const list = scenes!

    const viewer = new Viewer({
      container: containerRef.current,
      plugins: [VirtualTourPlugin.withConfig({
        dataMode: "client",
        renderMode: "2d",
        nodes: list.map((scene) => ({
          id: scene.id,
          panorama: scene.panorama,
          name: scene.name,
          thumbnail: scene.thumbnail,
          links: scene.hotspots
            .filter((h) => h.type === "scene" && !!h.targetSceneId)
            .map((h) => ({ nodeId: h.targetSceneId!, position: { yaw: h.yaw, pitch: h.pitch } })),
          markers: scene.hotspots
            .filter((h) => h.type !== "scene")
            .map((h) => ({
              id: h.id,
              position: { yaw: h.yaw, pitch: h.pitch },
              circle: 16,
              html: `<div style="width:16px;height:16px;border-radius:9999px;background:#facc15;border:2px solid rgba(0,0,0,.5)"></div>`,
              tooltip: { content: h.title, position: "top" as const },
            })),
        })),
        startNodeId: sceneId && list.some((s) => s.id === sceneId) ? sceneId : list[0].id,
        transitionOptions: { speed: "16rpm", effect: "fade", rotation: true },
      })],
      navbar: false,
      minFov: tourConfig.minFov,
      maxFov: tourConfig.maxFov,
      defaultZoomLvl: tourConfig.defaultZoom,
      mousewheelCtrlKey: false,
      touchmoveTwoFingers: true,
    })

    tourRef.current = viewer.getPlugin<VirtualTourPlugin>(VirtualTourPlugin)
    const tourPlugin = tourRef.current
    const onNodeChanged = (event: { node: { name?: string; id: string } }) => {
      setCurrentTitle(event.node.name ?? title)
      const index = list.findIndex((s) => s.id === event.node.id)
      if (index >= 0) setCurrentIndex(index)
    }
    tourPlugin?.addEventListener("node-changed", onNodeChanged)

    return () => {
      tourPlugin?.removeEventListener("node-changed", onNodeChanged)
      viewer.destroy()
      tourRef.current = null
    }
  }, [hasTour, panorama, scenes, sceneId, title])

  const go = (delta: number) => {
    const list = scenes ?? []
    if (list.length < 2) return
    const target = list[(currentIndex + delta + list.length) % list.length]
    tourRef.current?.setCurrentNode(target.id).catch(() => undefined)
    setCurrentTitle(target.name)
    setCurrentIndex((currentIndex + delta + list.length) % list.length)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key === "ArrowRight") go(1)
      if (event.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  return (
    <div className="fixed inset-0 z-[120] bg-black">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Virtual tour</p>
          <h3 className="mt-0.5 text-sm font-semibold text-white">{currentTitle}</h3>
          {hasTour && (
            <p className="mt-1 text-[10px] text-white/50">{currentIndex + 1} / {scenes!.length} scene</p>
          )}
        </div>
        <button
          onClick={onClose}
          title="Tutup (Esc)"
          className="pointer-events-auto grid size-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
        >
          <X size={17} />
        </button>
      </div>

      {hasTour && scenes!.length > 1 && (
        <div className="absolute bottom-16 right-4 z-10 flex items-center gap-2">
          <button onClick={() => go(-1)} title="Scene sebelumnya" className="grid size-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20">
            <ChevronLeft size={17} />
          </button>
          <button onClick={() => go(1)} title="Scene berikutnya" className="grid size-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20">
            <ChevronRight size={17} />
          </button>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-center text-[11px] text-white/80 backdrop-blur">
        Geser untuk melihat 360° · scroll zoom · klik panah kuning pindah scene · Esc keluar
      </div>
    </div>
  )
}
