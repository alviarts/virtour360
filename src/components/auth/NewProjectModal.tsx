import { useState } from "react"
import { FolderPlus, X } from "lucide-react"

interface NewProjectModalProps {
  onClose: () => void
  onCreate: (name: string, category: string) => void
}

const categories = ["360° Post", "Virtual Tour", "Portofolio", "Produk", "Lainnya"]

export function NewProjectModal({ onClose, onCreate }: NewProjectModalProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState(categories[0])

  const submit = () => {
    if (!name.trim()) return
    onCreate(name.trim(), category)
  }

  return (
    <div className="fixed inset-0 z-[115] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md animate-fade-up rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-[#d1005c]/15 text-[#ff4d96]"><FolderPlus size={18} /></span>
            <div>
              <h2 className="text-base font-semibold text-white">Buat project baru</h2>
              <p className="mt-0.5 text-[11px] text-zinc-500">Project dibuat di Dashboard, lalu dibuka di Studio.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200" aria-label="Tutup"><X size={16} /></button>
        </div>

        <label className="mt-5 block">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Nama project</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit() }}
            placeholder="Contoh: The Gallery"
            className="mt-1.5 h-10 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-[#d1005c]"
          />
        </label>

        <div className="mt-4">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Kategori</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                  category === item
                    ? "border-[#d1005c] bg-[#d1005c]/15 text-pink-200"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="h-10 flex-1 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-300 hover:bg-white/5">Batal</button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="h-10 flex-1 rounded-lg bg-[#d1005c] text-xs font-semibold text-white hover:bg-[#b80051] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Buat & buka Studio
          </button>
        </div>
      </div>
    </div>
  )
}
