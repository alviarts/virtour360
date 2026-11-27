import crypto from "node:crypto"

const SESSION_DAYS = 30
const GATE_DAYS = 30

function secret() {
  const value = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!value) throw new Error("Missing Supabase server env")
  return value
}

function safeUid(uid) {
  return String(uid || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40)
}

/** Token sesi sederhana bertanda tangan — cukup untuk demo 2–5 orang. */
export function signSession(user) {
  const payload = Buffer.from(
    JSON.stringify({ name: user.name, email: user.email, initials: user.initials, uid: user.uid, exp: Date.now() + SESSION_DAYS * 86400000 }),
  ).toString("base64url")
  const sig = crypto.createHmac("sha256", secret()).update(payload).digest("base64url")
  return `${payload}.${sig}`
}

export function verifySession(token) {
  try {
    const [payload, sig] = String(token).split(".")
    if (!payload || !sig) return null
    const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url")
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    if (!data.email || !data.exp || data.exp < Date.now()) return null
    return { name: data.name, email: data.email, initials: data.initials, uid: data.uid }
  } catch {
    return null
  }
}

/**
 * Token unbuka tour berpassword. Tidak memakai email, jadi pengunjung tanpa
 * akun juga bisa membuka tour yang benar. Disimpan di cookie httpOnly.
 */
export function signGate(uid) {
  const payload = Buffer.from(
    JSON.stringify({ uid: safeUid(uid), purpose: "gate", exp: Date.now() + GATE_DAYS * 86400000 }),
  ).toString("base64url")
  const sig = crypto.createHmac("sha256", secret()).update(`gate.${payload}`).digest("base64url")
  return `${payload}.${sig}`
}

export function verifyGate(token, uid) {
  try {
    const [payload, sig] = String(token).split(".")
    if (!payload || !sig) return false
    const expected = crypto.createHmac("sha256", secret()).update(`gate.${payload}`).digest("base64url")
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    return data.purpose === "gate" && data.uid === safeUid(uid) && Boolean(data.exp) && data.exp >= Date.now()
  } catch {
    return false
  }
}

export function gateCookieName(uid) {
  return `virtour360_gate_${safeUid(uid)}`
}

export function readCookie(req, name) {
  const raw = String(req?.headers?.cookie || "")
  for (const part of raw.split(";")) {
    const at = part.indexOf("=")
    if (at < 0) continue
    if (part.slice(0, at).trim() === name) {
      try { return decodeURIComponent(part.slice(at + 1).trim()) } catch { return part.slice(at + 1).trim() }
    }
  }
  return ""
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password, stored) {
  try {
    const [salt, expected] = String(stored).split(":")
    const actual = crypto.scryptSync(String(password), salt, 64).toString("hex")
    return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  } catch {
    return false
  }
}
