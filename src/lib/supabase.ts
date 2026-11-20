import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Tolak secret / service-role key. Env VITE_* ikut ter-bundle ke browser,
 * jadi hanya anon PUBLIC key yang boleh dipakai di sini.
 */
function isPublicKey(key: string | undefined): key is string {
  if (!key) return false
  if (key.startsWith("sb_secret_") || key.includes("service_role")) {
    console.warn(
      "[Virtour360] VITE_SUPABASE_ANON_KEY terlihat seperti secret key. " +
        "Gunakan anon PUBLIC key dari Supabase Dashboard → Settings → API. " +
        "Mode lokal dipakai sementara.",
    )
    return false
  }
  return true
}

/** Klien hanya dibuat jika env var valid. Mode lokal tetap berfungsi penuh. */
export const supabase: SupabaseClient | null =
  url && isPublicKey(anonKey)
    ? createClient(url, anonKey, { auth: { persistSession: false } })
    : null

/** Mode server: kredensial disimpan di Vercel Function, bukan di browser. */
export const isServerMode = import.meta.env.VITE_USE_SERVER_DB === "1"

export const isRemote = isServerMode || supabase !== null

/** Baris state bersama (cukup untuk 2–5 orang). */
export const SHARED_STATE_ID = "virtour360-shared"
