import { useCallback, useRef, useState } from "react"
import { AppShell } from "./components/layout/AppShell"
import { TopBar } from "./components/layout/TopBar"
import { LeftSidebar } from "./components/layout/LeftSidebar"
import { RightPanel } from "./components/layout/RightPanel"
import { TourViewer } from "./components/viewer/TourViewer"
import { MediaPickerModal } from "./components/viewer/MediaPickerModal"
import { ProfileModal } from "./components/auth/ProfileModal"
import { EmbedModal } from "./components/auth/EmbedModal"
import { PublishModal } from "./components/auth/PublishModal"
import { Lightbox } from "./components/ui/Lightbox"
import { useTourViewer, type Quality } from "./hooks/useTourViewer"
import { useFullscreen } from "./hooks/useFullscreen"
import { useHotkeys } from "./hooks/useHotkeys"
import { useApp } from "./context/useApp"
import { profile } from "./data/profile"
import { navigate } from "./lib/navigation"
import { publicShareUrl } from "./lib/publicStore"
import { defaultEffects } from "./lib/effects"
import type { HotspotIcon, HotspotType } from "./types/tour"
import { defaultSceneId } from "./data/scenes"

interface SettingsPopoverProps {
  quality: Quality
  qualityLabel: string
  setQuality: (q: Quality) => void
  compass: boolean
  setCompass: (v: boolean) => void
  gyroscope: boolean
  setGyroscope: (v: boolean) => void
  showMiniMap: boolean
  setShowMiniMap: (v: boolean) => void
  showSideMenu: boolean
  setShowSideMenu: (v: boolean) => void
  showGraph: boolean
  setShowGraph: (v: boolean) => void
}

function SettingsPopover({
  quality,
  qualityLabel,
  setQuality,
  compass,
  setCompass,
  gyroscope,
  setGyroscope,
  showMiniMap,
  setShowMiniMap,
  showSideMenu,
  setShowSideMenu,
  showGraph,
  setShowGraph,
}: SettingsPopoverProps) {
  return (
    <div className="flex flex-col gap-3 text-xs text-zinc-400">
      <div className="flex items-center justify-between gap-2">
        <span>Kualitas</span>
        <div className="flex overflow-hidden rounded border border-zinc-700">
          {(["hemat", "standar", "tinggi"] as Quality[]).map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              title={`Kualitas ${q} — mengubah zoom & batas detail`}
              className={`px-1.5 py-0.5 text-[10px] capitalize ${quality === q ? "bg-white text-black" : "text-zinc-400 hover:bg-white/10"}`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
      <p className="-mt-2 text-right text-[10px] text-zinc-600">Aktif: {qualityLabel}</p>

      <label className="flex cursor-pointer items-center justify-between">
        <span>Kompas</span>
        <input type="checkbox" checked={compass} onChange={(e) => setCompass(e.target.checked)} className="size-3.5 accent-sky-500" />
      </label>
      <label className="flex cursor-pointer items-center justify-between">
        <span>Gyroskop</span>
        <input type="checkbox" checked={gyroscope} onChange={(e) => setGyroscope(e.target.checked)} className="size-3.5 accent-amber-400" />
      </label>
      <div className="border-t border-zinc-800 pt-2">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">View options</p>
        {([
          ["Mini-map", showMiniMap, setShowMiniMap],
          ["Side menu", showSideMenu, setShowSideMenu],
          ["Tour graph", showGraph, setShowGraph],
        ] as const).map(([label, value, setter]) => (
          <label key={label} className="flex cursor-pointer items-center justify-between py-0.5">
            <span>{label}</span>
            <input type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)} className="size-3.5 accent-sky-500" />
          </label>
        ))}
      </div>
      <div className="border-t border-zinc-800 pt-2 text-[10px] leading-relaxed text-zinc-600">
        Gyroskop hanya bekerja pada perangkat sensor &amp; localhost/HTTPS.
        <br />
        Arrow Left/Right: pindah scene · R: reset · F: layar penuh · + / -: zoom
      </div>
    </div>
  )
}

export default function App() {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const audioInputRef = useRef<HTMLInputElement | null>(null)
  const [activeTool, setActiveTool] = useState("select")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [preview, setPreview] = useState(false)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [embedOpen, setEmbedOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showSideMenu, setShowSideMenu] = useState(false)
  const [showGraph, setShowGraph] = useState(false)
  const [publishedUid, setPublishedUid] = useState<string | null>(
    () => localStorage.getItem("virtour360.publishedUid"),
  )
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const {
    scenes,
    user,
    activeSceneId,
    setActiveSceneId,
    addHotspot,
    updateHotspot,
    removeHotspot,
    undoEdit,
    canUndo,
    captureThumbnail,
    setSceneAudio,
    removeSceneAudio,
    audioByScene,
    removePanorama,
    setAuthOpen,
    setUploadOpen,
    setReplaceSceneId,
    logout,
    notify,
    effectsByScene,
  } = useApp()

  const currentEffects = effectsByScene[activeSceneId] ?? defaultEffects

  const tour = useTourViewer(scenes, {
    activeSceneId,
    onSceneChange: setActiveSceneId,
    onAddHotspot: addHotspot,
    onMoveHotspot: (sceneId, id, yaw, pitch) => updateHotspot(sceneId, id, { yaw, pitch }),
    onNotify: notify,
    effects: currentEffects,
  })
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(shellRef)

  const currentIndex = Math.max(0, scenes.findIndex((s) => s.id === tour.currentSceneId))

  // Pemetaan jenis hotspot Panoee → tipe + ikon internal.
  const pickHotspot = (label: string) => {
    const map: Record<string, [HotspotType, HotspotIcon]> = {
      Point: ["info", "point"],
      Chevron: ["scene", "point"],
      Image: ["info", "image"],
      Article: ["info", "info"],
      Video: ["info", "video"],
      Sound: ["info", "sound"],
      Link: ["link", "link"],
      Compact: ["info", "product"],
      Product: ["project", "product"],
    }
    const [type, icon] = map[label] ?? ["info", "point"]
    tour.startPlacement(type, icon)
    notify(`Klik gambar untuk menaruh hotspot ${label}.`)
  }

  const goRelative = useCallback(
    (delta: number) => {
      const next = scenes[(currentIndex + delta + scenes.length) % scenes.length]
      tour.goToScene(next.id)
    },
    [currentIndex, scenes, tour],
  )

  useHotkeys({
    onPrev: () => goRelative(-1),
    onNext: () => goRelative(1),
    onReset: tour.resetView,
    onZoomIn: () => tour.zoomBy(6),
    onZoomOut: () => tour.zoomBy(-6),
    onFullscreen: toggleFullscreen,
  })

  const openUpload = () => setUploadOpen(true)

  const handleTool = (id: string) => {
    setActiveTool(id)
    if (id === "pin") {
      tour.startPlacement("info")
      notify("Klik panorama untuk menaruh hotspot.")
    } else if (id === "draw") {
      tour.startPlacement("project")
      notify("Klik panorama untuk menandai area proyek.")
    } else if (id === "undo") {
      undoEdit()
    } else if (id === "settings") {
      setSettingsOpen((v) => !v)
    } else if (id === "select" || id === "cursor") {
      tour.stopPlacement()
    }
  }

  const handleRemoveScene = (id: string) => {
    void removePanorama(id).then(() => {
      if (id === tour.currentSceneId) setActiveSceneId(defaultSceneId)
      notify("Scene upload dihapus.")
    })
  }

  return (
    <AppShell containerRef={shellRef}>
      {!preview && (
        <>
          <TopBar
            activeTool={activeTool}
            onToolChange={handleTool}
            onToggleSettings={() => setSettingsOpen((v) => !v)}
            initials={user?.initials ?? profile.initials}
            onAccount={() => setAccountOpen((v) => !v)}
            onSuggestions={() => setSuggestionsOpen((v) => !v)}
            suggestionsOpen={suggestionsOpen}
            canUndo={canUndo}
            preview={false}
            onTogglePreview={() => setPreview(true)}
            onPublish={() => setPublishOpen(true)}
          />

          {suggestionsOpen && (
            <div className="absolute right-2 top-14 z-40 w-56 animate-fade-up rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-2xl">
              <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Saran untuk scene ini</p>
              {[
                { label: "Tambah hotspot info", run: () => { tour.startPlacement("info"); notify("Klik gambar untuk menaruh hotspot.") } },
                { label: "Reset tampilan", run: tour.resetView },
                { label: "Buka scene berikutnya", run: () => goRelative(1) },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => { item.run(); setSuggestionsOpen(false) }}
                  className="flex w-full items-center rounded-lg px-2 py-2 text-left text-[11px] text-zinc-300 hover:bg-white/5"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {accountOpen && (
            <div className="absolute left-2 top-12 z-40 w-52 animate-fade-up rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-2xl">
              <div className="border-b border-zinc-800 px-2 pb-2">
                <p className="truncate text-xs font-semibold text-zinc-100">{user?.name ?? "Publik"}</p>
                <p className="truncate text-[10px] text-zinc-500">
                  {user?.email ?? "Data tersimpan di browser ini"}
                </p>
              </div>
              <button onClick={() => { setAccountOpen(false); setProfileOpen(true) }} className="mt-1 flex w-full items-center rounded-lg px-2 py-2 text-left text-[11px] text-zinc-300 hover:bg-white/5">
                Pengaturan akun
              </button>
              <button onClick={() => { setAccountOpen(false); openUpload() }} className="flex w-full items-center rounded-lg px-2 py-2 text-left text-[11px] text-zinc-300 hover:bg-white/5">
                Unggah panorama 360°
              </button>
              <button onClick={() => { setAccountOpen(false); navigate("dashboard") }} className="flex w-full items-center rounded-lg px-2 py-2 text-left text-[11px] text-zinc-300 hover:bg-white/5">
                Buka Dashboard
              </button>
              <button onClick={() => { setAccountOpen(false); navigate("portfolio") }} className="flex w-full items-center rounded-lg px-2 py-2 text-left text-[11px] text-zinc-300 hover:bg-white/5">
                Kembali ke Portofolio user
              </button>
              <button onClick={() => { setAccountOpen(false); setEmbedOpen(true) }} className="flex w-full items-center rounded-lg px-2 py-2 text-left text-[11px] text-zinc-300 hover:bg-white/5">
                Embed portofolio
              </button>
              {publishedUid && (
                <button
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(publicShareUrl(publishedUid)); notify("Link publish disalin.") }
                    catch { notify(publicShareUrl(publishedUid)) }
                    setAccountOpen(false)
                  }}
                  className="flex w-full items-center rounded-lg px-2 py-2 text-left text-[11px] text-emerald-400 hover:bg-emerald-500/10"
                >
                  Salin link publish
                </button>
              )}
              <button onClick={() => { setAccountOpen(false); navigate("home") }} className="flex w-full items-center rounded-lg px-2 py-2 text-left text-[11px] text-zinc-300 hover:bg-white/5">
                Kembali ke Home
              </button>
              {user ? (
                <button
                  onClick={() => { logout(); setAccountOpen(false); notify("Anda telah keluar.") }}
                  className="flex w-full items-center rounded-lg px-2 py-2 text-left text-[11px] text-red-400 hover:bg-red-500/10"
                >
                  Keluar
                </button>
              ) : (
                <button
                  onClick={() => { setAccountOpen(false); setAuthOpen(true) }}
                  className="flex w-full items-center rounded-lg px-2 py-2 text-left text-[11px] text-sky-400 hover:bg-sky-500/10"
                >
                  Masuk / Daftar (opsional)
                </button>
              )}
            </div>
          )}

          <LeftSidebar
            scenes={scenes}
            currentSceneId={tour.currentSceneId}
            onSelect={tour.goToScene}
            onAddScene={openUpload}
            onCreate={openUpload}
            onRemoveScene={handleRemoveScene}
          />
        </>
      )}

      <TourViewer
        containerRef={tour.containerRef}
        scene={tour.currentScene}
        scenes={scenes}
        view={tour.view}
        hotspotCount={tour.currentScene.hotspots.length}
        onSeek={tour.rotateTo}
        isAutorotate={tour.isAutorotate}
        onToggleAutorotate={tour.toggleAutorotate}
        onAddHotspot={() => { tour.startPlacement("info"); notify("Klik gambar untuk menaruh hotspot.") }}
        onPickHotspot={pickHotspot}
        onReset={tour.resetView}
        onZoomIn={() => tour.zoomBy(6)}
        onZoomOut={() => tour.zoomBy(-6)}
        onFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        settingsOpen={!preview && settingsOpen}
        settingsContent={
          <SettingsPopover
            quality={tour.quality}
            qualityLabel={tour.qualityLabel}
            setQuality={tour.setQuality}
            compass={tour.compass}
            setCompass={tour.setCompassVisible}
            gyroscope={tour.gyroscope}
            setGyroscope={tour.setGyroscopeEnabled}
            showMiniMap={showMiniMap}
            setShowMiniMap={setShowMiniMap}
            showSideMenu={showSideMenu}
            setShowSideMenu={setShowSideMenu}
            showGraph={showGraph}
            setShowGraph={setShowGraph}
          />
        }
        onNotify={notify}
        showMiniMap={showMiniMap}
        showSideMenu={showSideMenu}
        showGraph={showGraph}
        onSelectScene={tour.goToScene}
        showNadir={currentEffects.nadir}
        inset={preview ? { left: 0, right: 0 } : undefined}
        preview={preview}
        onExitPreview={() => setPreview(false)}
        prevScene={scenes[(currentIndex - 1 + scenes.length) % scenes.length]}
        nextScene={scenes[(currentIndex + 1) % scenes.length]}
        onPrevScene={() => tour.goToScene(scenes[(currentIndex - 1 + scenes.length) % scenes.length].id)}
        onNextScene={() => tour.goToScene(scenes[(currentIndex + 1) % scenes.length].id)}
        audioName={audioByScene[tour.currentScene.id]?.name}
        onRemoveAudio={() => {
          void removeSceneAudio(tour.currentScene.id).then(() => notify("Audio dihapus."))
        }}
        placementType={tour.placementType}
        onCancelPlacement={tour.stopPlacement}
        onDraw={() => tour.startPlacement("project")}
        onUploadAudio={() => audioInputRef.current?.click()}
      />

      {!preview && (
        <>
          <RightPanel
            scene={tour.currentScene}
            scenes={scenes}
            selectedHotspot={tour.selectedHotspot}
            onClearHotspot={tour.clearSelectedHotspot}
            onSelectHotspot={tour.selectHotspotById}
            onGoToScene={tour.goToScene}
            onUpdateHotspot={(id, patch) => updateHotspot(tour.currentScene.id, id, patch)}
            onRemoveHotspot={(id) => { removeHotspot(tour.currentScene.id, id); notify("Hotspot dihapus.") }}
            onAddHotspot={() => { tour.startPlacement("info"); notify("Klik gambar untuk menaruh hotspot.") }}
            onCaptureThumbnail={() => {
              captureThumbnail(tour.currentScene.id, tour.currentThumbnailUrl())
              notify("Thumbnail diset ke panorama aktif.")
            }}
            onExpandThumbnail={() => setLightboxOpen(true)}
            onSelectPost={() => setMediaPickerOpen(true)}
            onReplace={() => { setReplaceSceneId(tour.currentScene.id); setUploadOpen(true) }}
            onUploadAudio={() => audioInputRef.current?.click()}
            onRemoveAudio={() => void removeSceneAudio(tour.currentScene.id)}
            audioName={audioByScene[tour.currentScene.id]?.name}
          />

          {!tour.isReady && (
            <div className="absolute bottom-0 left-60 right-[260px] top-0 z-40 grid place-items-center bg-zinc-950/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <span className="size-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
                <span className="text-xs text-zinc-400">Menyiapkan panorama⬦</span>
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute bottom-3 right-[272px] z-10 hidden text-[10px] text-zinc-600 lg:block">
            {user?.name ?? profile.name} · {tour.currentScene.project.title} · {tour.currentScene.project.year}
          </div>
        </>
      )}

      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            void setSceneAudio(tour.currentScene.id, file).then(() => notify(`Audio "${file.name}" dipasang pada scene.`))
          }
          event.target.value = ""
        }}
      />

      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
      {embedOpen && <EmbedModal onClose={() => setEmbedOpen(false)} />}
      {publishOpen && (
        <PublishModal
          onClose={() => setPublishOpen(false)}
          scenes={scenes}
          userName={user?.name}
          userInitials={user?.initials}
          onPublished={(uid) => {
            setPublishedUid(uid)
            localStorage.setItem("virtour360.publishedUid", uid)
            notify("Link, QR, dan embed siap dibagikan.")
          }}
        />
      )}
      {mediaPickerOpen && <MediaPickerModal activeSceneId={tour.currentScene.id} onClose={() => setMediaPickerOpen(false)} />}
      {lightboxOpen && <Lightbox src={tour.currentScene.thumbnail} title={tour.currentScene.name} onClose={() => setLightboxOpen(false)} />}
    </AppShell>
  )
}
