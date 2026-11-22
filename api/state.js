import { createClient } from "@supabase/supabase-js"
import { verifySession } from "./_auth.js"

const DEFAULT_ID = "virtour360-shared"

/** Id state aman: hanya karakter tertentu, maksimal 80 karakter. */
function safeId(input) {
  if (typeof input !== "string") return DEFAULT_ID
  const value = input.trim()
  return /^[A-Za-z0-9:._-]{1,80}$/.test(value) ? value : DEFAULT_ID
}

/**
 * Serverless function  kredensial Supabase HANYA di server (env Vercel,
 * tanpa prefix VITE_), tidak pernah dikirim ke browser.
 *
 * Setiap identitas (user login atau tamu) punya baris state sendiri:
 *   - login : user:<email>
 *   - tamu  : guest:<random-id>
 *
 * ENV:
 *   SUPABASE_URL=https://<ref>.supabase.co
 *   SUPABASE_SECRET_KEY=<sb_secret_... / service_role>
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return res.status(500).json({ error: "Missing SUPABASE_URL or SUPABASE_SECRET_KEY" })
  }

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "")
  const session = verifySession(token)
  // User login selalu memakai state privat sendiri  tidak bisa membaca state orang lain.
  const stateId = session
    ? `user:${session.email}`
    : safeId(req.query?.key ?? req.body?.key ?? req.headers?.["x-virtour-key"])
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("virtour_state")
      .select("data")
      .eq("id", stateId)
      .maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ id: stateId, data: data?.data ?? null })
  }

  if (req.method === "POST") {
    const state = req.body?.data
    if (!state) return res.status(400).json({ error: "Missing data" })
    const { error } = await supabase.from("virtour_state").upsert({
      id: stateId,
      data: state,
      updated_at: new Date().toISOString(),
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ id: stateId, ok: true })
  }

  return res.status(405).json({ error: "Method not allowed" })
}
