import { useState } from "react"
import { Check, Copy, X } from "lucide-react"

const BASE = typeof window !== "undefined" ? window.location.origin : ""

export function EmbedModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const code = `<iframe src="${BASE}/#/portfolio" width="100%" height="600" frameborder="0" allow="fullscreen; gyroscope; accelerometer" title="Virtour360 Virtual Tour"></iframe>`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg animate-fade-up rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Embed portofolio</h2>
            <p className="mt-1 text-[11px] text-zinc-500">Salin kode ini untuk menampilkan tur di website Anda.</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200" aria-label="Tutup"><X size={16} /></button>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-zinc-800 bg-black/60 p-3 text-[10px] leading-relaxed text-zinc-300">{code}</pre>
        <button onClick={copy} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-white text-xs font-semibold text-black hover:bg-zinc-200">
          {copied ? <><Check size={14} /> Tersalin</> : <><Copy size={14} /> Salin kode</>}
        </button>
      </div>
    </div>
  )
}
