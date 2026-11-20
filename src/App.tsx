import { useCallback, useRef, useState } from "react"
import { AppShell } from "./components/layout/AppShell"
import { TopBar } from "./components/layout/TopBar"
import { LeftSidebar } from "./components/layout/LeftSidebar"
import { RightPanel } from "./components/layout/RightPanel"
import { TourViewer } from "./components/viewer/TourViewer"
import { useTourViewer } from "./hooks/useTourViewer"
import { useFullscreen } from "./hooks/useFullscreen"
import { useHotkeys } from "./hooks/useHotkeys"
import { scenes } from "./data/scenes"
import { profile } from "./data/profile"

function SettingsPopover() {
  return (
    <div className="flex flex-col gap-3 text-xs text-zinc-400">
      <div className="flex items-center justify-between">
        <span>Kualitas</span>
        <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-300">Auto</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Kompas</span>
        <span className="size-2 rounded-full bg-sky-500" />
      </div>
      <div className="flex items-center justify-between">
        <span>Gyroskop</span>
        <span className="size-2 rounded-full bg-zinc-600" />
      </div>
      <div className="border-t border-zinc-800 pt-2 text-[10px] leading-relaxed text-zinc-600">
        Gunakan Arrow Left/Right untuk berpindah scene, R untuk reset, F untuk layar penuh.
      </div>
    </div>
  )
}

export default function App() {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const [activeTool, setActiveTool] = useState("select")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const tour = useTourViewer()
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(shellRef)

  const currentIndex = scenes.findIndex((s) => s.id === tour.currentSceneId)

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2200)
  }, [])

  const goRelative = useCallback(
    (delta: number) => {
      const next = scenes[(currentIndex + delta + scenes.length) % scenes.length]
      tour.goToScene(next.id)
    },
    [currentIndex, tour],
  )

  useHotkeys({
    onPrev: () => goRelative(-1),
    onNext: () => goRelative(1),
    onReset: tour.resetView,
    onZoomIn: () => tour.zoomBy(6),
    onZoomOut: () => tour.zoomBy(-6),
    onFullscreen: toggleFullscreen,
  })

  return (
    <AppShell containerRef={shellRef}>
      <TopBar
        activeTool={activeTool}
        onToolChange={(id) => {
          setActiveTool(id)
          if (id === "pin") tour.addHotspot()
        }}
        onToggleSettings={() => setSettingsOpen((v) => !v)}
      />

      <LeftSidebar
        scenes={scenes}
        currentSceneId={tour.currentSceneId}
        onSelect={tour.goToScene}
        onAddScene={() => showToast("Mode tambah scene — pilih panorama untuk memulai")}
      />

      <TourViewer
        containerRef={tour.containerRef}
        scene={tour.currentScene}
        view={tour.view}
        hotspotCount={tour.currentScene.hotspots.length}
        onSeek={tour.rotateTo}
        isAutorotate={tour.isAutorotate}
        onToggleAutorotate={tour.toggleAutorotate}
        onAddHotspot={tour.addHotspot}
        onReset={tour.resetView}
        onZoomIn={() => tour.zoomBy(6)}
        onZoomOut={() => tour.zoomBy(-6)}
        onFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        settingsOpen={settingsOpen}
        settingsContent={<SettingsPopover />}
      />

      <RightPanel
        scene={tour.currentScene}
        selectedHotspot={tour.selectedHotspot}
        onClearHotspot={tour.clearSelectedHotspot}
        onGoToScene={tour.goToScene}
      />

      {!tour.isReady && (
        <div className="absolute left-60 right-[260px] top-0 z-40 grid place-items-center bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <span className="size-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
            <span className="text-xs text-zinc-400">Menyiapkan panorama…</span>
          </div>
        </div>
      )}

      {toast && (
        <div className="absolute bottom-20 left-1/2 z-50 -translate-x-1/2 animate-fade-up rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs text-zinc-200 shadow-xl">
          {toast}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 right-[272px] z-10 hidden text-[10px] text-zinc-600 lg:block">
        {profile.name} · {tour.currentScene.project.title} · {tour.currentScene.project.year}
      </div>
    </AppShell>
  )
}
