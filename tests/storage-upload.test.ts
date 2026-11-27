import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
}))

vi.mock("../src/lib/supabase", () => ({
  isServerMode: true,
  supabase: null,
  SHARED_STATE_ID: "virtour360-shared",
}))

vi.mock("../src/lib/authToken", () => ({
  getAuthToken: () => "qa-token",
}))

import { removeStorageFile, uploadAssetFile } from "../src/lib/remoteStore"

describe("server mode asset storage without browser Supabase client", () => {
  beforeEach(() => {
    mocks.fetch.mockReset()
    vi.stubGlobal("fetch", mocks.fetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("uploads through /api/storage signed URL even when supabase client is null", async () => {
    mocks.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          path: "user/audio/a.wav",
          token: "t",
          signedUrl: "https://storage.test/sign?token=t",
          publicUrl: "https://storage.test/public/panoramas/user/audio/a.wav",
        }),
      })
      .mockResolvedValueOnce({ ok: true })

    const url = await uploadAssetFile("a", new Blob(["audio"], { type: "audio/wav" }), "audio")

    expect(url).toBe("https://storage.test/public/panoramas/user/audio/a.wav")
    expect(mocks.fetch).toHaveBeenCalledTimes(2)
    expect(mocks.fetch.mock.calls[0][0]).toBe("/api/storage")
    expect(mocks.fetch.mock.calls[0][1]?.body).toContain('"kind":"audio"')
    expect(mocks.fetch.mock.calls[1][0]).toBe("https://storage.test/sign?token=t")
    expect(mocks.fetch.mock.calls[1][1]?.method).toBe("PUT")
  })

  it("deletes through /api/storage without supabase client", async () => {
    mocks.fetch.mockResolvedValueOnce({ ok: true })

    await removeStorageFile("https://storage.test/public/panoramas/user/image/b.png")

    expect(mocks.fetch).toHaveBeenCalledTimes(1)
    expect(mocks.fetch.mock.calls[0][0]).toBe("/api/storage")
    expect(mocks.fetch.mock.calls[0][1]?.method).toBe("DELETE")
    expect(mocks.fetch.mock.calls[0][1]?.body).toContain("image/b.png")
  })
})
