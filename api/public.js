import { createClient } from "@supabase/supabase-js"
import {
  gateCookieName,
  hashPassword,
  readCookie,
  signGate,
  verifyGate,
  verifyPassword,
  verifySession,
} from "./_auth.js"

const PUBLIC_ID = "virtour:public"
const GATE_DAYS = 30

function sanitizeUid(uid) {
  if (!uid || typeof uid !== "string") return ""
  return uid.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 40)
}

/** Id state untuk satu project publish: virtour:pub:<uid> */
function projectId(uid) {
  const safe = sanitizeUid(uid)
  return safe ? `virtour:pub:${safe}` : PUBLIC_ID
}

function gateId(uid) {
  const safe = sanitizeUid(uid)
  return safe ? `virtour:gate:${safe}` : ""
}

/**
 * Payload lama bisa berisi URL blob: yang hanya hidup di browser pemilik.
 * Supaya tour lama tetap bisa dibuka, pakai thumbnail data URL (base64) sebagai
 * panorama sementara. Thumbnail dibuat dengan rasio 2:1 sehingga valid sebagai
 * equirectangular, hanya resolusinya lebih rendah.
 */
function readableScene(scene) {
  if (!scene || typeof scene !== "object" || Array.isArray(scene)) return null
  const next = { ...scene }
  const panorama = next.panorama
  if (typeof panorama === "string" && panorama.startsWith("blob:")) {
    const thumbnail = next.thumbnail
    if (typeof thumbnail === "string" && thumbnail.startsWith("data:image/")) {
      next.panorama = thumbnail
      next.panoramaFallback = true
    } else {
      next.panorama = ""
    }
  }
  // blob: audio hanya hidup di browser pemilik; jangan kirim ke pengunjung.
  if (typeof next.audio === "string" && next.audio.startsWith("blob:")) delete next.audio
  if (typeof next.thumbnail === "string" && next.thumbnail.startsWith("blob:")) delete next.thumbnail
  if (next.panorama !== undefined && typeof next.panorama !== "string") next.panorama = ""
  if (next.thumbnail !== undefined && typeof next.thumbnail !== "string") delete next.thumbnail
  if (next.audio !== undefined && typeof next.audio !== "string") delete next.audio
  if (!Array.isArray(next.hotspots)) next.hotspots = []
  return next
}

function readablePayload(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.scenes)) return payload
  return { ...payload, scenes: payload.scenes.map(readableScene).filter(Boolean) }
}

/** Hash djb2 lama dipakai hanya untuk membuka tour lama, lalu dimigrasikan. */
function legacyHash(value) {
  let hash = 5381
  const text = String(value ?? "")
  for (let i = 0; i < text.length; i++) hash = (hash * 33) ^ text.charCodeAt(i)
  return (hash >>> 0).toString(36)
}

function rowPayload(row) {
  const stored = row?.data
  if (!stored || typeof stored !== "object") return null
  return stored.payload && typeof stored.payload === "object" ? stored.payload : stored
}

async function getPublishPayload(supabase, id) {
  const { data, error } = await supabase.from("virtour_state").select("data").eq("id", id).maybeSingle()
  if (error) throw error
  return rowPayload(data)
}

async function getGateHash(supabase, uid) {
  const id = gateId(uid)
  if (!id) return null
  const { data, error } = await supabase.from("virtour_state").select("data").eq("id", id).maybeSingle()
  if (error) throw error
  const hash = data?.data?.hash
  return typeof hash === "string" && hash.includes(":") ? hash : null
}

async function saveGate(supabase, uid, password) {
  const id = gateId(uid)
  if (!id) throw new Error("UID publish tidak valid")
  const { error } = await supabase.from("virtour_state").upsert({
    id,
    data: { hash: hashPassword(password), updated_at: new Date().toISOString() },
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

async function deleteGate(supabase, uid) {
  const id = gateId(uid)
  if (!id) return
  await supabase.from("virtour_state").delete().eq("id", id)
}

function gateUnlocked(req, uid, payload) {
  if ((payload?.access ?? "public") === "public") return true
  const cookie = readCookie(req, gateCookieName(uid || payload?.uid || "public"))
  return verifyGate(cookie, uid || payload?.uid || "public")
}

/** Jangan pernah mengirim hash password / owner ke pengunjung. */
function visitorPayload(payload, uid, unlocked) {
  const next = readablePayload(payload)
  if (!next || typeof next !== "object") return next
  delete next.passwordHash
  delete next.owner
  next.locked = !unlocked
  if (!unlocked) {
    next.scenes = []
    next.folders = []
  }
  return next
}

function bearer(req) {
  return String(req.headers?.authorization || "").replace(/^Bearer\s+/i, "")
}

/**
 * Endpoint publish — GET dibaca pengunjung tanpa login, POST/DELETE butuh sesi.
 * GET /api/public?id=<uid> → project tertentu (scene disembunyikan bila terkunci)
 * GET /api/public?list=1 → feed project public
 * POST /api/public { uid, payload, password } → simpan project
 * POST /api/public { action: "unlock", uid, password } → cookie unbuka tour
 * DELETE /api/public?id=<uid> → hapus project milik sesi
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return req.method === "GET"
      ? res.status(200).json({ payload: null })
      : res.status(500).json({ error: "Missing Supabase server env" })
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  try {
    if (req.method === "GET") {
      // Feed Customers: hanya project yang benar-benar public.
      if (req.query?.list === "1") {
        const { data, error } = await supabase
          .from("virtour_state")
          .select("id, data")
          .like("id", "virtour:pub:%")
          .order("updated_at", { ascending: false })
          .limit(100)
        if (error) return res.status(500).json({ error: error.message })
        const items = (data ?? [])
          .map((row) => {
            const payload = rowPayload(row)
            if (!payload || (payload.access ?? "public") !== "public") return null
            const readable = readablePayload(payload)
            if (!readable?.scenes?.length) return null
            return { uid: readable.uid || row.id.slice("virtour:pub:".length), payload: readable }
          })
          .filter(Boolean)
        return res.status(200).json({ items })
      }

      const uid = req.query?.id
      const ids = uid ? [projectId(uid), PUBLIC_ID] : [PUBLIC_ID]
      for (const id of ids) {
        const payload = await getPublishPayload(supabase, id)
        if (!payload) continue
        const unlocked = gateUnlocked(req, sanitizeUid(uid) || payload.uid || null, payload)
        return res.status(200).json({
          payload: visitorPayload(payload, sanitizeUid(uid) || payload.uid || null, unlocked),
          uid: uid || payload.uid || null,
          locked: !unlocked,
        })
      }
      return res.status(200).json({ payload: null, uid: uid || null })
    }

    if (req.method === "POST" && req.body?.action === "unlock") {
      const uid = sanitizeUid(req.body?.uid)
      const password = String(req.body?.password ?? "")
      if (!uid || !password) return res.status(400).json({ error: "UID dan password diperlukan" })
      const payload = await getPublishPayload(supabase, projectId(uid))
      if (!payload) return res.status(404).json({ error: "Tour tidak ditemukan" })
      if ((payload.access ?? "public") !== "password") return res.status(400).json({ error: "Tour ini tidak berpassword" })

      let ok = false
      const stored = await getGateHash(supabase, uid)
      if (stored) ok = verifyPassword(password, stored)
      else ok = legacyHash(password) === String(payload.passwordHash ?? "")
      if (!ok) return res.status(401).json({ error: "Password salah." })

      // Migrasi hash lama ke scrypt saat first unlock.
      if (!stored) await saveGate(supabase, uid, password)
      const cookie = gateCookieName(uid)
      const secure = String(req.headers?.["x-forwarded-proto"] || "").split(",")[0] === "https" ? "; Secure" : ""
      res.setHeader("Set-Cookie", `${cookie}=${encodeURIComponent(signGate(uid))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${GATE_DAYS * 86400}${secure}`)
      return res.status(200).json({ ok: true })
    }

    if (req.method === "POST") {
      const session = verifySession(bearer(req))
      if (!session) return res.status(401).json({ error: "Masuk dulu untuk mempublish tour." })

      const payload = req.body?.payload
      if (!payload?.scenes || !Array.isArray(payload.scenes)) return res.status(400).json({ error: "Missing payload" })
      const uid = sanitizeUid(req.body?.uid || payload.uid)
      const id = projectId(uid)
      const existing = await getPublishPayload(supabase, id)
      if (existing?.owner && existing.owner !== session.email) {
        return res.status(403).json({ error: "Tour ini dimiliki akun lain." })
      }

      if ((payload.access ?? "public") === "password") {
        const password = String(req.body?.password ?? "")
        if (password.length < 4) return res.status(400).json({ error: "Password minimal 4 karakter." })
        await saveGate(supabase, uid, password)
      } else {
        await deleteGate(supabase, uid)
      }

      const clean = { ...payload }
      delete clean.passwordHash
      const stamp = new Date().toISOString()
      const { error } = await supabase.from("virtour_state").upsert({
        id,
        data: { payload: { ...clean, uid: uid || null, owner: session.email }, updated_at: stamp },
        updated_at: stamp,
      })
      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ ok: true, uid: uid || null })
    }

    if (req.method === "DELETE") {
      const session = verifySession(bearer(req))
      if (!session) return res.status(401).json({ error: "Masuk dulu untuk menghapus tour." })
      const uid = sanitizeUid(req.query?.id || req.body?.uid)
      const id = projectId(uid)
      const existing = await getPublishPayload(supabase, id)
      if (existing?.owner && existing.owner !== session.email) {
        return res.status(403).json({ error: "Tour ini dimiliki akun lain." })
      }
      await supabase.from("virtour_state").delete().eq("id", id)
      await deleteGate(supabase, uid)
      return res.status(200).json({ ok: true, uid: uid || null })
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Gagal memproses publish" })
  }
}
