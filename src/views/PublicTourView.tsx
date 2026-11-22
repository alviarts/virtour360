import { useEffect, useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { useApp } from "../context/useApp"
import { PublicViewerModal } from "../components/viewer/PublicViewerModal"
import { hashPassword, loadPublicPayload, publicUidFromHash, type PublicPayload } from "../lib/publicStore"
import { navigate } from "../lib/navigation"

/**
 * Halaman untuk link publish `#/p/<uid>`.
 * Beda dengan PublicPortfolioView: link ini langsung membuka viewer 360°,
 * bukan profil/portofolio kreator.
 */
export function PublicTourView() {
  const { scenes: localScenes } = useApp()
  const uid = publicUidFromHash()
  const [payload, setPayload] = useState<PublicPayload | null>(null)
  const [ready, setReady] = useState(false)
  const [gatePassword, setGatePassword] = useState("")
  const [gateError, setGateError] = useState("")
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    let alive = true
    loadPublicPayload(uid).then((data) => {
      if (!alive) return
      setPayload(data)
      setReady(true)
    })
    return () => { alive = false }
  }, [uid])

  const gateKey = `virtour360.unlocked:${uid ?? "default"}`
  useEffect(() => setUnlocked(sessionStorage.getItem(gateKey) === "1"), [gateKey])

  const scenes = useMemo(
    () => (payload?.scenes?.length ? payload.scenes : localScenes),
    [payload, localScenes],
  )
  const title =
    payload?.folders?.[0]?.name ??
    payload?.scenes?.[0]?.project?.title ??
    payload?.profile?.name ??
    "Virtual Tour 360°"

  const access = payload?.access ?? "public"
  const isLocked = access === "draft" || (access === "password" && !unlocked)

  const unlock = () => {
    if (hashPassword(gatePassword) !== (payload?.passwordHash ?? "")) {
      setGateError("Password salah.")
      return
    }
    sessionStorage.setItem(gateKey, "1")
    setUnlocked(true)
    setGateError("")
  }

  if (!ready) {
    return <div className="grid h-full w-full place-items-center bg-zinc-950 text-xs text-zinc-500">Memuat tour⬦</div>
  }

  if (isLocked) {
    return (
      <div className="grid h-full w-full place-items-center bg-[#f7f9fc] px-4 text-slate-900">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl">
          <h1 className="text-lg font-bold">
            {access === "draft" ? "Tour masih dalam draft" : "Tour dilindungi password"}
          </h1>
          <p className="mt-2 text-xs text-slate-500">
            {access === "draft" ? "Pemilik belum mempublikasikan tour ini." : "Masukkan password untuk melihat virtual tour ini."}
          </p>
          {access === "password" && (
            <div className="mt-4 flex flex-col gap-2">
              <input
                type="password"
                value={gatePassword}
                onChange={(e) => setGatePassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") unlock() }}
                placeholder="Password tour"
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-sky-500"
              />
              {gateError && <p className="text-[11px] text-red-500">{gateError}</p>}
              <button onClick={unlock} className="h-10 rounded-lg bg-sky-500 text-sm font-semibold text-white hover:bg-sky-600">Buka tour</button>
            </div>
          )}
          <button onClick={() => navigate("home")} className="mt-4 text-[11px] text-slate-400 hover:underline">Kembali ke Home</button>
        </div>
      </div>
    )
  }

  if (!scenes.length) {
    return (
      <div className="grid h-full w-full place-items-center bg-zinc-950 px-4 text-center text-sm text-zinc-300">
        <div>
          <p>Tour tidak ditemukan atau belum punya scene.</p>
          <button onClick={() => navigate("home")} className="mt-4 rounded-full bg-white/10 px-4 py-2 text-xs hover:bg-white/20">Kembali ke Home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <PublicViewerModal
        inline
        title={title}
        panorama={scenes[0].panorama}
        scenes={scenes}
        sceneId={payload?.studioConfig?.setting.initialScene}
        onClose={() => navigate("home")}
      />
      <button
        onClick={() => navigate("home")}
        title="Kembali ke Home"
        className="absolute bottom-5 left-4 z-10 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 text-[11px] font-medium text-white backdrop-blur hover:bg-black/80"
      >
        <ArrowLeft size={14} /> Home
      </button>
    </div>
  )
}
