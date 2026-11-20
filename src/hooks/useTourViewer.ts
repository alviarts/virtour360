import { useCallback, useEffect, useRef, useState } from "react"
import { Viewer } from "@photo-sphere-viewer/core"
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin"
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin"
import { AutorotatePlugin } from "@photo-sphere-viewer/autorotate-plugin"
import { CompassPlugin } from "@photo-sphere-viewer/compass-plugin"
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin"
import { SettingsPlugin } from "@photo-sphere-viewer/settings-plugin"
import { scenes, defaultSceneId } from "../data/scenes"
import { tourConfig } from "../config/tour.config"
import { contentHotspots, findScene, sceneLinks } from "../lib/sceneGraph"
import { clamp, round } from "../lib/format"
import type { Hotspot, Scene } from "../types/tour"

const ICONS: Record<string, string> = {
  info: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  project: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  link: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>',
}

function markerConfig(spot: Hotspot) {
  return {
    id: spot.id,
    position: { yaw: spot.yaw, pitch: spot.pitch },
    size: { width: 34, height: 34 },
    anchor: "center center",
    html: `<div class="hotspot hotspot--${spot.type}">${ICONS[spot.type] ?? ICONS.info}</div>`,
    tooltip: { content: spot.title, position: "top" as const },
    data: { hotspotId: spot.id },
  }
}

function buildNodes() {
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

export function useTourViewer() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Viewer | null>(null)
  const tourRef = useRef<VirtualTourPlugin | null>(null)
  const markersRef = useRef<MarkersPlugin | null>(null)
  const autorotateRef = useRef<AutorotatePlugin | null>(null)

  const [isReady, setIsReady] = useState(false)
  const [currentSceneId, setCurrentSceneId] = useState(defaultSceneId)
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [view, setView] = useState<ViewState>({ yaw: 0, pitch: 0, zoom: tourConfig.defaultZoom })
  const [isAutorotate, setIsAutorotate] = useState(false)

  const currentScene: Scene = findScene(scenes, currentSceneId)

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
          nodes: buildNodes(),
          startNodeId: defaultSceneId,
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
      caption: scenes[0].name,
    })

    const markers = viewer.getPlugin<MarkersPlugin>(MarkersPlugin)
    const tour = viewer.getPlugin<VirtualTourPlugin>(VirtualTourPlugin)
    const autorotate = viewer.getPlugin<AutorotatePlugin>(AutorotatePlugin)

    viewerRef.current = viewer
    tourRef.current = tour
    markersRef.current = markers
    autorotateRef.current = autorotate

    const onReady = () => {
      setIsReady(true)
      const start = scenes[0].initialView
      viewer.rotate({ yaw: start.yaw, pitch: start.pitch })
    }
    const onNodeChanged = (e: any) => {
      setCurrentSceneId(e.node.id)
      setSelectedHotspot(null)
    }
    const onSelectMarker = (e: any) => {
      const id = e.marker.data?.hotspotId ?? e.marker.id
      const scene = findScene(scenes, currentSceneId)
      const spot = scene.hotspots.find((h) => h.id === id) ?? null
      if (spot?.type === "scene" && spot.targetSceneId) {
        tour.setCurrentNode(spot.targetSceneId).catch(() => undefined)
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
        yaw: round(e.position.yaw, 0),
        pitch: round(e.position.pitch, 0),
        zoom: round(viewer.getZoomLevel(), 0),
      })
    }

    viewer.addEventListener("ready", onReady)
    tour.addEventListener("node-changed", onNodeChanged)
    markers.addEventListener("select-marker", onSelectMarker)
    viewer.addEventListener("position-updated", onPosition)

    return () => {
      viewer.removeEventListener("ready", onReady)
      tour.removeEventListener("node-changed", onNodeChanged)
      markers.removeEventListener("select-marker", onSelectMarker)
      viewer.removeEventListener("position-updated", onPosition)
      viewer.destroy()
      viewerRef.current = null
      tourRef.current = null
      markersRef.current = null
      autorotateRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goToScene = useCallback((id: string) => {
    if (id === currentSceneId) return
    tourRef.current?.setCurrentNode(id).catch(() => undefined)
  }, [currentSceneId])

  const resetView = useCallback(() => {
    const scene = findScene(scenes, currentSceneId)
    viewerRef.current?.rotate({ yaw: scene.initialView.yaw, pitch: scene.initialView.pitch })
    viewerRef.current?.zoom(scene.initialView.zoom)
  }, [currentSceneId])

  const rotateTo = useCallback((yaw: number) => {
    const viewer = viewerRef.current
    if (!viewer) return
    const pitch = viewer.getPosition().pitch
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

  const addHotspot = useCallback(() => {
    const viewer = viewerRef.current
    const tour = tourRef.current
    const markers = markersRef.current
    if (!viewer || !tour || !markers) return
    const pos = viewer.getPosition()
    const id = `hs-${Date.now()}`
    const spot: Hotspot = {
      id,
      type: "info",
      yaw: round(pos.yaw, 0),
      pitch: round(pos.pitch, 0),
      title: "Hotspot baru",
      description: "Klik hotspot ini untuk melihat detail karya.",
    }
    tour.updateNode({
      id: currentSceneId,
      markers: [...contentHotspots(currentScene), spot].map(markerConfig),
    })
    setSelectedHotspot(spot)
  }, [currentScene, currentSceneId])

  return {
    containerRef,
    isReady,
    currentScene,
    currentSceneId,
    goToScene,
    selectedHotspot,
    clearSelectedHotspot: () => setSelectedHotspot(null),
    view,
    isAutorotate,
    toggleAutorotate,
    resetView,
    rotateTo,
    zoomBy,
    addHotspot,
  }
}
