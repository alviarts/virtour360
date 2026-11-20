import crypto from "node:crypto"

const SESSION_DAYS = 30

function secret() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "virtour360-dev"
}

/** T token sederhana bertanda tangan — cukup untuk demo 2–5 orang. */
export function signSession(user) {
  const payload = Buffer.from(
    JSON.stringify({ name: user.name, email: user.email, initials: user.initials, exp: Date.now() + SESSION_DAYS * 86400000 }),
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
    return { name: data.name, email: data.email, initials: data.initials }
  } catch {
    return null
  }
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

