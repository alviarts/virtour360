import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode, type RefObject } from "react"
import {
  Box,
  ChevronLeft,
  ChevronRight,
  FileText,
  Hand,
  Image as ImageIcon,
  Link2,
  MapPin,
  Maximize2,
  MousePointer2,
  Music2,
  Palette,
  PenLine,
  Pencil,
  RotateCcw,
  Shapes,
  Video,
  Volume2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { theme } from "../../config/theme"
import type { Hotspot, HotspotType, Scene } from "../../types/tour"
import type { ViewState } from "../../hooks/useTourViewer"
import { MiniMap } from "./MiniMap"
import { BottomToolbar } from "./BottomToolbar"
import { useApp } from "../../context/useApp"
import { HotspotPopup } from "./HotspotPopup"

/** "#FFFFFF,46%" → rgba(255,255,255,.46) — format warna platform referensi. */
function panoColor(value: string, fallback: string) {
  const match = value.match(/^#([0-9a-f]{6}),(\d+)%$/i)
  if (!match) return value || fallback
  const r = parseInt(match[1].slice(0, 2), 16)
  const g = parseInt(match[1].slice(2, 4), 16)
  const b = parseInt(match[1].slice(4, 6), 16)
  return `rgba(${r},${g},${b},${Number(match[2]) / 100})`
}

interface TourViewerProps {
  containerRef: RefObject<HTMLDivElement | null>
  scene: Scene
  scenes: Scene[]
  view: ViewState
  hotspotCount: number
  onSeek: (yaw: number) => void
  isAutorotate: boolean
  onToggleAutorotate: () => void
  onAddHotspot: () => void
  onPickHotspot?: (label: string) => void
  onReset: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFullscreen: () => void
  isFullscreen: boolean
  settingsOpen: boolean
  settingsContent?: ReactNode
  showNadir?: boolean
  onNotify: (message: string) => void
  inset?: { left: number; right: number }
  preview?: boolean
  onExitPreview?: () => void
  audioName?: string
  onRemoveAudio?: () => void
  placementType?: HotspotType | null
  onCancelPlacement?: () => void
  onDraw?: () => void
  onDrawLine?: () => void
  drawingPolygon?: { kind: "shape" | "line"; points: unknown[] } | null
  onFinishPolygon?: () => void
  onCancelPolygon?: () => void
  onUploadAudio?: () => void
  showMiniMap?: boolean
  showSideMenu?: boolean
  showGraph?: boolean
  onSelectScene?: (id: string) => void
  prevScene?: Scene
  nextScene?: Scene
  onPrevScene?: () => void
  onNextScene?: () => void
  onOpenDesign?: () => void
  selectedHotspot?: Hotspot | null
  onClearSelectedHotspot?: () => void
}

export function TourViewer({
  containerRef,
  scene,
  scenes,
  view,
  hotspotCount,
  onSeek,
  isAutorotate,
  onToggleAutorotate,
  onAddHotspot,
  onPickHotspot,
  onReset,
  onZoomIn,
  onZoomOut,
  onFullscreen,
  isFullscreen,
  settingsOpen,
  settingsContent,
  showNadir,
  onNotify,
  inset,
  preview,
  onExitPreview,
  audioName,
  onRemoveAudio,
  placementType,
  onCancelPlacement,
  onDraw,
  onDrawLine,
  drawingPolygon,
  onFinishPolygon,
  onCancelPolygon,
  onUploadAudio,
  showMiniMap = true,
  showSideMenu = false,
  showGraph = false,
  onSelectScene,
  prevScene,
  nextScene,
  onPrevScene,
  onNextScene,
  onOpenDesign,
  selectedHotspot,
  onClearSelectedHotspot,
}: TourViewerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const { studioConfig } = useApp()
  const floorplan = studioConfig.floorplan
  const [floorOpen, setFloorOpen] = useState(floorplan.showOnStart)

  useEffect(() => setFloorOpen(floorplan.showOnStart), [floorplan.showOnStart])

  /* ------------------------------------------------------------------ */
  /* HUD klik-kanan: muncul di kursor, hilang saat fitur dipilih.         */
  /* ------------------------------------------------------------------ */
  const [hud, setHud] = useState<{ x: number; y: number; maxX: number; maxY: number } | null>(null)

  useEffect(() => {
    if (!hud) return
    const close = (event: Event) => {
      if (event.type === "keydown" && (event as KeyboardEvent).key !== "Escape") return
      setHud(null)
    }
    window.addEventListener("pointerdown", close)
    window.addEventListener("wheel", close, { passive: true })
    window.addEventListener("keydown", close)
    return () => {
      window.removeEventListener("pointerdown", close)
      window.removeEventListener("wheel", close)
      window.removeEventListener("keydown", close)
    }
  }, [hud])

  const openHud = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (preview) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    setHud({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      maxX: rect.width,
      maxY: rect.height,
    })
  }

  const runHud = (action: () => void) => {
    action()
    setHud(null)
  }

  useEffect(() => {
    setPlaying(false)
  }, [scene.audio])

  const toggleAudio = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play().then(() => setPlaying(true)).catch(() => onNotify("Audio tidak dapat diputar di browser ini."))
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  return (
    <main
      className="absolute bottom-0 top-0 overflow-hidden bg-zinc-950"
      style={{ left: inset?.left ?? theme.size.sidebar, right: inset?.right ?? theme.size.inspector }}
    >
      {/* Kanvas Photo Sphere Viewer */}
      <div ref={containerRef} onContextMenu={openHud} className={`absolute inset-0 ${placementType ? "cursor-crosshair" : ""}`} />

      {!preview && showMiniMap && <MiniMap scene={scene} view={view} hotspotCount={hotspotCount} onSeek={onSeek} />}

      {/* Floorplan dari panel Design → Floorplan */}
      {!preview && floorplan.image && floorOpen && (
        <div
          className={`absolute bottom-24 z-30 overflow-hidden rounded-xl border border-white/20 shadow-2xl backdrop-blur-md ${floorplan.position === "left" ? "left-3" : "right-3"}`}
          style={{
            width: floorplan.layout === "panel" ? 220 : 160,
            background: panoColor(floorplan.background, "rgba(255,255,255,.46)"),
          }}
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[10px] font-semibold text-zinc-900">Floorplan</span>
            <button onClick={() => setFloorOpen(false)} className="text-zinc-900/70 hover:text-zinc-900" aria-label="Tutup floorplan"><X size={12} /></button>
          </div>
          <img src={floorplan.image} alt="Floorplan" className="w-full object-cover" />
          <div className="flex flex-wrap gap-1 p-1.5">
            {scenes.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectScene?.(item.id)}
                title={item.name}
                className="size-3.5 rounded-full border-2"
                style={{ borderColor: floorplan.markerBorder, background: item.id === scene.id ? floorplan.markerBackground : "rgba(0,0,0,.35)" }}
              />
            ))}
          </div>
        </div>
      )}
      {!preview && floorplan.image && !floorOpen && (
        <button
          onClick={() => setFloorOpen(true)}
          className={`absolute bottom-24 z-30 rounded-full border border-white/20 bg-black/70 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur ${floorplan.position === "left" ? "left-3" : "right-3"}`}
        >
          Floorplan
        </button>
      )}

      {/* HUD klik-kanan */}
      {hud && (
        <div
          className="animate-fade-up absolute z-[80] w-64 overflow-hidden rounded-2xl border border-amber-400/30 bg-zinc-950/95 shadow-2xl backdrop-blur-xl"
          style={{
            left: Math.max(8, Math.min(hud.x + 12, hud.maxX - 272)),
            top: Math.max(8, Math.min(hud.y + 8, hud.maxY - 380)),
          }}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-white/10 bg-amber-400/10 px-3 py-2">
            <div>
              <p className="text-[11px] font-semibold text-amber-200">Quick tools</p>
              <p className="text-[9px] text-zinc-500">Klik kanan · pilih untuk menutup</p>
            </div>
            <button onClick={() => setHud(null)} className="text-zinc-500 hover:text-zinc-200" aria-label="Tutup HUD"><X size={13} /></button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            <p className="px-1 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-600">Hotspot</p>
            <div className="grid grid-cols-3 gap-1">
              {[
                { label: "Point", icon: MapPin },
                { label: "Image", icon: ImageIcon },
                { label: "Article", icon: FileText },
                { label: "Video", icon: Video },
                { label: "Sound", icon: Volume2 },
                { label: "Link", icon: Link2 },
                { label: "Product", icon: Box },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => runHud(() => (onPickHotspot ? onPickHotspot(item.label) : onAddHotspot()))}
                    className="flex flex-col items-center gap-1 rounded-lg border border-white/5 bg-white/5 px-1 py-2 text-[9px] text-zinc-300 hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-200"
                  >
                    <Icon size={14} /> {item.label}
                  </button>
                )
              })}
            </div>

            <p className="px-1 pb-1 pt-3 text-[9px] font-semibold uppercase tracking-wide text-zinc-600">Konten & area</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: "Tambah hotspot", icon: MousePointer2, run: onAddHotspot },
                { label: "Gambar area", icon: Shapes, run: onDraw },
                { label: "Gambar garis", icon: PenLine, run: onDrawLine },
                ...(onPickHotspot ? [
                  { label: "Media", icon: ImageIcon, run: () => onPickHotspot("Image") },
                  { label: "Tourguide", icon: Hand, run: () => onPickHotspot("Article") },
                ] : []),
              ].map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => runHud(() => item.run?.())}
                    className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-2 py-2 text-left text-[10px] text-zinc-300 hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-sky-200"
                  >
                    <Icon size={13} className="shrink-0" /> {item.label}
                  </button>
                )
              })}
            </div>

            <p className="px-1 pb-1 pt-3 text-[9px] font-semibold uppercase tracking-wide text-zinc-600">Tampilan</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: "Reset view", icon: RotateCcw, run: onReset },
                { label: "Layar penuh", icon: Maximize2, run: onFullscreen },
                { label: "Zoom in", icon: ZoomIn, run: onZoomIn },
                { label: "Zoom out", icon: ZoomOut, run: onZoomOut },
                ...(onOpenDesign ? [{ label: "Design", icon: Palette, run: onOpenDesign }] : []),
              ].map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => runHud(() => item.run?.())}
                    className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-2 py-2 text-left text-[10px] text-zinc-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    <Icon size={13} className="shrink-0" /> {item.label}
                  </button>
                )
              })}
            </div>

            {placementType && (
              <button
                onClick={() => runHud(() => onCancelPlacement?.())}
                className="mt-2 w-full rounded-lg border border-red-400/30 bg-red-500/10 py-2 text-[10px] font-semibold text-red-300 hover:bg-red-500/20"
              >
                Batalkan penempatan hotspot
              </button>
            )}
            {drawingPolygon && (
              <div className="mt-2 flex gap-1">
                <button
                  onClick={() => runHud(() => onFinishPolygon?.())}
                  className="flex-1 rounded-lg bg-amber-400/15 py-2 text-[10px] font-semibold text-amber-200 hover:bg-amber-400/25"
                >
                  Selesai ({drawingPolygon.points.length} titik)
                </button>
                <button
                  onClick={() => runHud(() => onCancelPolygon?.())}
                  className="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-zinc-300 hover:bg-white/10"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Popup konten hotspot ala Panoee */}
      {selectedHotspot && <HotspotPopup spot={selectedHotspot} onClose={() => onClearSelectedHotspot?.()} />}

      {/* Side menu — daftar scene cepat di sisi kanan viewer */}
      {!preview && showSideMenu && (
        <div className="absolute right-3 top-1/2 z-20 flex max-h-[70%] w-44 -translate-y-1/2 flex-col gap-2 overflow-y-auto rounded-xl border border-white/15 bg-black/70 p-2 backdrop-blur-md">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-white/50">Side menu · {scenes.length} scene</p>
          {scenes.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectScene?.(item.id)}
              className={`flex items-center gap-2 rounded-lg p-1.5 text-left transition-colors ${item.id === scene.id ? "bg-white/15" : "hover:bg-white/10"}`}
            >
              <img src={item.thumbnail} alt="" className="size-8 shrink-0 rounded object-cover" />
              <span className="min-w-0 flex-1 truncate text-[10px] text-white">{item.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tour graph — peta hubungan antar scene */}
      {!preview && showGraph && (
        <div className="absolute bottom-16 left-1/2 z-20 w-[min(560px,90%)] -translate-x-1/2 rounded-xl border border-white/15 bg-black/75 p-3 backdrop-blur-md">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/50">Tour graph</p>
          <div className="flex flex-wrap items-center gap-2">
            {scenes.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <button
                  onClick={() => onSelectScene?.(item.id)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] ${item.id === scene.id ? "border-amber-400 bg-amber-400/10 text-amber-300" : "border-white/15 text-white/80 hover:bg-white/10"}`}
                >
                  <img src={item.thumbnail} alt="" className="size-5 rounded object-cover" />
                  <span className="max-w-24 truncate">{item.name}</span>
                </button>
                {index < scenes.length - 1 && <span className="text-white/40">→</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {placementType && (
        <div className="pointer-events-auto absolute left-1/2 top-16 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-400/40 bg-zinc-900/90 px-4 py-2 text-[11px] text-amber-200 shadow-xl backdrop-blur">
          <Pencil size={13} />
          Klik pada panorama untuk menaruh {placementType === "project" ? "area proyek" : "hotspot"}
          <button onClick={onCancelPlacement} className="ml-1 text-zinc-400 hover:text-white" title="Batal">
            <X size={13} />
          </button>
        </div>
      )}

      {preview && (
        <button
          onClick={onExitPreview}
          className="absolute left-4 top-4 z-30 flex h-9 items-center gap-2 rounded-full bg-black/70 px-4 text-xs font-medium text-white backdrop-blur hover:bg-black/90"
        >
          <X size={14} /> Keluar pratinjau
        </button>
      )}

      {scene.audio && (
        <div className="absolute right-4 top-4 z-30 flex items-center gap-2 rounded-full border border-zinc-700 bg-black/70 p-1.5 pl-3 text-zinc-200 backdrop-blur">
          <Music2 size={14} className="text-sky-400" />
          <span className="max-w-32 truncate text-[11px]" title={audioName}>{audioName ?? "Audio scene"}</span>
          <button onClick={toggleAudio} className="flex h-7 items-center rounded-full bg-white px-3 text-[10px] font-semibold text-black hover:bg-zinc-200">
            {playing ? "Jeda" : "Putar"}
          </button>
          {onRemoveAudio && (
            <button onClick={onRemoveAudio} title="Hapus audio" className="grid size-7 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-red-400">
              <X size={12} />
            </button>
          )}
          <audio ref={audioRef} src={scene.audio} onEnded={() => setPlaying(false)} />
        </div>
      )}

      {/* Box pindah ke 360 sebelumnya / berikutnya */}
      {(prevScene || nextScene) && (
        <div className="pointer-events-auto absolute bottom-20 right-4 z-20 hidden items-center gap-1.5 rounded-xl border border-white/15 bg-black/70 p-1.5 backdrop-blur-md lg:flex">
          <button
            onClick={onPrevScene}
            disabled={!prevScene}
            title={prevScene ? `Sebelumnya: ${prevScene.name}` : "Tidak ada scene sebelumnya"}
            className="grid size-8 place-items-center rounded-lg text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={onNextScene}
            disabled={!nextScene}
            title={nextScene ? `Berikutnya: ${nextScene.name}` : "Tidak ada scene berikutnya"}
            className="flex h-10 items-center gap-2 rounded-lg bg-white/10 px-2 text-left transition-colors hover:bg-white/20 disabled:opacity-30"
          >
            <img src={(nextScene ?? prevScene)?.thumbnail} alt="" className="size-8 rounded object-cover" />
            <span className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wide text-zinc-400">360 berikutnya</span>
              <span className="max-w-28 truncate text-[11px] font-medium text-white">{(nextScene ?? prevScene)?.name}</span>
            </span>
            <ChevronRight size={14} className="text-zinc-300" />
          </button>
        </div>
      )}

      {showNadir && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white/80 backdrop-blur">
          VIRTour360
        </div>
      )}

      {settingsOpen && settingsContent && (
        <div className="absolute right-3 top-14 z-30 w-56 animate-fade-up rounded-xl border border-zinc-700 bg-zinc-900/95 p-3 shadow-2xl backdrop-blur-md">
          {settingsContent}
        </div>
      )}

      <BottomToolbar
        view={view}
        isAutorotate={isAutorotate}
        onToggleAutorotate={onToggleAutorotate}
        onAddHotspot={onAddHotspot}
        onPickHotspot={onPickHotspot}
        onReset={onReset}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onFullscreen={onFullscreen}
        isFullscreen={isFullscreen}
        onDraw={onDraw}
        onUploadAudio={onUploadAudio}
      />
    </main>
  )
}
