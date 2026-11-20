import { useEffect } from "react"
import { X } from "lucide-react"

export function Lightbox({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[110] grid place-items-center bg-black/85 p-6 backdrop-blur"
      onClick={onClose}
    >
      <div className="flex w-full max-w-4xl flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium text-zinc-100">{title}</p>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Tutup">
            <X size={16} />
          </button>
        </div>
        <img src={src} alt={title} className="max-h-[75vh] w-full rounded-xl object-contain shadow-2xl" />
      </div>
    </div>
  )
}
