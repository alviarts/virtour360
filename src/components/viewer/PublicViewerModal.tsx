import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { Viewer } from "@photo-sphere-viewer/core"
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin"
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin"
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageCircle,
  Phone,
  Volume2,
  VolumeX,
  X,
} from "lucide-react"
import { tourConfig } from "../../config/tour.config"
import { contentHotspots, navigationTarget, polygonHotspots, sceneLinks } from "../../lib/sceneGraph"
import { panoColor, readableTextOn, safeExternalHref } from "../../lib/color"
import { studioThemeStyle } from "../../lib/viewerTheme"
import { createPolygonLayer } from "../../lib/viewerPolygons"
import { normalizeStudioConfig, type StudioConfig } from "../../types/studio"
import type { Hotspot, Scene } from "../../types/tour"
import { HotspotPopup } from "./HotspotPopup"

interface PublicViewerModalProps {
  title: string
  panorama: string
  onClose: () => void
  scenes?: Scene[]
  sceneId?: string
  /** Dipakai rute publish: viewer mengisi halaman, bukan overlay modal. */
  inline?: boolean
  /** Config Studio hasil publish; mengaktifkan tema, CTA, polygon, floorplan, mini-map. */
  studioConfig?: StudioConfig
}

/**
 * PSV punya promise internal yang masih merender node saat viewer ditutup
 * sebelum panorama selesai dimuat. Tunda destroy sampai siap (maks. 5 detik)
 * supaya tidak ada unhandled rejection saat pengunjung langsung keluar.
 */
function destroyWhenReady(viewer: Viewer, ready: boolean) {
  const destroy = () => {
    try { viewer.destroy() } catch { /* viewer sudah hancur */ }
  }
  if (ready) {
    destroy()
    return
  }
  let done = false
  const finish = () => {
    if (done) return
    done = true
    viewer.removeEventListener("ready", finish)
    window.clearTimeout(timer)
    destroy()
  }
  const timer = window.setTimeout(finish, 5000)
  viewer.addEventListener("ready", finish)
}

/** Viewer 360° penuh layar untuk pengunjung public view (tanpa masuk Studio). */
export function PublicViewerModal({
  title,
  panorama,
  onClose,
  scenes: scenesProp,
  sceneId,
  inline = false,
  studioConfig,
}: PublicViewerModalProps) {
  // AppContext bisa mengganti array scene dengan isi yang sama (hidrasi lokal).
  // Kunci konten menjaga viewer tidak hancur/dibuat ulang di tengah transisi.
  const scenesSignature = useMemo(
    () => (scenesProp ?? []).map((scene) => [
      scene.id,
      scene.name,
      String(scene.panorama).length,
      String(scene.panorama).slice(0, 80),
      scene.hotspots.map((spot) => `${spot.id}:${spot.yaw}:${spot.pitch}:${spot.polygon ? JSON.stringify(spot.polygon.points) : ""}`).join(","),
    ].join("|")).join("||"),
    [scenesProp],
  )
  const scenes = useMemo(() => scenesProp, [scenesSignature])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const tourRef = useRef<VirtualTourPlugin | null>(null)
  const [currentTitle, setCurrentTitle] = useState(title)
  const [currentIndex, setCurrentIndex] = useState(() => {
    const index = scenes?.findIndex((scene) => scene.id === sceneId) ?? -1
    return index >= 0 ? index : 0
  })
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null)
  const [playing, setPlaying] = useState(false)
  const [viewYaw, setViewYaw] = useState(0)
  const [miniOpen, setMiniOpen] = useState(true)
  const [floorOpen, setFloorOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastActivationRef = useRef<{ id: string; at: number } | null>(null)
  const readyRef = useRef(false)
  const nodeChangedRef = useRef(false)
  const pendingNodeRef = useRef<string | null>(null)
  const activeNodeRef = useRef(sceneId)

  const config = useMemo(() => normalizeStudioConfig(studioConfig ?? null), [studioConfig])
  const theme = config.theme
  const hasTour = (scenes?.length ?? 0) > 1
  const currentScene = scenes?.[currentIndex] ?? null
  const ctaHref = safeExternalHref(config.cta.href)

  useEffect(() => setFloorOpen(config.floorplan.showOnStart), [config.floorplan.showOnStart])

  const scenesRef = useRef(scenes)
  scenesRef.current = scenes

  /**
   * PSV VirtualTourPlugin belum punya renderer panah sebelum event `ready`.
   * Navigasi yang dipicu terlalu cepat akan error, jadi antre sampai siap.
   */
  const goToNode = useCallback((id: string) => {
    if (!id) return
    // Jangan memotong pemuatan node awal: setCurrentNode saat itu akan
    // membatalkan render panah dan navigasi bisa menggantung.
    if (!nodeChangedRef.current) {
      pendingNodeRef.current = id
      return
    }
    activeNodeRef.current = id
    tourRef.current?.setCurrentNode(id).catch(() => undefined)
  }, [])

  /** Satu jalur aktivasi marker/polygon: navigasi dulu, baru popup konten. */
  const activateSpot = useCallback((spot?: Hotspot) => {
    if (!spot) return
    const now = Date.now()
    const last = lastActivationRef.current
    if (last && last.id === spot.id && now - last.at < 400) return
    lastActivationRef.current = { id: spot.id, at: now }
    const target = navigationTarget(spot)
    if (target && (scenesRef.current ?? []).some((scene) => scene.id === target)) {
      setActiveHotspot(null)
      goToNode(target)
      return
    }
    if (spot.type === "link" && spot.href) {
      window.open(spot.href, "_blank", "noopener,noreferrer")
      return
    }
    setActiveHotspot(spot)
  }, [goToNode])

  const spotById = useCallback((id: string | undefined): Hotspot | undefined => {
    if (!id) return undefined
    const nodeId = tourRef.current?.getCurrentNode?.()?.id ?? scenesRef.current?.[0]?.id
    return (scenesRef.current ?? []).find((scene) => scene.id === nodeId)?.hotspots.find((spot) => spot.id === id)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onPositionUpdated = (event: any) => {
      const yaw = event?.position?.yaw ?? viewerRef.current?.getPosition().yaw ?? 0
      setViewYaw((yaw * 180) / Math.PI)
    }

    if (!hasTour) {
      const viewer = new Viewer({
        container,
        panorama,
        navbar: false,
        minFov: tourConfig.minFov,
        maxFov: tourConfig.maxFov,
        defaultZoomLvl: tourConfig.defaultZoom,
        mousewheelCtrlKey: false,
        touchmoveTwoFingers: true,
      })
      viewerRef.current = viewer
      viewer.addEventListener("position-updated", onPositionUpdated)
      let ready = false
      const onReady = () => {
        ready = true
        readyRef.current = true
      }
      viewer.addEventListener("ready", onReady)
      return () => {
        readyRef.current = false
        viewer.removeEventListener("position-updated", onPositionUpdated)
        viewer.removeEventListener("ready", onReady)
        destroyWhenReady(viewer, ready)
        viewerRef.current = null
      }
    }

    const list = scenes!
    nodeChangedRef.current = false

    const viewer = new Viewer({
      container,
      plugins: [MarkersPlugin, VirtualTourPlugin.withConfig({
        dataMode: "client",
        positionMode: "manual",
        renderMode: "2d",
        nodes: list.map((scene) => ({
          id: scene.id,
          panorama: scene.panorama,
          name: scene.name,
          thumbnail: scene.thumbnail,
          links: sceneLinks(scene),
          markers: contentHotspots(scene)
            .map((h) => ({
              id: h.id,
              position: { yaw: `${h.yaw}deg`, pitch: `${h.pitch}deg` },
              size: { width: 44, height: 44 },
              html: `<div class="hs-marker" style="--hs-color:${h.style?.color ?? "#facc15"};opacity:${(h.style?.opacity ?? 100) / 100}">
                <span class="hs-dot${h.style?.effect && h.style.effect !== "normal" ? ` hs-${h.style.effect}` : ""}${h.style?.shape && h.style.shape !== "circle" ? ` hs-shape-${h.style.shape}` : ""}" data-hs-id="${h.id}" style="width:${14 + (h.style?.size ?? 3) * 2.4}px;height:${14 + (h.style?.size ?? 3) * 2.4}px;transform:rotate(${h.style?.rotate ?? 0}deg)"></span>
                ${h.style?.showLabel ? `<span class="hs-label${h.style?.labelOnHover ? " hs-label-on-hover" : ""}">${String(h.title).replace(/[&<>"']/g, "")}</span>` : ""}
              </div>`,
              tooltip: { content: h.title, position: "top" as const },
              data: { hotspotId: h.id, targetSceneId: navigationTarget(h) ?? null },
            })),
        })),
        startNodeId: activeNodeRef.current && list.some((s) => s.id === activeNodeRef.current)
          ? activeNodeRef.current
          : list[0].id,
        // Transisi fade/rotate bisa menggantung pada sebagian konteks WebGL.
        // Pergantian langsung membuat navigasi publik deterministik.
        transitionOptions: { speed: "16rpm", effect: "none", rotation: false },
      })],
      navbar: false,
      minFov: tourConfig.minFov,
      maxFov: tourConfig.maxFov,
      defaultZoomLvl: tourConfig.defaultZoom,
      mousewheelCtrlKey: false,
      touchmoveTwoFingers: true,
    })

    viewerRef.current = viewer
    tourRef.current = viewer.getPlugin<VirtualTourPlugin>(VirtualTourPlugin)
    const startIndex = list.findIndex((scene) => scene.id === activeNodeRef.current)
    if (startIndex >= 0) setCurrentIndex(startIndex)
    const tourPlugin = tourRef.current
    /**
     * Antrean navigasi hanya dijalankan setelah node awal selesai. Memanggil
     * setCurrentNode dari dalam event `node-changed` bisa menggantung karena
     * promise node pertama belum keluar dari rantainya, jadi jalankan satu tick
     * setelahnya. Urutan `ready` / `node-changed` juga tidak tetap, maka kedua
     * event sama-sama menjadwalkan flush dengan jeda agar PSV selesai transisi
     * node awal.
     */
    let flushTimer: number | undefined
    const flushPendingNode = () => {
      const pending = pendingNodeRef.current
      if (!pending || !nodeChangedRef.current) return
      if (tourPlugin?.getCurrentNode?.()?.id === pending) {
        pendingNodeRef.current = null
        return
      }
      pendingNodeRef.current = null
      activeNodeRef.current = pending
      tourPlugin?.setCurrentNode(pending).catch(() => undefined)
    }
    const scheduleFlush = () => {
      if (flushTimer !== undefined) return
      flushTimer = window.setTimeout(() => {
        flushTimer = undefined
        flushPendingNode()
      }, 1000)
    }
    const onNodeChanged = (event: { node: { name?: string; id: string } }) => {
      nodeChangedRef.current = true
      activeNodeRef.current = event.node.id
      setCurrentTitle(event.node.name ?? title)
      const index = list.findIndex((scene) => scene.id === event.node.id)
      if (index >= 0) setCurrentIndex(index)
      setActiveHotspot(null)
      scheduleFlush()
    }
    tourPlugin?.addEventListener("node-changed", onNodeChanged)
    viewer.addEventListener("position-updated", onPositionUpdated)
    let ready = false
    const onReady = () => {
      ready = true
      readyRef.current = true
      if (nodeChangedRef.current) scheduleFlush()
    }
    viewer.addEventListener("ready", onReady)

    const markersPlugin: any = viewer.getPlugin("markers")
    const onSelectMarker = (event: any) => activateSpot(spotById(event?.marker?.data?.hotspotId ?? event?.marker?.id))
    markersPlugin?.addEventListener?.("select-marker", onSelectMarker)

    const onClickMarker = (event: MouseEvent) => {
      const dot = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-hs-id]")
      if (!dot) return
      activateSpot(spotById(dot.dataset.hsId))
    }
    container.addEventListener("click", onClickMarker)

    return () => {
      tourPlugin?.removeEventListener("node-changed", onNodeChanged)
      markersPlugin?.removeEventListener?.("select-marker", onSelectMarker)
      viewer.removeEventListener("position-updated", onPositionUpdated)
      viewer.removeEventListener("ready", onReady)
      if (flushTimer !== undefined) window.clearTimeout(flushTimer)
      readyRef.current = false
      nodeChangedRef.current = false
      // Antrean navigasi sengaja dipertahankan: viewer bisa dibuat ulang
      // saat data scene lokal selesai dimuat.
      container.removeEventListener("click", onClickMarker)
      destroyWhenReady(viewer, ready)
      viewerRef.current = null
      tourRef.current = null
    }
  }, [hasTour, panorama, scenes, sceneId, title, activateSpot, spotById])

  /** Area/garis dari Studio ikut tampil dan bisa diklik di tour publik. */
  useEffect(() => {
    const container = containerRef.current
    const viewer = viewerRef.current
    if (!container || !viewer || !currentScene) return
    const layer = createPolygonLayer(
      container,
      viewer,
      polygonHotspots(currentScene),
      config.polygon,
      activateSpot,
    )
    return () => layer.destroy()
  }, [currentScene, config.polygon, activateSpot, hasTour])

  const go = (delta: number) => {
    const list = scenes ?? []
    if (list.length < 2) return
    const next = (currentIndex + delta + list.length) % list.length
    // Judul dan nomor scene di-update dari event node-changed, bukan di sini.
    goToNode(list[next].id)
  }

  const seek = (clientX: number, element: HTMLElement) => {
    const viewer = viewerRef.current
    if (!viewer) return
    const rect = element.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const pitch = viewer.getPosition().pitch
    viewer.rotate({ yaw: `${(ratio * 360 - 180).toFixed(1)}deg`, pitch: `${(pitch * 180 / Math.PI).toFixed(1)}deg` })
  }

  const currentAudio = currentScene?.audio
  const backgroundSound = config.setting.backgroundSound

  useEffect(() => {
    setPlaying(false)
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }, [currentAudio, backgroundSound])

  const toggleAudio = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    } else {
      audio.pause()
      setPlaying(false)
    }
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

  const ctaIcon = ctaHref.startsWith("tel:")
    ? Phone
    : ctaHref.startsWith("mailto:")
      ? Mail
      : /wa\.me|whatsapp/i.test(ctaHref)
        ? MessageCircle
        : ArrowUpRight
  const CtaIcon = ctaIcon
  const ctaStyle = {
    bottom: 72,
    [config.cta.position]: config.cta.offset,
  } as CSSProperties
  const markerLeft = ((viewYaw + 180) / 360) * 100

  return (
    <div
      style={studioThemeStyle(config)}
      className={inline ? "absolute inset-0 bg-black" : "fixed inset-0 z-[120] bg-black"}
    >
      <div ref={containerRef} className="absolute inset-0" />

      {activeHotspot && <HotspotPopup spot={activeHotspot} onClose={() => setActiveHotspot(null)} />}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/70 to-transparent p-4">
        <div>
          {!theme.hideProjectTitle && (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Virtual tour</p>
          )}
          {!theme.hideSceneTitle && (
            <h3 className="mt-0.5 text-sm font-semibold text-white">{currentTitle}</h3>
          )}
          <span className="mt-1 block h-0.5 w-8 rounded-full" style={{ background: theme.primaryColor }} />
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

      {/* Mini-map 360° — sekarang ikut tampil di tour publik */}
      {hasTour && currentScene && (
        <div className="absolute right-4 top-20 z-10 w-52 overflow-hidden rounded-xl border border-white/15 bg-zinc-950/80 text-white shadow-xl backdrop-blur sm:w-64">
          <button
            onClick={() => setMiniOpen((value) => !value)}
            className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold"
          >
            <span>Mini-map · {currentScene.hotspots.length} hotspot</span>
            <span className="text-white/50">{miniOpen ? "−" : "+"}</span>
          </button>
          {miniOpen && (
            <div
              className="relative h-24 cursor-crosshair overflow-hidden bg-zinc-900"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture?.(event.pointerId)
                seek(event.clientX, event.currentTarget)
              }}
              onPointerMove={(event) => {
                if (event.buttons === 1) seek(event.clientX, event.currentTarget)
              }}
              title="Klik atau geser untuk mengarahkan pandangan"
            >
              <img
                src={currentScene.panorama || currentScene.thumbnail}
                alt=""
                className="pointer-events-none absolute top-0 h-full w-[200%] max-w-none select-none object-cover opacity-80"
                style={{ left: `-${Math.max(0, Math.min(100, markerLeft / 2))}%` }}
                draggable={false}
              />
              {currentScene.hotspots.map((spot) => {
                const left = Math.max(0, Math.min(100, ((spot.yaw + 180) / 360) * 100))
                const top = Math.max(0, Math.min(100, ((90 - spot.pitch) / 180) * 100))
                return (
                  <span
                    key={spot.id}
                    title={spot.title}
                    className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70"
                    style={{ left: `${left}%`, top: `${top}%`, background: theme.primaryColor }}
                  />
                )
              })}
              <span
                className="pointer-events-none absolute bottom-0 top-0 w-[2px] shadow-[0_0_8px_currentColor]"
                style={{ left: `${Math.max(0, Math.min(100, markerLeft))}%`, color: theme.primaryColor, background: theme.primaryColor }}
              />
            </div>
          )}
        </div>
      )}

      {/* Floorplan interaktif dari panel Design → Floorplan */}
      {config.floorplan.image && currentScene && (
        <div
          className={`absolute bottom-24 z-20 overflow-hidden rounded-xl border border-white/20 shadow-2xl backdrop-blur-md ${config.floorplan.position === "left" ? "left-4" : "right-4"}`}
          style={{
            width: config.floorplan.layout === "panel" ? 220 : 160,
            background: panoColor(config.floorplan.background, "rgba(255,255,255,.46)"),
          }}
        >
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[10px] font-semibold text-zinc-900">Floorplan</span>
            {floorOpen && (
              <button onClick={() => setFloorOpen(false)} className="text-zinc-900/70 hover:text-zinc-900" aria-label="Tutup floorplan"><X size={12} /></button>
            )}
          </div>
          {floorOpen && (
            <>
              <img src={config.floorplan.image} alt="Floorplan" className="h-28 w-full object-cover" />
              {hasTour && (
                <div className="flex flex-wrap gap-1 p-1.5">
                  {scenes!.map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => goToNode(scene.id)}
                      title={scene.name}
                      aria-label={`Pindah ke ${scene.name}`}
                      className="size-3.5 rounded-full border-2"
                      style={{
                        borderColor: config.floorplan.markerBorder,
                        background: scene.id === currentScene.id ? config.floorplan.markerBackground : "rgba(0,0,0,.35)",
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
          {!floorOpen && (
            <button onClick={() => setFloorOpen(true)} className="w-full px-2 pb-2 text-left text-[10px] font-semibold text-zinc-900">
              Buka floorplan →
            </button>
          )}
        </div>
      )}

      {config.cta.enabled && ctaHref && (
        <a
          href={ctaHref}
          target="_blank"
          rel="noreferrer"
          style={{ ...ctaStyle, background: theme.primaryColor, color: readableTextOn(theme.primaryColor) }}
          className="absolute z-20 flex max-w-[260px] items-center gap-3 rounded-full px-4 py-2 text-white shadow-xl transition-transform hover:scale-[1.02]"
        >
          <CtaIcon size={16} className="shrink-0" />
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-bold">{config.cta.title}</span>
            {config.cta.layout === "list" && (
              <span className="block truncate text-[10px] opacity-80">{config.cta.description}</span>
            )}
          </span>
        </a>
      )}

      {(currentAudio || backgroundSound) && (
        <div className="absolute bottom-16 left-4 z-10 flex items-center gap-2 rounded-full bg-black/60 px-2 py-1.5 text-white backdrop-blur">
          <button
            onClick={toggleAudio}
            title={playing ? "Jeda audio" : "Putar audio"}
            className="grid size-8 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          >
            {playing ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <span className="pr-2 text-[11px] text-white/80">
            {playing ? "Memutar audio" : currentAudio ? "Audio scene" : "Audio tour"}
          </span>
          <audio ref={audioRef} src={currentAudio || backgroundSound} loop={!currentAudio && !!backgroundSound} onEnded={() => setPlaying(false)} />
        </div>
      )}

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
        {inline
          ? "Geser untuk melihat 360° · scroll zoom · klik penanda/area untuk detail · panah untuk pindah scene"
          : "Geser untuk melihat 360° · scroll zoom · klik penanda atau area untuk detail · Esc keluar"}
      </div>
    </div>
  )
}
