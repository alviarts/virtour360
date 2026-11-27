import type { Scene, Hotspot } from "../types/tour"

/**
 * Target navigasi berlaku untuk hotspot tipe apa pun selama `targetSceneId` terisi.
 * Ini satu-satunya sumber kebenaran yang dipakai marker (klik) di Studio maupun viewer publik.
 */
export function navigationTarget(spot: Hotspot): string | undefined {
  return spot.targetSceneId || undefined
}

/**
 * Hotspot yang dirender sebagai panah navigasi native VirtualTourPlugin (BUKAN marker).
 * Hanya tipe "scene" yang jadi panah agar tidak dobel dengan marker bermuatan
 * `targetSceneId` pada posisi yang sama.
 */
export function isNodeLink(spot: Hotspot): boolean {
  return spot.type === "scene" && !!navigationTarget(spot)
}

/** Link antar scene untuk VirtualTourPlugin (panah PSV). */
export function sceneLinks(scene: Scene): { nodeId: string; position: { yaw: string; pitch: string } }[] {
  return scene.hotspots
    .filter(isNodeLink)
    // PSV menerima angka sebagai radian; data kita derajat → kirim sebagai string "Ndeg".
    .map((h) => ({ nodeId: h.targetSceneId!, position: { yaw: `${h.yaw}deg`, pitch: `${h.pitch}deg` } }))
}

/** Marker konten: panah navigasi dan area polygon dirender oleh layer masing-masing. */
export function contentHotspots(scene: Scene): Hotspot[] {
  return scene.hotspots.filter((h) => !isNodeLink(h) && !h.polygon)
}

/** Hotspot area/garis yang dirender sebagai overlay SVG. */
export function polygonHotspots(scene: Scene): Hotspot[] {
  return scene.hotspots.filter((h) => !!h.polygon && !isNodeLink(h))
}

export function findScene(scenes: Scene[], id: string): Scene {
  return scenes.find((s) => s.id === id) ?? scenes[0]
}
