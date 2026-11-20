import type { ReactNode, RefObject } from "react"
import { theme } from "../../config/theme"
import type { Scene } from "../../types/tour"
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
}: TourViewerProps) {
  return (
    <main
      className="absolute bottom-0 top-0 overflow-hidden bg-zinc-950"
      style={{ left: theme.size.sidebar, right: theme.size.inspector }}
    >
      {/* Kanvas Photo Sphere Viewer */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Overlay UI */}
      <MiniMap scene={scene} view={view} hotspotCount={hotspotCount} onSeek={onSeek} />

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
      />
    </main>
  )
}
