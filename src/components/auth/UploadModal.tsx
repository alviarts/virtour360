import { useEffect, useState } from "react"
import { Trash2, Upload, X } from "lucide-react"
import { useApp } from "../../context/useApp"

export function UploadModal() {
  const {
    uploadOpen,
    setUploadOpen,
    user,
    setAuthOpen,
    addPanorama,
    panoramas,
    activeProject,
    removePanorama,
    notify,
    scenes,
    replaceSceneId,
    setReplaceSceneId,
    replaceSceneImage,
  } = useApp()
  const [name, setName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const replaceTarget = scenes.find((s) => s.id === replaceSceneId)
  const visiblePanoramas = activeProject ? panoramas.filter((p) => p.projectId === activeProject.id) : panoramas

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  if (!uploadOpen) return null

  const close = () => {
    setUploadOpen(false)
    setReplaceSceneId(null)
    setFile(null)
    setName("")
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) {
      close()
      setAuthOpen(true)
      notify("Masuk dulu untuk mengunggah panorama 360°.")
      return
    }
    if (!file) {
      notify("Pilih file gambar 360° dulu.")
      return
    }
    setBusy(true)
    try {
      if (replaceSceneId) {
        await replaceSceneImage(replaceSceneId, file)
        notify(`Panorama scene "${replaceTarget?.name ?? ""}" diganti.`)
      } else {
        await addPanorama(name, file)
        notify("Panorama berhasil diunggah dan ditambahkan ke scene.")
      }
      close()
    } catch {
      notify("Gagal menyimpan panorama. Coba file lebih kecil.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={close}>
      <div
        className="w-full max-w-md animate-fade-up rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              {replaceSceneId ? "Ganti panorama scene" : "Unggah panorama 360°"}
            </h2>
            <p className="mt-1 text-[11px] text-zinc-500">
              {replaceSceneId
                ? `Gambar baru akan dipakai scene "${replaceTarget?.name ?? ""}". Tersimpan di browser ini.`
                : "Gambar equirectangular rasio 2:1 (mis. 4096×2048). Tersimpan di browser ini."}
            </p>
          </div>
          <button onClick={close} className="text-zinc-500 hover:text-zinc-200" aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        {!user && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
            <span className="font-semibold">Login diperlukan untuk mengunggah.</span> Publik hanya bisa
            melihat karya.{" "}
            <button type="button" onClick={() => { close(); setAuthOpen(true) }} className="font-semibold underline">
              Masuk sekarang
            </button>{" "}
            untuk menyimpan panorama Anda.
          </div>
        )}

        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          {!replaceSceneId && (
            <label className="flex flex-col gap-1.5 text-[11px] text-zinc-400">
              Nama scene
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Misal: Ruang Pamer Utama"
                className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
          )}

          <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-950 text-center transition-colors hover:border-zinc-500">
            {preview ? (
              <img src={preview} alt="Pratinjau" className="h-full w-full rounded-xl object-cover" />
            ) : (
              <>
                <Upload size={20} className="text-zinc-500" />
                <span className="text-[11px] text-zinc-400">Klik untuk pilih gambar 360°</span>
                <span className="text-[10px] text-zinc-600">JPG / PNG / WebP</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="h-10 rounded-lg bg-white text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
          >
            {busy ? "Menyimpan⬦" : replaceSceneId ? "Ganti panorama scene" : "Unggah & tambahkan scene"}
          </button>
        </form>

        {!replaceSceneId && visiblePanoramas.length > 0 && (
          <div className="mt-5 border-t border-zinc-800 pt-4">
            <p className="mb-2 text-[11px] font-semibold text-zinc-300">Panorama project ini ({visiblePanoramas.length})</p>
            <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
              {visiblePanoramas.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-lg border border-zinc-800 px-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300">{p.name}</span>
                  <button onClick={() => void removePanorama(p.id)} title="Hapus" className="text-zinc-500 hover:text-red-400">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-3 text-center text-[10px] text-zinc-600">Total scene tersedia: {scenes.length}</p>
      </div>
    </div>
  )
}
