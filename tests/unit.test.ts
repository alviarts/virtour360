import { describe, expect, it } from "vitest"
import { clamp, formatAngle, round } from "../src/lib/format"
import { defaultEffects, effectPresets, effectsToCss, normalizeEffects } from "../src/lib/effects"
import {
  contentHotspots,
  findScene,
  isNodeLink,
  navigationTarget,
  sceneLinks,
} from "../src/lib/sceneGraph"
import { defaultStudioConfig, normalizeStudioConfig } from "../src/types/studio"
import { defaultHotspotStyle, hotspotKindLabels, hotspotKinds, type Hotspot, type Scene } from "../src/types/tour"
import { hashPassword, makePublicUid } from "../src/lib/publicStore"

const makeSpot = (over: Partial<Hotspot> = {}): Hotspot => ({
  id: "h1", type: "info", yaw: 45, pitch: -10, title: "Spot", style: defaultHotspotStyle, ...over,
})

const makeScene = (hotspots: Hotspot[] = [], id = "s1"): Scene => ({
  id, name: "Scene", description: "", group: "Uncategory", panorama: "/p.jpg", thumbnail: "/t.jpg",
  initialView: { yaw: 0, pitch: 0, zoom: 70 }, hotspots,
  project: { title: "P", role: "", client: "", year: "2026", tags: [] },
})

describe("unit — format & effects", () => {
  it("clamp/round/formatAngle", () => {
    expect(clamp(120, 0, 100)).toBe(100)
    expect(clamp(-5, 0, 100)).toBe(0)
    expect(round(1.234, 2)).toBe(1.23)
    expect(formatAngle(89.6)).toBe("90")
  })

  it("normalizeEffects mengisi default dan effectsToCss lengkap", () => {
    expect(normalizeEffects({ brightness: 80 }).brightness).toBe(80)
    expect(normalizeEffects({}).saturate).toBe(defaultEffects.saturate)
    const css = effectsToCss(normalizeEffects({ hue: -20 }))
    expect(css).toContain("brightness(100%)")
    expect(css).toContain("hue-rotate(-20deg)")
    expect(css.split(" ").length).toBe(6)
    expect(effectPresets.mono.grayscale).toBe(100)
  })
})

describe("unit — sceneGraph", () => {
  it("navigationTarget & isNodeLink hanya untuk scene + target", () => {
    const nav = makeSpot({ type: "scene", targetSceneId: "s2" })
    const info = makeSpot({ type: "info", targetSceneId: "s2" })
    expect(navigationTarget(nav)).toBe("s2")
    expect(isNodeLink(nav)).toBe(true)
    expect(isNodeLink(info)).toBe(false)
  })

  it("sceneLinks mengirim derajat sebagai string 'Ndeg' (bukan radian)", () => {
    const a = makeSpot({ id: "a", type: "scene", targetSceneId: "s2", yaw: 120, pitch: -15 })
    const b = makeSpot({ id: "b", type: "scene", targetSceneId: "s3", yaw: -40, pitch: 8 })
    expect(sceneLinks(makeScene([a, b]))).toEqual([
      { nodeId: "s2", position: { yaw: "120deg", pitch: "-15deg" } },
      { nodeId: "s3", position: { yaw: "-40deg", pitch: "8deg" } },
    ])
  })

  it("contentHotspots memisahkan panah navigasi dari marker konten", () => {
    const nav = makeSpot({ id: "nav", type: "scene", targetSceneId: "s2" })
    const product = makeSpot({ id: "prod", kind: "product", targetSceneId: "s2" })
    const spots = contentHotspots(makeScene([nav, product]))
    expect(spots.map((s) => s.id)).toEqual(["prod"])
  })

  it("findScene fallback ke scene pertama", () => {
    const scenes = [makeScene([], "first"), makeScene([], "second")]
    expect(findScene(scenes, "missing").id).toBe("first")
  })
})

describe("unit — studio config & publicStore", () => {
  it("normalizeStudioConfig menggabungkan partial dengan default", () => {
    const merged = normalizeStudioConfig({ theme: { primaryColor: "#123456" } as never })
    expect(merged.theme.primaryColor).toBe("#123456")
    expect(merged.theme.preset).toBe(defaultStudioConfig.theme.preset)
    expect(merged.hotspot.icons.Point).toBe(defaultStudioConfig.hotspot.icons.Point)
    expect(merged.hotspot.distort).toEqual(defaultStudioConfig.hotspot.distort)
  })

  it("9 hotspot kind lengkap & punya label", () => {
    expect(hotspotKinds).toHaveLength(9)
    for (const kind of hotspotKinds) expect(hotspotKindLabels[kind]).toBeTruthy()
  })

  it("hashPassword deterministik dan membedakan input", () => {
    expect(hashPassword("rahasia")).toBe(hashPassword("rahasia"))
    expect(hashPassword("rahasia")).not.toBe(hashPassword("salah"))
    expect(hashPassword("")).toBeTruthy()
  })

  it("makePublicUid aman untuk URL", () => {
    const uid = makePublicUid()
    expect(uid).toMatch(/^[a-z0-9]{10}$/)
  })
})
