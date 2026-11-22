import { useCallback, useEffect, useRef, useState } from "react"
import { Viewer } from "@photo-sphere-viewer/core"
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin"
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin"
import { AutorotatePlugin } from "@photo-sphere-viewer/autorotate-plugin"
import { CompassPlugin } from "@photo-sphere-viewer/compass-plugin"
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin"
import { SettingsPlugin } from "@photo-sphere-viewer/settings-plugin"
import { defaultSceneId } from "../data/scenes"
import { tourConfig } from "../config/tour.config"
import { contentHotspots, findScene, sceneLinks } from "../lib/sceneGraph"
import { clamp, round } from "../lib/format"
import { defaultHotspotStyle, type Hotspot, type HotspotIcon, type HotspotType, type Scene } from "../types/tour"
import { effectsToCss, type SceneEffects } from "../lib/effects"

export type Quality = "hemat" | "standar" | "tinggi"

const QUALITY: Record<Quality, { minFov: number; zoom: number; label: string }> = {
  hemat: { minFov: 65, zoom: 45, label: "Hemat" },
  standar: { minFov: 30, zoom: 70, label: "Standar" },
  tinggi: { minFov: 15, zoom: 100, label: "Tinggi" },
}

const radToDeg = (rad: number) => (rad * 180) / Math.PI

const svgIcon = (path: string) =>
  `<svg viewBox="0 0 24 24" width="60%" height="60%" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`

const ICONS: Record<string, string> = {
  point: svgIcon('<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>'),
  info: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  project: svgIcon('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  link: svgIcon('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
  image: svgIcon('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m3 17 5-5 4 4 3-3 6 6"/>'),
  video: svgIcon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3V9Z"/>'),
  sound: svgIcon('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  product: svgIcon('<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Z"/><path d="m3 7 9 5 9-5M12 12v10"/>'),
  star: svgIcon('<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z"/>'),
  heart: svgIcon('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z"/>'),
}

function markerConfig(spot: Hotspot) {
  const style = { ...defaultHotspotStyle, ...(spot.style ?? {}) }
  const px = 14 + style.size * 2.4
  const effectClass = style.effect === "normal" ? "" : ` hs-${style.effect}`
  const shapeClass = style.shape === "circle" ? "" : ` hs-shape-${style.shape}`
  const icon = ICONS[style.icon] ?? ICONS[spot.type] ?? ICONS.info
  const label = style.showLabel
    ? `<span class="hs-label${style.labelOnHover ? " hs-label-on-hover" : ""}">${escapeHtml(spot.title)}</span>`
    : ""
  return {
    id: spot.id,
    position: { yaw: spot.yaw, pitch: spot.pitch },
    size: { width: px * 2, height: px * 2 },
    anchor: "center center" as const,
    html: `<div class="hs-marker" style="--hs-color:${escapeHtml(style.color)};opacity:${style.opacity / 100}">
      <span class="hs-dot${effectClass}${shapeClass}" data-hs-id="${escapeHtml(spot.id)}" title="Geser untuk memindahkan" style="width:${px}px;height:${px}px;transform:rotate(${style.rotate}deg)">${icon}</span>
      ${label}
    </div>`,
    tooltip: { content: spot.title, position: "top" as const },
    data: { hotspotId: spot.id },
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
  )
}

function buildNodes(scenes: Scene[]) {
  return scenes.map((scene) => ({
    id: scene.id,
    panorama: scene.panorama,
    name: scene.name,
    description: scene.description,
    thumbnail: scene.thumbnail,
    links: sceneLinks(scene),
    markers: contentHotspots(scene).map(markerConfig),
  }))
}

export type ViewState = { yaw: number; pitch: number; zoom: number }

interface ViewerOptions {
  activeSceneId: string
  onSceneChange: (id: string) => void
  onAddHotspot: (sceneId: string, spot: Hotspot) => void
  onMoveHotspot?: (sceneId: string, id: string, yaw: number, pitch: number) => void
  onNotify?: (message: string) => void
  effects: SceneEffects
}

export function useTourViewer(scenes: Scene[], options: ViewerOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const tourRef = useRef<VirtualTourPlugin | null>(null)
  const markersRef = useRef<MarkersPlugin | null>(null)
  const autorotateRef = useRef<AutorotatePlugin | null>(null)
  const compassRef = useRef<CompassPlugin | null>(null)
  const gyroRef = useRef<GyroscopePlugin | null>(null)

  const [isReady, setIsReady] = useState(false)
  const [currentSceneId, setCurrentSceneId] = useState(() =>
    scenes.some((s) => s.id === options.activeSceneId) ? options.activeSceneId : defaultSceneId,
  )
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [view, setView] = useState<ViewState>({ yaw: 0, pitch: 0, zoom: tourConfig.defaultZoom })
  const [isAutorotate, setIsAutorotate] = useState(false)
  const [quality, setQualityState] = useState<Quality>("standar")
  const [compass, setCompass] = useState(true)
  const [gyroscope, setGyroscope] = useState(false)
  const [placementType, setPlacementType] = useState<HotspotType | null>(null)

  const currentScene: Scene = findScene(scenes, currentSceneId)

  /* Event handler yang dipasang sekali memakai ref agar selalu membaca data terbaru. */
  const live = useRef({ scenes, currentSceneId, options })
  live.current = { scenes, currentSceneId, options }

  useEffect(() => {
    if (!containerRef.current) return

    const viewer = new Viewer({
      container: containerRef.current,
      plugins: [
        MarkersPlugin.withConfig({}),
        VirtualTourPlugin.withConfig({
          dataMode: "client",
          positionMode: "manual",
          renderMode: tourConfig.renderMode,
          nodes: buildNodes(live.current.scenes),
          startNodeId: live.current.currentSceneId,
          transitionOptions: {
            showLoader: true,
            speed: tourConfig.transitionSpeed,
            effect: "fade",
            rotation: true,
          },
          showLinkTooltip: true,
        }),
        AutorotatePlugin.withConfig({ autorotatePitch: "5deg", autorotateSpeed: "2rpm" }),
        CompassPlugin.withConfig({ size: "48px" }),
        GyroscopePlugin.withConfig({}),
        SettingsPlugin.withConfig({}),
      ],
      navbar: false,
      minFov: tourConfig.minFov,
      maxFov: tourConfig.maxFov,
      defaultZoomLvl: tourConfig.defaultZoom,
      touchmoveTwoFingers: true,
      mousewheelCtrlKey: false,
      caption: live.current.scenes[0]?.name ?? "Virtual Tour",
    })

    const markers = viewer.getPlugin<MarkersPlugin>(MarkersPlugin)
    const tour = viewer.getPlugin<VirtualTourPlugin>(VirtualTourPlugin)
    const autorotate = viewer.getPlugin<AutorotatePlugin>(AutorotatePlugin)
    const compassPlugin = viewer.getPlugin<CompassPlugin>(CompassPlugin)
    const gyroPlugin = viewer.getPlugin<GyroscopePlugin>(GyroscopePlugin)

    viewerRef.current = viewer
    tourRef.current = tour
    markersRef.current = markers
    autorotateRef.current = autorotate
    compassRef.current = compassPlugin
    gyroRef.current = gyroPlugin

    const onReady = () => {
      setIsReady(true)
      const start = findScene(live.current.scenes, live.current.currentSceneId).initialView
      viewer.rotate({ yaw: start.yaw, pitch: start.pitch })
    }
    const onNodeChanged = (e: any) => {
      const id: string = e.node.id
      setCurrentSceneId(id)
      setSelectedHotspot(null)
      live.current.options.onSceneChange(id)
    }
    const onSelectMarker = (e: any) => {
      const id = e.marker.data?.hotspotId ?? e.marker.id
      const { scenes: allScenes, currentSceneId: sceneId, options: opts } = live.current
      const scene = findScene(allScenes, sceneId)
      const spot = scene.hotspots.find((h) => h.id === id) ?? null
      if (spot?.type === "scene" && spot.targetSceneId) {
        tour.setCurrentNode(spot.targetSceneId).catch(() => opts.onNotify?.("Scene tujuan tidak ditemukan."))
        return
      }
      if (spot?.type === "link" && spot.href) {
        window.open(spot.href, "_blank", "noopener,noreferrer")
        return
      }
      setSelectedHotspot(spot)
    }
    const onPosition = (e: any) => {
      setView({
        yaw: round(radToDeg(e.position.yaw), 0),
        pitch: round(radToDeg(e.position.pitch), 0),
        zoom: round(viewer.getZoomLevel(), 0),
      })
    }
    const onClick = (e: any) => {
      if (!placementRef.current) return
      const data = e.data
      if (!data || data.rightclick) return
      placeHotspot(radToDeg(data.yaw), radToDeg(data.pitch), placementRef.current)
      placementRef.current = null
      placementIconRef.current = null
      setPlacementType(null)
    }

    viewer.addEventListener("ready", onReady)
    tour.addEventListener("node-changed", onNodeChanged)
    markers.addEventListener("select-marker", onSelectMarker)
    viewer.addEventListener("position-updated", onPosition)
    viewer.addEventListener("click", onClick)

    return () => {
      viewer.removeEventListener("ready", onReady)
      tour.removeEventListener("node-changed", onNodeChanged)
      markers.removeEventListener("select-marker", onSelectMarker)
      viewer.removeEventListener("position-updated", onPosition)
      viewer.removeEventListener("click", onClick)
      viewer.destroy()
      viewerRef.current = null
      tourRef.current = null
      markersRef.current = null
      autorotateRef.current = null
      compassRef.current = null
      gyroRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Geser marker hotspot ke posisi baru dengan mouse (drag). */
  useEffect(() => {
    const container = containerRef.current
    const viewer = viewerRef.current
    if (!container || !viewer || !isReady) return

    let draggingId: string | null = null
    let latest: { yaw: number; pitch: number } | null = null
    let ghost: HTMLDivElement | null = null
    let raf = 0
    let pointer: { x: number; y: number } | null = null

    const drawGhost = () => {
      if (!ghost || !pointer) return
      const rect = container.getBoundingClientRect()
      ghost.style.transform = `translate3d(${pointer.x - rect.left}px, ${pointer.y - rect.top}px, 0)`
      raf = 0
    }

    const coordsFromEvent = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect()
      const coords = viewer.dataHelper.viewerCoordsToSphericalCoords({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
      return { yaw: round(radToDeg(coords.yaw), 0), pitch: round(radToDeg(coords.pitch), 0) }
    }

    const onDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      const dot = target?.closest<HTMLElement>("[data-hs-id]")
      if (!dot) return
      draggingId = dot.dataset.hsId ?? null
      if (!draggingId) return
      ghost = document.createElement("div")
      ghost.className = "hs-drag-ghost"
      container.appendChild(ghost)
      pointer = { x: event.clientX, y: event.clientY }
      raf = requestAnimationFrame(drawGhost)
      event.stopPropagation()
      event.preventDefault()
    }

    // Gerakkan marker LANGSUNG di viewer (tanpa menunggu React), baru simpan saat lepas.
    const onMove = (event: PointerEvent) => {
      if (!draggingId) return
      pointer = { x: event.clientX, y: event.clientY }
      if (!raf) raf = requestAnimationFrame(drawGhost)
      try {
        const next = coordsFromEvent(event)
        latest = next
        const scene = findScene(live.current.scenes, live.current.currentSceneId)
        const spot = scene.hotspots.find((h) => h.id === draggingId)
        if (spot) {
          markersRef.current?.updateMarker(markerConfig({ ...spot, ...next }))
        }
      } catch {
        /* abaikan koordinat di luar sphere */
      }
    }

    const onUp = () => {
      if (draggingId && latest) {
        live.current.options.onMoveHotspot?.(
          live.current.currentSceneId,
          draggingId,
          latest.yaw,
          latest.pitch,
        )
      }
      draggingId = null
      latest = null
      pointer = null
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      ghost?.remove()
      ghost = null
    }

    container.addEventListener("pointerdown", onDown, { capture: true })
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)

    return () => {
      container.removeEventListener("pointerdown", onDown, { capture: true })
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      if (raf) cancelAnimationFrame(raf)
      ghost?.remove()
    }
  }, [isReady])

  /*Sinkronkan ulang node saat scene berubah (upload, hotspot edit, ganti media).*/
  useEffect(() => {
    if (!isReady) return
    tourRef.current?.setNodes(buildNodes(scenes), currentSceneId)
    // Pastikan marker aktif ikut ter-render setelah node di-refresh.
    const scene = findScene(scenes, currentSceneId)
    markersRef.current?.setMarkers(contentHotspots(scene).map(markerConfig))
    // currentSceneId sengaja tidak diikutsertakan agar tidak loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, isReady])

  /* Marker mengikuti scene aktif (termasuk saat pindah scene). */
  useEffect(() => {
    if (!isReady) return
    const scene = findScene(scenes, currentSceneId)
    markersRef.current?.setMarkers(contentHotspots(scene).map(markerConfig))
  }, [currentSceneId, isReady, scenes])

  /*Efek warna & leveling diterapkan ke kanvas viewer secara langsung.*/
  useEffect(() => {
    if (!isReady || !containerRef.current || !viewerRef.current) return
    const canvas = containerRef.current.querySelector<HTMLElement>(".psv-canvas-container")
    if (canvas) canvas.style.filter = effectsToCss(options.effects)
    try {
      viewerRef.current.setOption("sphereCorrection", { roll: options.effects.roll })
    } catch {
      /* abaikan jika opsi belum didukung */
    }
  }, [isReady, currentSceneId, options.effects])

  /*Scene yang dipilih dari view lain (dashboard/portfolio) ikut ke viewer.*/
  useEffect(() => {
    if (!options.activeSceneId || options.activeSceneId === currentSceneId) return
    if (!scenes.some((s) => s.id === options.activeSceneId)) return
    setCurrentSceneId(options.activeSceneId)
    if (isReady) tourRef.current?.setCurrentNode(options.activeSceneId).catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.activeSceneId])

  /*Detail hotspot ikut berubah saat judul/deskripsi diedit atau dihapus.*/
  useEffect(() => {
    if (!selectedHotspot) return
    const latest = currentScene.hotspots.find((h) => h.id === selectedHotspot.id)
    if (!latest) {
      setSelectedHotspot(null)
    } else if (JSON.stringify(latest) !== JSON.stringify(selectedHotspot)) {
      setSelectedHotspot(latest)
    }
  }, [currentScene.hotspots, selectedHotspot])

  const placementRef = useRef<HotspotType | null>(null)
  placementRef.current = placementType
  const placementIconRef = useRef<HotspotIcon | null>(null)

  const placeHotspot = useCallback(
    (yaw: number, pitch: number, type: HotspotType) => {
      const { currentSceneId: sceneId } = live.current
      const titles: Record<HotspotType, string> = {
        info: "Info baru",
        project: "Area proyek",
        link: "Tautan baru",
        scene: "Navigasi baru",
      }
      const spot: Hotspot = {
        id: `hs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        yaw: round(yaw, 0),
        pitch: round(pitch, 0),
        title: titles[type],
        description: "Hotspot baru. Ubah judul dan deskripsi di panel Hotspot.",
        style: {
          ...defaultHotspotStyle,
          icon: placementIconRef.current ?? defaultHotspotStyle.icon,
        },
      }
      live.current.options.onAddHotspot(sceneId, spot)
      setSelectedHotspot(spot)
      return spot
    },
    [],
  )

  const goToScene = useCallback((id: string) => {
    if (id === live.current.currentSceneId) return
    setCurrentSceneId(id)
    live.current.options.onSceneChange(id)
    tourRef.current?.setCurrentNode(id).catch(() => live.current.options.onNotify?.("Scene tidak ditemukan."))
  }, [])

  const resetView = useCallback(() => {
    const scene = findScene(live.current.scenes, live.current.currentSceneId)
    viewerRef.current?.rotate({ yaw: scene.initialView.yaw, pitch: scene.initialView.pitch })
    viewerRef.current?.zoom(scene.initialView.zoom)
  }, [])

  const rotateTo = useCallback((yaw: number) => {
    const viewer = viewerRef.current
    if (!viewer) return
    const pitch = radToDeg(viewer.getPosition().pitch)
    viewer.rotate({ yaw, pitch })
  }, [])

  const zoomBy = useCallback((delta: number) => {
    const viewer = viewerRef.current
    if (!viewer) return
    const next = clamp(view.zoom + delta, 20, 100)
    viewer.zoom(next)
    setView((v) => ({ ...v, zoom: next }))
  }, [view.zoom])

  const toggleAutorotate = useCallback(() => {
    const plugin = autorotateRef.current
    if (!plugin) return
    if (plugin.isEnabled()) {
      plugin.stop()
      setIsAutorotate(false)
    } else {
      plugin.start()
      setIsAutorotate(true)
    }
  }, [])

  const setQuality = useCallback((next: Quality) => {
    const preset = QUALITY[next]
    viewerRef.current?.setOption("minFov", preset.minFov)
    viewerRef.current?.zoom(preset.zoom)
    setQualityState(next)
  }, [])

  const setCompassVisible = useCallback((visible: boolean) => {
    if (visible) compassRef.current?.show()
    else compassRef.current?.hide()
    setCompass(visible)
  }, [])

  const setGyroscopeEnabled = useCallback((enabled: boolean) => {
    if (!enabled) {
      gyroRef.current?.stop()
      setGyroscope(false)
      return
    }
    gyroRef.current
      ?.start()
      .then(() => setGyroscope(true))
      .catch(() => {
        setGyroscope(false)
        live.current.options.onNotify?.("Gyroskop tidak tersedia di perangkat/browser ini.")
      })
  }, [])

  const addHotspot = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer) return
    const pos = viewer.getPosition()
    placeHotspot(radToDeg(pos.yaw), radToDeg(pos.pitch), "info")
  }, [placeHotspot])

  const startPlacement = useCallback((type: HotspotType, icon?: HotspotIcon) => {
    placementRef.current = type
    placementIconRef.current = icon ?? null
    setPlacementType(type)
  }, [])

  const stopPlacement = useCallback(() => {
    placementRef.current = null
    placementIconRef.current = null
    setPlacementType(null)
  }, [])

  const selectHotspotById = useCallback((id: string) => {
    const spot = findScene(live.current.scenes, live.current.currentSceneId).hotspots.find((h) => h.id === id)
    if (!spot) return
    setSelectedHotspot(spot)
    viewerRef.current?.animate({ yaw: spot.yaw, pitch: spot.pitch, speed: 600 })
  }, [])

  const clearSelectedHotspot = useCallback(() => setSelectedHotspot(null), [])

  const currentThumbnailUrl = useCallback(
    () => findScene(live.current.scenes, live.current.currentSceneId).panorama,
    [],
  )

  return {
    containerRef,
    isReady,
    currentScene,
    currentSceneId,
    goToScene,
    selectedHotspot,
    clearSelectedHotspot,
    selectHotspotById,
    view,
    isAutorotate,
    toggleAutorotate,
    resetView,
    rotateTo,
    zoomBy,
    addHotspot,
    placementType,
    startPlacement,
    stopPlacement,
    quality,
    setQuality,
    qualityLabel: QUALITY[quality].label,
    compass,
    setCompassVisible,
    gyroscope,
    setGyroscopeEnabled,
    currentThumbnailUrl,
  }
}
