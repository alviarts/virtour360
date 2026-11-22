import { createClient } from "@supabase/supabase-js"

const PUBLIC_ID = "virtour:public"

/**
 * Endpoint publik — dibaca pengunjung tanpa login.
 * Ditulis hanya oleh pemilik lewat tombol "Published" di Studio.
 * Kredensial tetap hanya di server.
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

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("virtour_state")
      .select("data")
      .eq("id", PUBLIC_ID)
      .maybeSingle()
    if (error) return res.status(500).json({ error: error.message })
    const payload = data?.data?.payload ?? data?.data ?? null
    return res.status(200).json({ payload })
  }

  if (req.method === "POST") {
    const payload = req.body?.payload
    if (!payload?.scenes) return res.status(400).json({ error: "Missing payload" })
    const { error } = await supabase.from("virtour_state").upsert({
      id: PUBLIC_ID,
      data: { payload, updated_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: "Method not allowed" })
}
