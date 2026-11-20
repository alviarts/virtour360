import type { Scene, Hotspot } from "../types/tour"

/** Link antar scene diambil dari hotspot bertipe "scene" */
export function sceneLinks(scene: Scene): { nodeId: string; position: { yaw: number; pitch: number } }[] {
  return scene.hotspots
    .filter((h): h is Hotspot & { targetSceneId: string } => h.type === "scene" && !!h.targetSceneId)
    .map((h) => ({ nodeId: h.targetSceneId, position: { yaw: h.yaw, pitch: h.pitch } }))
}

/** Ganti marker scene dengan link navigasi agar tidak dobel */
export function contentHotspots(scene: Scene): Hotspot[] {
  return scene.hotspots.filter((h) => h.type !== "scene")
}

export function findScene(scenes: Scene[], id: string): Scene {
  return scenes.find((s) => s.id === id) ?? scenes[0]
}
