import { describe, expect, it } from "vitest"
import { normalizeSlug } from "../src/lib/publicStore"
import { normalizeStudioConfig } from "../src/types/studio"
import { defaultHotspotStyle, hotspotKinds, hotspotKindLabels, type Hotspot } from "../src/types/tour"
import { sceneLinks } from "../src/lib/sceneGraph"

/**
 * Equivalence testing: mengelompokkan input yang secara semantik setara,
 * lalu memastikan sistem memperlakukannya identik.
 */

describe("equivalence — slug publish", () => {
  const representative = "my-tour"

  it.each([
    "My Tour",
    "my tour",
    "  MY  TOUR  ",
    "My---Tour!",
    "my_tour",
  ])("input %q ekuivalen dengan slug kanonik", (input) => {
    expect(normalizeSlug(input)).toBe(representative)
  })

  it("input berbeda tetap menghasilkan slug berbeda", () => {
    expect(normalizeSlug("Villa A")).not.toBe(normalizeSlug("Villa B"))
  })

  it("input kosong tidak menghasilkan slug", () => {
    expect(normalizeSlug("   ")).toBe("")
    expect(normalizeSlug("!!!")).toBe("")
  })
})

describe("equivalence — koordinat derajat → PSV", () => {
  const toPsv = (value: number) => `${value}deg`
  const fromPsv = (value: string) => Number(value.replace(/deg$/, ""))

  it.each([0, 45, -90, 180, 359])("yaw %i ekuivalen setelah konversi", (yaw) => {
    expect(fromPsv(toPsv(yaw))).toBe(yaw)
  })

  it("sceneLinks memakai representasi yang sama untuk semua scene", () => {
    const base: Hotspot = {
      id: "h", type: "scene", targetSceneId: "next", yaw: 0, pitch: 0,
      title: "N", style: defaultHotspotStyle,
    }
    const links = sceneLinks({
      id: "s", name: "S", description: "", group: "", panorama: "", thumbnail: "",
      initialView: { yaw: 0, pitch: 0, zoom: 70 },
      hotspots: [
        { ...base, id: "a", yaw: 12, pitch: 3 },
        { ...base, id: "b", yaw: -45, pitch: -8 },
      ],
      project: { title: "P", role: "", client: "", year: "2026", tags: [] },
    })
    for (const link of links) {
      expect(link.position.yaw).toMatch(/^-?\d+deg$/)
      expect(link.position.pitch).toMatch(/^-?\d+deg$/)
      expect(fromPsv(link.position.pitch)).toBeGreaterThanOrEqual(-90)
      expect(fromPsv(link.position.pitch)).toBeLessThanOrEqual(90)
    }
  })
})

describe("equivalence — konfigurasi studio", () => {
  it("config null/{} /partial ekuivalen di field yang tidak disentuh", () => {
    const a = normalizeStudioConfig(null)
    const b = normalizeStudioConfig({})
    const c = normalizeStudioConfig({ theme: { primaryColor: "#ff0000" } as never })
    expect(a).toEqual(b)
    expect(c.hotspot).toEqual(a.hotspot)
    expect(c.cms).toEqual(a.cms)
    expect(c.setting.multiLanguage).toBe(a.setting.multiLanguage)
  })

  it("semua 9 kind termasuk kelas yang sama tidak saling tertukar", () => {
    const media = ["image", "video", "sound"]
    const text = ["point", "article", "compact"]
    const action = ["link", "product", "chevron"]
    const groups = [media, text, action]
    expect(new Set(hotspotKinds)).toEqual(new Set([...media, ...text, ...action]))
    for (const group of groups) {
      for (const kind of group) {
        expect(hotspotKindLabels[kind as keyof typeof hotspotKindLabels]).toBeTruthy()
      }
    }
    expect(new Set(groups.flat()).size).toBe(9)
  })
})
