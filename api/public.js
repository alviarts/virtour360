import { createClient } from "@supabase/supabase-js"

const PUBLIC_ID = "virtour:public"

/** Id state untuk satu project publish: virtour:pub:<uid> */
function projectId(uid) {
  if (!uid || typeof uid !== "string") return PUBLIC_ID
  const safe = uid.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 40)
  return safe ? `virtour:pub:${safe}` : PUBLIC_ID
}

/**
 * Payload lama bisa berisi URL blob: yang hanya hidup di browser pemilik.
 * Supaya tour lama tetap bisa dibuka, pakai thumbnail data URL (base64) sebagai
 * panorama sementara. Thumbnail dibuat dengan rasio 2:1 sehingga valid sebagai
 * equirectangular, hanya resolusinya lebih rendah.
 */
function readableScene(scene) {
  if (!scene || typeof scene.panorama !== "string" || !scene.panorama.startsWith("blob:")) return scene
  const thumbnail = scene.thumbnail
  if (typeof thumbnail === "string" && thumbnail.startsWith("data:image/")) {
    return { ...scene, panorama: thumbnail, panoramaFallback: true }
  }
  return scene
}

function readablePayload(payload) {
  if (!payload || !Array.isArray(payload.scenes)) return payload
  return { ...payload, scenes: payload.scenes.map(readableScene) }
}

/**
 * Endpoint publik — dibaca pengunjung tanpa login.
 * GET /api/public?id=<uid> → project tertentu
 * POST { uid, payload } → simpan project dengan UID unik
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
    // Feed Customers: semua project yang dipublish (bukan state privat).
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
          const payload = row.data?.payload ?? row.data ?? null
          if (!payload?.scenes?.length) return null
          return { uid: payload.uid || row.id.slice("virtour:pub:".length), payload: readablePayload(payload) }
        })
        .filter(Boolean)
      return res.status(200).json({ items })
    }

    const uid = req.query?.id
    // Projeck dengan UID lebih dulu; kalau tidak ada, fallback ke state lama.
    const ids = uid ? [projectId(uid), PUBLIC_ID] : [PUBLIC_ID]
    for (const id of ids) {
      const { data, error } = await supabase.from("virtour_state").select("data").eq("id", id).maybeSingle()
      if (error) return res.status(500).json({ error: error.message })
      const payload = data?.data?.payload ?? data?.data ?? null
      if (payload) return res.status(200).json({ payload: readablePayload(payload), uid: uid || payload.uid || null })
    }
    return res.status(200).json({ payload: null, uid: uid || null })
  }

  if (req.method === "POST") {
    const payload = req.body?.payload
    if (!payload?.scenes) return res.status(400).json({ error: "Missing payload" })
    const uid = req.body?.uid || payload.uid
    const id = projectId(uid)
    const { error } = await supabase.from("virtour_state").upsert({
      id,
      data: { payload: { ...payload, uid: uid || null }, updated_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true, uid: uid || null })
  }

  return res.status(405).json({ error: "Method not allowed" })
}
