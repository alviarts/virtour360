import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  gateCookieName,
  hashPassword,
  readCookie,
  signGate,
  signSession,
  verifyGate,
  verifyPassword,
  verifySession,
} from "../api/_auth.js"

const originalKey = process.env.SUPABASE_SECRET_KEY

beforeEach(() => {
  process.env.SUPABASE_SECRET_KEY = "sb_secret_test_only"
})

afterEach(() => {
  if (originalKey === undefined) delete process.env.SUPABASE_SECRET_KEY
  else process.env.SUPABASE_SECRET_KEY = originalKey
})

describe("api/_auth — password gate", () => {
  it("hash scrypt unik per salt dan terverifikasi", () => {
    const first = hashPassword("rahasia123")
    const second = hashPassword("rahasia123")
    expect(first).not.toBe(second)
    expect(first).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/)
    expect(verifyPassword("rahasia123", first)).toBe(true)
    expect(verifyPassword("salah", first)).toBe(false)
    expect(verifyPassword("rahasia123", "bukan-hash")).toBe(false)
  })

  it("token gate hanya berlaku untuk UID yang sama", () => {
    const token = signGate("tour-saya")
    expect(verifyGate(token, "tour-saya")).toBe(true)
    expect(verifyGate(token, "tour-lain")).toBe(false)
    expect(verifyGate(`${token}x`, "tour-saya")).toBe(false)
    expect(verifyGate("payload.tanda-tangan", "tour-saya")).toBe(false)
  })

  it("nama cookie gate unik per tour", () => {
    expect(gateCookieName("tour-saya")).toBe("virtour360_gate_tour-saya")
    expect(gateCookieName("<script>")).toBe("virtour360_gate_script")
  })

  it("cookie session memakai HMAC dengan kunci server", () => {
    const token = signSession({ name: "A", email: "a@b.c", initials: "A", uid: "abc" })
    expect(verifySession(token)).toMatchObject({ email: "a@b.c", uid: "abc" })
    delete process.env.SUPABASE_SECRET_KEY
    expect(verifySession(token)).toBeNull()
  })

  it("membaca cookie httpOnly dengan aman", () => {
    const req = { headers: { cookie: `foo=1; ${gateCookieName("tour-saya")}=abc%2Fdef; bar=2` } }
    expect(readCookie(req, gateCookieName("tour-saya"))).toBe("abc/def")
    expect(readCookie(req, "tidak-ada")).toBe("")
  })
})
