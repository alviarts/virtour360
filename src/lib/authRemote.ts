import { scryptAsync } from "@noble/hashes/scrypt.js"
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js"
import { isServerMode, supabase } from "./supabase"

/**
 * Akun Virtour360 disimpan di tabel Supabase `virtour_users`.
 * Password di-hash memakai scrypt dengan format yang sama dengan api/_auth.js,
 * sehingga akun bisa dipakai baik di mode klien maupun mode server.
 */

export interface AuthUser {
  name: string
  email: string
  initials: string
  uid: string
}

export interface AuthResult {
  ok: boolean
  user?: AuthUser
  error?: string
  message?: string
}

interface UserRow {
  email: string
  name: string
  initials: string
  password_hash: string
  uid?: string | null
}

const SCRYPT = { N: 16384, r: 8, p: 1, dkLen: 64 } as const

export function isAuthRemote(): boolean {
  return !isServerMode && supabase !== null
}

function makeInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "U"
  )
}

function friendly(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes("duplicate key") || lower.includes("unique constraint")) {
    return "Email sudah terdaftar. Silakan masuk."
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "Supabase tidak dapat dijangkau. Cek koneksi internet."
  }
  return message
}

/** UID publik stabil bila kolom uid belum tersedia di tabel. */
async function deriveUid(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase()
  if (globalThis.crypto?.subtle) {
    const buffer = await crypto.subtle.digest("SHA-256", utf8ToBytes(normalized))
    return bytesToHex(new Uint8Array(buffer)).slice(0, 10)
  }
  let hash = 2166136261
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36).padStart(7, "0").slice(0, 10)
}

async function toUser(row: UserRow): Promise<AuthUser> {
  return {
    name: row.name,
    email: row.email,
    initials: row.initials || makeInitials(row.name),
    uid: row.uid?.trim() || (await deriveUid(row.email)),
  }
}

async function hashPassword(password: string): Promise<string> {
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)))
  // api/_auth.js memakai string hex salt apa adanya (bukan byte hasil decode).
  const hash = await scryptAsync(utf8ToBytes(password), utf8ToBytes(salt), SCRYPT)
  return `${salt}:${bytesToHex(hash)}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [salt, expected] = String(stored).split(":")
    if (!salt || !expected) return false
    const actual = bytesToHex(await scryptAsync(utf8ToBytes(password), utf8ToBytes(salt), SCRYPT))
    if (actual.length !== expected.length) return false
    let diff = 0
    for (let i = 0; i < actual.length; i += 1) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i)
    return diff === 0
  } catch {
    return false
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function findRow(email: string): Promise<UserRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("virtour_users")
    .select("*")
    .eq("email", normalizeEmail(email))
    .maybeSingle()
  if (error) throw error
  return (data as UserRow | null) ?? null
}

/** Sesi lokal tetap diverifikasi terhadap akun yang masih ada di Supabase. */
export async function remoteValidateSession(email: string): Promise<boolean> {
  if (!isAuthRemote()) return true
  try {
    return (await findRow(email)) !== null
  } catch {
    // Gagal jaringan: jangan mengusir user yang sedang offline.
    return true
  }
}

/** Tabel lama tidak punya kolom uid; deteksi dari baris yang sudah ada. */
async function hasUidColumn(): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.from("virtour_users").select("*").limit(1)
  if (error || !data?.length) return false
  return Object.prototype.hasOwnProperty.call(data[0], "uid")
}

export async function remoteSignUp(
  name: string,
  email: string,
  password: string,
  preferredUid?: string,
): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: "Supabase belum tersambung." }
  if (name.trim().length < 2) return { ok: false, error: "Nama minimal 2 karakter." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { ok: false, error: "Format email tidak valid." }
  }
  if (password.length < 6) return { ok: false, error: "Password minimal 6 karakter." }

  const normalized = normalizeEmail(email)
  try {
    if (await findRow(normalized)) {
      return { ok: false, error: "Email sudah terdaftar. Silakan masuk." }
    }
    const uid = preferredUid?.trim() || (await deriveUid(normalized))
    const row = {
      email: normalized,
      name: name.trim(),
      initials: makeInitials(name),
      password_hash: await hashPassword(password),
    }
    const { error } = await supabase.from("virtour_users").insert(row)
    if (error) return { ok: false, error: friendly(error.message) }
    // Kolom uid opsional — hanya dipakai bila tersedia di schema.
    if (await hasUidColumn()) {
      await supabase.from("virtour_users").update({ uid }).eq("email", normalized)
    }
    return { ok: true, user: { name: row.name, email: row.email, initials: row.initials, uid } }
  } catch (error) {
    return { ok: false, error: friendly(error instanceof Error ? error.message : String(error)) }
  }
}

export async function remoteSignIn(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: "Supabase belum tersambung." }
  try {
    const row = await findRow(email)
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      return { ok: false, error: "Email atau password salah." }
    }
    return { ok: true, user: await toUser(row) }
  } catch (error) {
    return { ok: false, error: friendly(error instanceof Error ? error.message : String(error)) }
  }
}

export async function remoteUpdateProfile(
  currentEmail: string,
  name: string,
  email: string,
): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: "Supabase belum tersambung." }
  if (name.trim().length < 2) return { ok: false, error: "Nama minimal 2 karakter." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { ok: false, error: "Format email tidak valid." }
  }
  const nextEmail = normalizeEmail(email)
  try {
    const current = await findRow(currentEmail)
    if (!current) return { ok: false, error: "Akun tidak ditemukan di Supabase." }
    if (nextEmail !== normalizeEmail(currentEmail) && (await findRow(nextEmail))) {
      return { ok: false, error: "Email sudah dipakai akun lain." }
    }
    const patch = {
      name: name.trim(),
      initials: makeInitials(name),
      email: nextEmail,
    }
    const { error } = await supabase.from("virtour_users").update(patch).eq("email", normalizeEmail(currentEmail))
    if (error) return { ok: false, error: friendly(error.message) }
    const uid = current.uid?.trim() || (await deriveUid(nextEmail))
    return {
      ok: true,
      user: { name: patch.name, email: nextEmail, initials: patch.initials, uid },
      message: nextEmail !== normalizeEmail(currentEmail) ? "Email berhasil diperbarui." : undefined,
    }
  } catch (error) {
    return { ok: false, error: friendly(error instanceof Error ? error.message : String(error)) }
  }
}

export async function remoteChangePassword(
  email: string,
  current: string,
  next: string,
): Promise<AuthResult> {
  if (!supabase) return { ok: false, error: "Supabase belum tersambung." }
  if (next.length < 6) return { ok: false, error: "Password baru minimal 6 karakter." }
  try {
    const row = await findRow(email)
    if (!row || !(await verifyPassword(current, row.password_hash))) {
      return { ok: false, error: "Password lama salah." }
    }
    const { error } = await supabase
      .from("virtour_users")
      .update({ password_hash: await hashPassword(next) })
      .eq("email", normalizeEmail(email))
    if (error) return { ok: false, error: friendly(error.message) }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: friendly(error instanceof Error ? error.message : String(error)) }
  }
}
