import type { Viewer } from "@photo-sphere-viewer/core"
import type { PolygonDesign } from "../types/studio"
import type { Hotspot } from "../types/tour"
import { panoColor } from "./color"

const NS = "http://www.w3.org/2000/svg"
const rad = (value: number) => (value * Math.PI) / 180

export interface PolygonLayerHandle {
  setHotspots: (spots: Hotspot[]) => void
  destroy: () => void
}

/**
 * Overlay SVG untuk hotspot polygon/line. Proyeksi dihitung ulang tiap render PSV
 * supaya area ikut bergerak saat panorama diputar.
 */
export function createPolygonLayer(
  container: HTMLElement,
  viewer: Viewer,
  hotspots: Hotspot[],
  design: PolygonDesign,
  onActivate: (spot: Hotspot) => void,
): PolygonLayerHandle {
  let spots = hotspots

  const svg = document.createElementNS(NS, "svg")
  svg.setAttribute("class", "psv-polygon-layer")
  svg.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;overflow:visible"
  container.appendChild(svg)

  const shapes = new Map<string, SVGPolygonElement | SVGPolylineElement>()

  const onClick = (event: MouseEvent) => {
    const element = (event.target as Element | null)?.closest("[data-poly-id]")
    const id = element?.getAttribute("data-poly-id")
    if (!id) return
    event.stopPropagation()
    const spot = spots.find((item) => item.id === id)
    if (spot) onActivate(spot)
  }
  svg.addEventListener("click", onClick)

  const rebuild = (next: Hotspot[]) => {
    svg.replaceChildren()
    shapes.clear()
    for (const spot of next) {
      const points = spot.polygon?.points
      if (!points || points.length < 2) continue
      const isLine = spot.polygon!.kind === "line"
      const element = document.createElementNS(NS, isLine ? "polyline" : "polygon")
      element.setAttribute("data-poly-id", spot.id)
      element.setAttribute("points", "")
      element.setAttribute(
        "style",
        [
          `fill:${isLine ? "none" : panoColor(design.background, "rgba(255,255,255,.13)")}`,
          `stroke:${panoColor(design.border, "#ffffff")}`,
          `stroke-width:${Math.max(1, design.borderWidth || 1)}`,
          "vector-effect:non-scaling-stroke",
          `pointer-events:${isLine ? "stroke" : "all"}`,
          "cursor:pointer",
        ].join(";"),
      )
      svg.appendChild(element)
      shapes.set(spot.id, element)
    }
    update()
  }

  function update() {
    if (!shapes.size) return
    // Saat viewer belum punya ukuran/posisi, proyeksi bisa NaN — jangan tulis
    // ke atribut SVG karena akan memicu error DOM di console.
    if (!container.clientWidth || !container.clientHeight) return
    let view: { yaw: number; pitch: number }
    try {
      view = viewer.getPosition()
    } catch {
      return
    }
    if (!Number.isFinite(view.yaw) || !Number.isFinite(view.pitch)) return
    for (const spot of spots) {
      const element = shapes.get(spot.id)
      const points = spot.polygon?.points
      if (!element || !points || points.length < 2) continue
      const projected = points.map((point) => {
        const visible = Math.cos(rad(point.pitch)) * Math.cos(rad(point.yaw) - view.yaw) > 0
        let x = NaN
        let y = NaN
        try {
          const coords = viewer.dataHelper.sphericalCoordsToViewerCoords({
            yaw: rad(point.yaw),
            pitch: rad(point.pitch),
          })
          x = Math.round(coords.x)
          y = Math.round(coords.y)
        } catch {
          /* viewer belum siap */
        }
        return { x, y, visible: visible && Number.isFinite(x) && Number.isFinite(y) }
      })
      if (projected.some((point) => !point.visible)) {
        element.style.display = "none"
        continue
      }
      element.style.display = ""
      element.setAttribute("points", projected.map((point) => `${point.x},${point.y}`).join(" "))
    }
  }

  viewer.addEventListener("render", update)
  viewer.addEventListener("size-updated", update)
  rebuild(spots)

  return {
    setHotspots(next) {
      spots = next
      rebuild(next)
    },
    destroy() {
      viewer.removeEventListener("render", update)
      viewer.removeEventListener("size-updated", update)
      svg.removeEventListener("click", onClick)
      svg.remove()
      shapes.clear()
    },
  }
}
