import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Check, Copy, ExternalLink, Globe, Lock, QrCode, X } from "lucide-react"
import { useApp } from "../../context/useApp"
import type { Scene } from "../../types/tour"
import { profile as defaultProfile } from "../../data/profile"
import { copyText } from "../../lib/clipboard"
import {
  buildPublicFolders,
  makePublicUid,
  normalizeSlug,
  publicShareUrl,
  publishPublicPayload,
  type PublicProfile,
} from "../../lib/publicStore"

interface PublishModalProps {
  onClose: () => void
  scenes: Scene[]
  userName?: string
  userInitials?: string
  /** UID project yang sudah dipublish — dipakai untuk publish ulang (bukan project baru). */
  existingUid?: string | null
  onPublished?: (uid: string) => void
}

type Access = "draft" | "public" | "password"

export function PublishModal({ onClose, scenes, userName, userInitials, existingUid, onPublished }: PublishModalProps) {
  const { studioConfig, user, notify, ensurePublicScenes } = useApp()
  const [access, setAccess] = useState<Access>("public")
  const [password, setPassword] = useState("")
  const [uid, setUid] = useState<string | null>(existingUid ?? null)
  const owner = normalizeSlug(user?.name ?? userName ?? "user") || "user"
  const tourName = normalizeSlug(scenes[0]?.name ?? "tour") || "tour"
  // Project baru selalu dapat alamat unik; publish ulang memakai UID project yang sama.
  const [slug, setSlug] = useState(existingUid ?? `${owner}/${tourName}-${makePublicUid().slice(0, 6)}`)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<"link" | "code" | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [allowFullscreen, setAllowFullscreen] = useState(true)
  const [allowVr, setAllowVr] = useState(true)
  const [lazy, setLazy] = useState(true)

  const shareUrl = uid ? publicShareUrl(uid) : ""
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0"${allowFullscreen ? ' allowfullscreen' : ""}${allowVr ? ' allow="vr"' : ""}${lazy ? ' loading="lazy"' : ""} title="Virtour360 Virtual Tour"></iframe>`

  useEffect(() => {
    if (!shareUrl) { setQr(null); return }
    QRCode.toDataURL(shareUrl, { width: 180, margin: 1, color: { dark: "#09090b", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null))
  }, [shareUrl])

  const publish = async () => {
    setBusy(true)
    setError(null)
    if (access === "password" && password.trim().length < 4) {
      setBusy(false)
      setError("Password minimal 4 karakter.")
      return
    }
    const userProfile: PublicProfile = {
      name: userName ?? defaultProfile.name,
      initials: userInitials ?? defaultProfile.initials,
      location: studioConfig.setting.location || defaultProfile.location,
      email: defaultProfile.email,
      website: defaultProfile.website,
      bio: defaultProfile.bio,
    }
    const parts = slug.split("/").map(normalizeSlug).filter(Boolean)
    const cleanSlug = parts.join("/") || `${owner}/${tourName}`
    // Panorama hasil upload harus punya URL publik, bukan blob: milik browser ini.
    const prepared = await ensurePublicScenes(scenes)
    if (prepared.error) {
      setBusy(false)
      setError(prepared.error)
      return
    }
    const result = await publishPublicPayload({
      profile: userProfile,
      scenes: prepared.scenes,
      folders: buildPublicFolders(prepared.scenes, cleanSlug || uid || undefined),
      creators: [],
      studioConfig,
      access,
      ...(cleanSlug ? { slug: cleanSlug } : {}),
      updatedAt: new Date().toISOString(),
    }, cleanSlug || uid || undefined, access === "password" ? { password: password.trim() } : undefined)
    setBusy(false)
    if (result.ok) {
      setUid(result.uid)
      setSlug(result.uid)
      onPublished?.(result.uid)
      if (result.warning) notify(result.warning)
      if (await copyText(publicShareUrl(result.uid))) notify("Link publish disalin ke clipboard.")
    } else {
      setError(result.error || "Publish gagal. Periksa koneksi/config server.")
    }
  }

  const copy = async (value: string, kind: "link" | "code") => {
    const ok = await copyText(value)
    if (!ok) {
      notify("Gagal menyalin otomatis — pilih dan salin teksnya secara manual.")
      return
    }
    setCopied(kind)
    notify(kind === "link" ? "Link disalin." : "Kode embed disalin.")
    window.setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div className="fixed inset-0 z-[115] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-2xl animate-fade-up overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Publish &amp; bagikan</h2>
            <p className="mt-1 text-[11px] text-zinc-500">
              Atur siapa yang bisa melihat, lalu salin link, QR, atau kode embed.
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200" aria-label="Tutup"><X size={16} /></button>
        </div>

        {/* Access */}
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Who has access</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {([
            { id: "draft", label: "Draft", icon: Lock },
            { id: "public", label: "Public", icon: Globe },
            { id: "password", label: "Password", icon: Lock },
          ] as const).map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setAccess(item.id)}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs ${
                  access === item.id ? "border-sky-500 bg-sky-500/10 text-sky-300" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                <Icon size={13} /> {item.label}
              </button>
            )
          })}
        </div>
        {access === "password" && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password tour"
            className="mt-2 h-9 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none"
          />
        )}
        <p className="mt-1.5 text-[10px] text-zinc-600">
          {access === "public" ? "Siapa pun dengan link bisa melihat." : access === "draft" ? "Draft: tour tidak bisa dibuka publik." : "Pengunjung perlu memasukkan password."}
        </p>

        <label className="mt-3 block">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Slug / alamat tour</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="contoh: the-gallery"
            className="mt-1.5 h-9 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 font-mono text-[11px] text-zinc-100 outline-none"
          />
          <span className="mt-1 block text-[10px] text-zinc-600">Format: username/alamat-tour-kode — kode unik otomatis supaya project tidak saling menimpa.</span>
        </label>

        {error && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">{error}</p>
        )}

        <button
          onClick={publish}
          disabled={busy}
          className="mt-4 h-10 w-full rounded-lg bg-white text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
        >
          {busy ? "Mempublish…" : uid ? "Publish ulang" : "Publish sekarang"}
        </button>

        {uid && (
          <>
            <div className="mt-5 rounded-xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Link project · by Project · /p/{uid}</p>
              <div className="mt-2 flex gap-2">
                <input readOnly value={shareUrl} className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 font-mono text-[10px] text-zinc-300" />
                <button onClick={() => copy(shareUrl, "link")} title="Salin link" className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-black hover:bg-zinc-200">
                  {copied === "link" ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <a href={shareUrl} target="_blank" rel="noreferrer" title="Buka link" className="grid size-9 shrink-0 place-items-center rounded-lg border border-zinc-700 text-zinc-300 hover:bg-white/5">
                  <ExternalLink size={14} />
                </a>
              </div>

              <div className="mt-4 flex items-center gap-4">
                {qr && <img src={qr} alt="QR code" className="size-24 rounded-lg bg-white p-1" />}
                <div className="text-[10px] leading-relaxed text-zinc-500">
                  <span className="flex items-center gap-1 font-semibold text-zinc-300"><QrCode size={12} /> QR Code</span>
                  Pindai untuk membuka tur di ponsel. QR otomatis dibuat dari link unik project ini.
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-800 bg-black/40 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Embed</p>
              <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-zinc-400">
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={allowFullscreen} onChange={(e) => setAllowFullscreen(e.target.checked)} className="accent-sky-500" /> Allow Fullscreen</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={allowVr} onChange={(e) => setAllowVr(e.target.checked)} className="accent-sky-500" /> Allow VR</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={lazy} onChange={(e) => setLazy(e.target.checked)} className="accent-sky-500" /> Loading lazy</label>
              </div>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-2 font-mono text-[9px] leading-relaxed text-zinc-400">{embedCode}</pre>
              <button onClick={() => copy(embedCode, "code")} className="mt-2 flex h-8 items-center gap-1.5 rounded-lg border border-zinc-700 px-3 text-[11px] text-zinc-300 hover:bg-white/5">
                {copied === "code" ? <Check size={12} /> : <Copy size={12} />} {copied === "code" ? "Tersalin" : "Copy Code"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
