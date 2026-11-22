// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { HotspotPopup } from "../src/components/viewer/HotspotPopup"
import { MiniMap } from "../src/components/viewer/MiniMap"
import { BottomToolbar } from "../src/components/viewer/BottomToolbar"
import { defaultHotspotStyle, type Hotspot, type HotspotKind, type Scene } from "../src/types/tour"

const spot = (kind: HotspotKind, over: Partial<Hotspot> = {}): Hotspot => ({
  id: `h-${kind}`, type: "info", kind, yaw: 10, pitch: 5,
  title: `Judul ${kind}`, description: "Deskripsi komponen", style: defaultHotspotStyle, ...over,
})

const scene: Scene = {
  id: "s1", name: "Scene", description: "", group: "Uncategory",
  panorama: "/media/panoramas/atrium.jpg", thumbnail: "/media/thumbnails/atrium.jpg",
  initialView: { yaw: 0, pitch: 0, zoom: 70 }, hotspots: [spot("point")],
  project: { title: "P", role: "", client: "", year: "2026", tags: [] },
}

afterEach(cleanup)

describe("component — HotspotPopup (9 kinds)", () => {
  it.each([
    ["point", "Deskripsi komponen"],
    ["article", "Deskripsi komponen"],
    ["compact", "Deskripsi komponen"],
    ["chevron", "Navigasi belum diatur"],
  ] as [HotspotKind, string][])("tipe %s merender konten yang sesuai", (kind, text) => {
    render(<HotspotPopup spot={spot(kind)} onClose={() => {}} />)
    expect(screen.getByText(`Judul ${kind}`)).toBeTruthy()
    expect(screen.getByText(new RegExp(text))).toBeTruthy()
  })

  it("image merender <img> dari mediaUrl", () => {
    render(<HotspotPopup spot={spot("image", { mediaUrl: "https://x.test/a.jpg" })} onClose={() => {}} />)
    const img = screen.getByRole("img") as HTMLImageElement
    expect(img.src).toContain("a.jpg")
  })

  it("video merender <video> dengan controls", () => {
    render(<HotspotPopup spot={spot("video", { mediaUrl: "https://x.test/a.mp4" })} onClose={() => {}} />)
    expect(document.querySelector("video")?.getAttribute("controls")).not.toBeNull()
  })

  it("sound merender <audio> dengan controls", () => {
    render(<HotspotPopup spot={spot("sound", { mediaUrl: "https://x.test/a.mp3" })} onClose={() => {}} />)
    expect(document.querySelector("audio")?.getAttribute("controls")).not.toBeNull()
  })

  it("product menampilkan harga dan tombol CTA", () => {
    render(<HotspotPopup spot={spot("product", { price: "Rp 199.000", ctaLabel: "Checkout", ctaHref: "https://shop.test" })} onClose={() => {}} />)
    expect(screen.getByText("Rp 199.000")).toBeTruthy()
    expect(screen.getByRole("link", { name: /Checkout/ }).getAttribute("href")).toBe("https://shop.test")
  })

  it("link menampilkan tombol buka tautan", () => {
    render(<HotspotPopup spot={spot("link", { href: "https://x.test" })} onClose={() => {}} />)
    expect(screen.getByRole("link", { name: /Buka tautan/ }).getAttribute("href")).toBe("https://x.test")
  })

  it("tombol tutup memanggil onClose", async () => {
    const onClose = vi.fn()
    render(<HotspotPopup spot={spot("point")} onClose={onClose} />)
    await userEvent.click(screen.getByRole("button", { name: /Tutup popup/ }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe("component — MiniMap", () => {
  it("memakai panorama 360° (bukan thumbnail) dan menampilkan badge 360°", () => {
    render(<MiniMap scene={scene} view={{ yaw: 0, pitch: 0, zoom: 70 }} hotspotCount={1} onSeek={() => {}} />)
    const img = screen.getByAltText("Pratinjau panorama 360°") as HTMLImageElement
    expect(img.src).toContain("atrium.jpg")
    expect(img.className).toContain("w-[200%]")
    expect(screen.getByText("360°")).toBeTruthy()
  })

  it("klik pada strip mengirim yaw ke onSeek", async () => {
    const onSeek = vi.fn()
    render(<MiniMap scene={scene} view={{ yaw: 0, pitch: 0, zoom: 70 }} hotspotCount={1} onSeek={onSeek} />)
    const area = screen.getByTitle("Klik atau geser untuk mengarahkan pandangan")
    await userEvent.click(area, { clientX: 50 })
    expect(onSeek).toHaveBeenCalled()
  })
})

describe("component — BottomToolbar", () => {
  const props = {
    view: { yaw: 12, pitch: 5, zoom: 70 },
    isAutorotate: false,
    onToggleAutorotate: vi.fn(),
    onAddHotspot: vi.fn(),
    onReset: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onFullscreen: vi.fn(),
    isFullscreen: false,
  }

  beforeEach(() => vi.clearAllMocks())

  it("tombol HUD menampilkan yaw/pitch/zoom dan toggle autorotate", async () => {
    render(<BottomToolbar {...props} />)
    const btn = screen.getByTitle(/Putar otomatis dari posisi saat ini/)
    expect(btn.textContent).toContain("12")
    await userEvent.click(btn)
    expect(props.onToggleAutorotate).toHaveBeenCalledOnce()
  })

  it("picker 9 jenis hotspot tampil", async () => {
    const onPick = vi.fn()
    render(<BottomToolbar {...props} onPickHotspot={onPick} />)
    await userEvent.click(screen.getByRole("button", { name: /Hotspot/ }))
    expect(screen.getByText("Product")).toBeTruthy()
    expect(screen.getByText("Chevron")).toBeTruthy()
  })
})
