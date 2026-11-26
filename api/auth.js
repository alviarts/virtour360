import crypto from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { hashPassword, signSession, verifyPassword, verifySession } from "./_auth.js"

/** UID publik unik yang dibuat saat user mendaftar. */
function makeUid() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10)
}

function makeInitials(name) {
  return String(name).trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "U"
}

function server() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Autentikasi tersimpan di database (bukan localStorage). */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")
  const supabase = server()
  if (!supabase) return res.status(500).json({ error: "Missing Supabase server env" })

  const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "")
  const session = verifySession(bearer)

  if (req.method === "GET") {
    if (!session) return res.status(401).json({ error: "Sesi tidak valid" })
    return res.status(200).json({ user: session })
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const { action } = req.body || {}

  if (action === "register") {
    const { name, email, password } = req.body
    if (!name || String(name).trim().length < 2) return res.status(400).json({ error: "Nama minimal 2 karakter." })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""))) return res.status(400).json({ error: "Format email tidak valid." })
    if (!password || String(password).length < 6) return res.status(400).json({ error: "Password minimal 6 karakter." })
    const normalized = String(email).trim().toLowerCase()
    const { data: existing } = await supabase.from("virtour_users").select("email").eq("email", normalized).maybeSingle()
    if (existing) return res.status(409).json({ error: "Email sudah terdaftar. Silakan login." })
    const user = { name: String(name).trim(), email: normalized, initials: makeInitials(name), uid: makeUid(), password_hash: hashPassword(password) }
    const { error } = await supabase.from("virtour_users").insert(user)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true, token: signSession(user), user: { name: user.name, email: user.email, initials: user.initials, uid: user.uid } })
  }

  if (action === "login") {
    const email = String(req.body.email || "").trim().toLowerCase()
    const { data: row, error } = await supabase.from("virtour_users").select("*").eq("email", email).maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    if (!row) return res.status(404).json({ error: "Akun tidak ditemukan. Silakan daftar dulu." })
    if (!verifyPassword(req.body.password, row.password_hash)) return res.status(401).json({ error: "Password salah." })
    let uid = row.uid
    if (!uid) {
      uid = makeUid()
      await supabase.from("virtour_users").update({ uid }).eq("email", email)
    }
    const signed = { ...row, uid }
    return res.status(200).json({
      ok: true,
      token: signSession(signed),
      user: { name: row.name, email: row.email, initials: row.initials, uid },
    })
  }

  if (!session) return res.status(401).json({ error: "Sesi tidak valid" })

  if (action === "profile") {
    const name = String(req.body.name || "").trim()
    const email = String(req.body.email || "").trim().toLowerCase()
    if (name.length < 2) return res.status(400).json({ error: "Nama minimal 2 karakter." })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Format email tidak valid." })
    if (email !== session.email) {
      const { data: other } = await supabase.from("virtour_users").select("email").eq("email", email).maybeSingle()
      if (other) return res.status(409).json({ error: "Email sudah dipakai akun lain." })
    }
    const { error } = await supabase.from("virtour_users").update({ name, email, initials: makeInitials(name) }).eq("email", session.email)
    if (error) return res.status(500).json({ error: error.message })
    const user = { name, email, initials: makeInitials(name), uid: session.uid }
    return res.status(200).json({ ok: true, token: signSession(user), user })
  }

  if (action === "password") {
    const { current, next } = req.body
    if (!next || String(next).length < 6) return res.status(400).json({ error: "Password baru minimal 6 karakter." })
    const { data: row } = await supabase.from("virtour_users").select("password_hash").eq("email", session.email).maybeSingle()
    if (!row || !verifyPassword(current, row.password_hash)) return res.status(401).json({ error: "Password lama salah." })
    const { error } = await supabase.from("virtour_users").update({ password_hash: hashPassword(next) }).eq("email", session.email)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(400).json({ error: "Aksi tidak dikenal" })
}
