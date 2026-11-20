import { Images, RotateCcw, X } from "lucide-react"
import { useApp } from "../../context/AppContext"

interface MediaPickerModalProps {
  activeSceneId: string
  onClose: () => void
}

export function MediaPickerModal({ activeSceneId, onClose }: MediaPickerModalProps) {
  const { scenes, setMediaFromScene, removeSceneMediaOverride, notify } = useApp()
  const options = scenes.filter((s) => s.id !== activeSceneId)

  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg animate-fade-up rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Pilih gambar dari scene</h2>
            <p className="mt-1 text-[11px] text-zinc-500">Ganti panorama &amp; thumbnail scene ini dengan scene lain.</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200" aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {options.map((scene) => (
            <button
              key={scene.id}
              onClick={() => {
                setMediaFromScene(activeSceneId, scene)
                notify(`Media scene diganti dengan "${scene.name}".`)
                onClose()
              }}
              className="group overflow-hidden rounded-lg border border-zinc-800 bg-black text-left transition-colors hover:border-amber-400"
            >
              <div className="relative h-20 overflow-hidden">
                <img src={scene.thumbnail} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              </div>
              <p className="truncate px-2 py-1.5 text-[10px] text-zinc-300">{scene.name}</p>
            </button>
          ))}
          {options.length === 0 && (
            <p className="col-span-full py-8 text-center text-xs text-zinc-500">Belum ada scene lain.</p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Images size={13} /> {options.length} scene tersedia
          </span>
          <button
            onClick={() => {
              removeSceneMediaOverride(activeSceneId)
              notify("Media asli scene dipulihkan.")
              onClose()
            }}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-700 px-3 text-[11px] text-zinc-300 hover:bg-white/5"
          >
            <RotateCcw size={12} /> Pulihkan asli
          </button>
        </div>
      </div>
    </div>
  )
}
