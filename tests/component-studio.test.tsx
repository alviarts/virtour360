// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mocks = vi.hoisted(() => ({
  updateStudioConfig: vi.fn(),
  resetStudioConfig: vi.fn(),
  notify: vi.fn(),
  publishPublicPayload: vi.fn(),
  loadPublicPayload: vi.fn(),
  unlockPublicPayload: vi.fn(),
  ensurePublicScenes: vi.fn(),
}))

vi.mock("../src/context/useApp", async () => {
  const { defaultStudioConfig } = await import("../src/types/studio")
  return {
  useApp: () => ({
    studioConfig: defaultStudioConfig,
    updateStudioConfig: mocks.updateStudioConfig,
    resetStudioConfig: mocks.resetStudioConfig,
    notify: mocks.notify,
    ensurePublicScenes: mocks.ensurePublicScenes,
    user: null,
    scenes: [],
    favorites: [],
    toggleFavorite: vi.fn(),
    setAuthOpen: vi.fn(),
  }),
  }
})

vi.mock("../src/lib/publicStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/publicStore")>()
  return {
    ...actual,
    publishPublicPayload: mocks.publishPublicPayload,
    loadPublicPayload: mocks.loadPublicPayload,
    unlockPublicPayload: mocks.unlockPublicPayload,
  }
})

import { DesignModal } from "../src/components/studio/DesignModal"
import { PublishModal } from "../src/components/auth/PublishModal"
import { PublicPortfolioView } from "../src/views/PublicPortfolioView"
import { normalizeStudioConfig } from "../src/types/studio"

afterEach(cleanup)

describe("component — DesignModal", () => {
  beforeEach(() => vi.clearAllMocks())

  it("menampilkan 4 grup & 10 sub-panel Design", () => {
    render(<DesignModal onClose={() => {}} />)
    for (const label of ["Design", "Content", "Marketing", "Setting"]) {
      expect(screen.getAllByRole("button", { name: label }).length).toBeGreaterThan(0)
    }
    for (const label of ["Theme", "Hotspot", "Polygon", "Popup", "Floorplan", "Googlemap", "Form", "Call To Action", "Control Bar", "Dollhouse"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy()
    }
  })

  it("pilih preset tema memanggil updateStudioConfig", async () => {
    render(<DesignModal onClose={() => {}} />)
    const preset = screen.getByRole("button", { name: /Default 2.0/ })
    await userEvent.click(preset)
    expect(mocks.updateStudioConfig).toHaveBeenCalled()
  })

  it("berpindah ke CMS, Marketing, Setting", async () => {
    render(<DesignModal onClose={() => {}} />)
    await userEvent.click(screen.getByRole("button", { name: "Content" }))
    expect(screen.getByText(/Posts — 1 item/)).toBeTruthy()
    await userEvent.click(screen.getByRole("button", { name: "Marketing" }))
    expect(screen.getByText("SEO Title")).toBeTruthy()
    await userEvent.click(screen.getByRole("button", { name: "Setting" }))
    expect(screen.getByText("Multi-Language")).toBeTruthy()
  })
})

describe("component — PublishModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.publishPublicPayload.mockResolvedValue({ ok: true, uid: "tour-test" })
    mocks.ensurePublicScenes.mockImplementation(async (scenes: unknown[]) => ({ scenes }))
  })

  it("menampilkan slug, 3 opsi akses, dan publish ulang memakai UID existing", async () => {
    render(<PublishModal onClose={() => {}} scenes={[]} existingUid="tour-uji" />)
    const slug = screen.getByPlaceholderText("contoh: the-gallery") as HTMLInputElement
    expect(slug.value).toBe("tour-uji")
    expect(screen.getByRole("button", { name: /Draft/ })).toBeTruthy()
    expect(screen.getByRole("button", { name: /Public/ })).toBeTruthy()
    expect(screen.getByRole("button", { name: /Password/ })).toBeTruthy()
    await userEvent.click(screen.getByRole("button", { name: "Publish ulang" }))
    expect(mocks.publishPublicPayload).toHaveBeenCalled()
    const payload = mocks.publishPublicPayload.mock.calls[0][0] as { access: string; slug: string }
    expect(payload.access).toBe("public")
    expect(payload.slug).toBe("tour-uji")
  })
})

describe("component — PublicPortfolioView gate akses", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.hash = "#/p/tour-private"
    mocks.loadPublicPayload.mockResolvedValue({
      profile: { name: "T", initials: "T", location: "", email: "", website: "", bio: "" },
      scenes: [], folders: [], access: "password", passwordHash: "abc123", updatedAt: "2026-01-01",
    })
  })

  it("tour berpassword menampilkan gate, bukan konten", async () => {
    render(<PublicPortfolioView />)
    await waitFor(() => expect(screen.getByText(/Tour dilindungi password/)).toBeTruthy())
    expect(screen.getByRole("button", { name: "Buka tour" })).toBeTruthy()
  })

  it("password gate diverifikasi server, bukan hash di browser", async () => {
    mocks.unlockPublicPayload.mockResolvedValue(true)
    render(<PublicPortfolioView />)
    await waitFor(() => expect(screen.getByText(/Tour dilindungi password/)).toBeTruthy())
    await userEvent.type(screen.getByPlaceholderText("Password tour"), "rahasia")
    await userEvent.click(screen.getByRole("button", { name: "Buka tour" }))
    await waitFor(() => expect(mocks.unlockPublicPayload).toHaveBeenCalledWith("tour-private", "rahasia"))
  })

  it("draft menampilkan pesan draft", async () => {
    mocks.loadPublicPayload.mockResolvedValue({
      profile: { name: "T", initials: "T", location: "", email: "", website: "", bio: "" },
      scenes: [], folders: [], access: "draft", updatedAt: "2026-01-01",
    })
    render(<PublicPortfolioView />)
    await waitFor(() => expect(screen.getByText(/Tour masih dalam draft/)).toBeTruthy())
  })
})

describe("component — normalisasi config (equivalence helper)", () => {
  it("config kosong dan config partial sama-sama valid", () => {
    const empty = normalizeStudioConfig(null)
    const partial = normalizeStudioConfig({ theme: { primaryColor: "#000000" } as never })
    expect(empty.hotspot.label.fontSize).toBe(partial.hotspot.label.fontSize)
    expect(partial.theme.primaryColor).toBe("#000000")
  })
})
