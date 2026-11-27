import { useEffect, useState } from "react"
import { Check, FolderPlus, ImageUp, MapPin, Share2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const STEPS: { label: string; detail: string; Icon: LucideIcon }[] = [
  { label: "Buat project", detail: "Nama + kategori", Icon: FolderPlus },
  { label: "Unggah scene", detail: "Panorama 2:1", Icon: ImageUp },
  { label: "Pasang hotspot", detail: "Info, media, navigasi", Icon: MapPin },
  { label: "Publish link", detail: "#/p/<uid> + QR", Icon: Share2 },
]

/** Miniatur workflow yang berjalan sendiri — dipakai di halaman Documentation. */
export function WorkflowFlow() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % STEPS.length), 2600)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]" aria-label="Animasi alur kerja Virtour360">
      <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] p-3">
        {STEPS.map(({ label, Icon }, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setActive(index)}
            className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-2 py-2 text-left transition-all ${
              active === index
                ? "border-[#e4f222]/40 bg-[#e4f222]/10 text-[#f7f8f8]"
                : "border-transparent text-[#8a8f98] hover:border-white/10"
            }`}
          >
            <span className={`grid size-6 shrink-0 place-items-center rounded-md ${active === index ? "bg-[#e4f222] text-[#08090a]" : "bg-white/5"}`}>
              <Icon size={12} />
            </span>
            <span className="truncate text-[10px] font-medium">{label}</span>
            {index < STEPS.length - 1 && <span className="ml-auto hidden size-1 rounded-full bg-white/20 sm:block" />}
          </button>
        ))}
      </div>

      <div className="relative h-[172px] overflow-hidden bg-zinc-950">
        {STEPS.map((step, index) => (
          <div
            key={step.label}
            aria-hidden={active !== index}
            className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 transition-all duration-500 ${
              active === index ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
            }`}
          >
            {index === 0 && (
              <>
                <div className="flex w-full max-w-[420px] items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-[10px] text-zinc-300">
                  <span>Project kamu</span><span className="rounded-full bg-[#e4f222]/15 px-2 py-0.5 text-[#e4f222]">+ Baru</span>
                </div>
                <div className="grid w-full max-w-[420px] grid-cols-3 gap-2">
                  {["Gallery", "Showroom", "Studio"].map((name, i) => (
                    <div key={name} className={`rounded-lg border p-2 text-[9px] ${i === active % 3 ? "border-[#e4f222]/40 bg-[#e4f222]/5 text-white" : "border-zinc-800 bg-zinc-900 text-zinc-400"}`}>
                      <div className="mb-2 h-10 rounded bg-gradient-to-br from-zinc-700 to-zinc-900" />
                      {name}
                    </div>
                  ))}
                </div>
              </>
            )}

            {index === 1 && (
              <div className="flex w-full max-w-[440px] items-center gap-2">
                {["entrance_hall", "art_studio", "hotel_room"].map((name, i) => (
                  <div
                    key={name}
                    className={`h-24 flex-1 rounded-lg border bg-cover bg-center transition-all duration-500 ${i === 1 ? "border-[#e4f222]/60 brightness-100" : "border-zinc-700 brightness-75"}`}
                    style={{ backgroundImage: `url(/media/thumbnails/${name}.jpg)` }}
                  />
                ))}
              </div>
            )}

            {index === 2 && (
              <div className="relative h-28 w-full max-w-[440px] overflow-hidden rounded-lg border border-zinc-700 bg-cover bg-center" style={{ backgroundImage: "url(/media/thumbnails/art_studio.jpg)" }}>
                <span className="absolute left-[28%] top-[42%] size-4 animate-pulse rounded-full border-2 border-white bg-[#e4f222] shadow-[0_0_0_8px_rgba(228,242,34,.18)]" />
                <span className="absolute left-[58%] top-[62%] size-3 rounded-full border-2 border-white bg-sky-400" />
                <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[9px] text-white">Klik panorama untuk menaruh hotspot</span>
              </div>
            )}

            {index === 3 && (
              <div className="w-full max-w-[440px] rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                <div className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] text-zinc-200">
                  <span className="size-1.5 animate-pulse rounded-full bg-[#27a644]" />
                  virtour360.app/#/p/gallery-a1b2c3
                </div>
                <div className="mt-2 flex items-center gap-2 text-[9px] text-zinc-500">
                  <span className="flex items-center gap-1 rounded-full bg-[#27a644]/15 px-2 py-0.5 text-[#5fd486]"><Check size={10} /> Tersalin</span>
                  <span>QR siap dipindai</span><span>Embed iframe siap</span>
                </div>
              </div>
            )}

            <p className="text-center text-[10px] text-zinc-500">{step.detail}</p>
          </div>
        ))}
        <div className="absolute bottom-0 left-0 h-0.5 bg-[#e4f222] transition-all duration-500" style={{ width: `${((active + 1) / STEPS.length) * 100}%` }} />
      </div>
    </div>
  )
}
