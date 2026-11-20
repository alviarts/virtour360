import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { Music2, Pencil, X } from "lucide-react"
import { theme } from "../../config/theme"
import type { HotspotType, Scene } from "../../types/tour"
import type { ViewState } from "../../hooks/useTourViewer"
import { MiniMap } from "./MiniMap"
import { BottomToolbar } from "./BottomToolbar"

interface TourViewerProps {
  containerRef: RefObject<HTMLDivElement | null>
  scene: Scene
  view: ViewState
  hotspotCount: number
  onSeek: (yaw: number) => void
  isAutorotate: boolean
  onToggleAutorotate: () => void
  onAddHotspot: () => void
  onReset: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFullscreen: () => void
  isFullscreen: boolean
  settingsOpen: boolean
  settingsContent?: ReactNode
  onNotify: (message: string) => void
  inset?: { left: number; right: number }
  preview?: boolean
  onExitPreview?: () => void
  audioName?: string
  onRemoveAudio?: () => void
  placementType?: HotspotType | null
  onCancelPlacement?: () => void
  onDraw?: () => void
  onUploadAudio?: () => void
}

export function TourViewer({
  containerRef,
  scene,
  view,
  hotspotCount,
  onSeek,
  isAutorotate,
  onToggleAutorotate,
  onAddHotspot,
  onReset,
  onZoomIn,
  onZoomOut,
  onFullscreen,
  isFullscreen,
  settingsOpen,
  settingsContent,
  onNotify,
  inset,
  preview,
  onExitPreview,
  audioName,
  onRemoveAudio,
  placementType,
  onCancelPlacement,
  onDraw,
  onUploadAudio,
}: TourViewerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

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
      <div ref={containerRef} className="absolute inset-0" />

      {!preview && <MiniMap scene={scene} view={view} hotspotCount={hotspotCount} onSeek={onSeek} />}

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
