import { createClient } from "@supabase/supabase-js"
import { verifySession } from "./_auth.js"

const BUCKET = "panoramas"

/**
 * Beri URL upload bertanda tangan untuk panorama. Kredensial service-key hanya
 * ada di server; browser meng-upload langsung ke Supabase Storage memakai token
 * ini, jadi tidak kena batas body 4,5 MB Vercel Function.
 *
 * POST { id, contentType } → { path, token, publicUrl }
 */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return res.status(500).json({ error: "Missing Supabase server env" })

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "")
  const session = verifySession(token)
  if (!session) return res.status(401).json({ error: "Masuk dulu untuk mengunggah panorama." })

  const id = String(req.body?.id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80)
  if (!id) return res.status(400).json({ error: "Missing asset id" })
  const mime = String(req.body?.contentType || "image/jpeg")
  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : mime.includes("avif") ? "avif" : "jpg"
  const owner = session.email.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 60) || "user"
  const path = `${owner}/${id}.${ext}`

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  // Pastikan bucket publik tersedia. Bucket dibuat otomatis memakai service key
  // supaya tour bisa dibuka dari perangkat mana pun tanpa SQL manual.
  const { data: bucket, error: bucketError } = await supabase.storage.getBucket(BUCKET)
  if (bucketError) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 25 * 1024 * 1024,
    })
    if (createError) return res.status(500).json({ error: `Gagal membuat bucket storage: ${createError.message}` })
  } else if (!bucket.public) {
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: 25 * 1024 * 1024,
    })
    if (updateError) return res.status(500).json({ error: `Gagal mengubah bucket storage: ${updateError.message}` })
  }

  // upsert: publish ulang / retry memakai id yang sama harus menimpa object lama.
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true })
  if (error) return res.status(500).json({ error: error.message })

  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  return res.status(200).json({ path, token: data.token, signedUrl: data.signedUrl, publicUrl })
}
