import { useEffect, useState } from "react"
import { Info, Link2, MapPin, Music2, Play, ShoppingBag } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const EXAMPLES: { type: string; label: string; detail: string; Icon: LucideIcon; left: string; top: string }[] = [
  { type: "Point", label: "Info", detail: "Catatan singkat tentang objek di panorama.", Icon: MapPin, left: "31%", top: "44%" },
  { type: "Article", label: "Artikel", detail: "Teks panjang dan gambar dalam satu popup.", Icon: Info, left: "54%", top: "58%" },
  { type: "Video", label: "Video", detail: "Putar klip langsung di dalam tour.", Icon: Play, left: "72%", top: "38%" },
  { type: "Sound", label: "Audio", detail: "Narasi atau ambience dengan kontrol suara.", Icon: Music2, left: "44%", top: "68%" },
  { type: "Product", label: "Produk", detail: "Foto, harga, dan tombol beli.", Icon: ShoppingBag, left: "62%", top: "30%" },
  { type: "Link", label: "Tautan", detail: "Buka halaman eksternal di tab baru.", Icon: Link2, left: "20%", top: "68%" },
]

/** Contoh hotspot yang berdenyut + popup berganti, dipakai di Hotspot guide. */
export function HotspotDemo() {
  const [active, setActive] = useState(0)
  const example = EXAMPLES[active]

  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % EXAMPLES.length), 2400)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="relative h-[220px] overflow-hidden bg-cover bg-center sm:h-[260px]" style={{ backgroundImage: "url(/media/panoramas/art_studio.jpg)" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        {EXAMPLES.map((item, index) => (
          <button
            key={item.type}
            type="button"
            onClick={() => setActive(index)}
            title={item.type}
            aria-label={`Lihat contoh hotspot ${item.type}`}
            className={`absolute grid size-7 place-items-center rounded-full border-2 border-white transition-all duration-300 ${
              active === index ? "scale-110 bg-[#e4f222] text-[#08090a] shadow-[0_0_0_10px_rgba(228,242,34,.22)]" : "bg-black/50 text-white"
            }`}
            style={{ left: item.left, top: item.top }}
          >
            <item.Icon size={13} />
          </button>
        ))}

        <div key={example.type} className="absolute bottom-3 left-3 right-3 mx-auto max-w-[330px] animate-fade-up rounded-lg border border-white/15 bg-black/75 p-3 backdrop-blur-md sm:left-6 sm:right-auto">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-[#e4f222] text-[#08090a]"><example.Icon size={12} /></span>
            <span className="text-[11px] font-medium" style={{ color: "#ffffff" }}>{example.label}</span>
            <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[9px] text-white/70">{example.type}</span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-white/70">{example.detail}</p>
        </div>
        <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/50 px-2 py-1 font-[family-name:var(--font-mono)] text-[9px] text-white/80">360° · klik titik</span>
      </div>
      <div className="flex flex-wrap gap-1.5 p-3">
        {EXAMPLES.map((item, index) => (
          <button
            key={item.type}
            type="button"
            onClick={() => setActive(index)}
            className={`rounded-full border px-2.5 py-1 text-[10px] transition-colors ${
              active === index ? "border-[#e4f222]/40 bg-[#e4f222]/10 text-[#f7f8f8]" : "border-white/10 text-[#8a8f98] hover:border-white/25"
            }`}
          >
            {item.type}
          </button>
        ))}
      </div>
    </div>
  )
}
