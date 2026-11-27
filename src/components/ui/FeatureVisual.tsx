import { useEffect, useRef, useState } from "react"

type Kind = "posts" | "tours" | "publish"

const THUMBS = ["entrance_hall.jpg", "art_studio.jpg", "hotel_room.jpg", "ballroom.jpg"]
const NAMES = ["Atrium — The Gallery", "Studio — Creative Room", "Terrace — Sunset View", "Ballroom — Event Hall"]

/** Visual demo portofolio pengguna — berbeda dari stage Studio di atas. */
export function FeatureVisual({ kind, onLive, flip = false }: { kind: Kind; onLive?: () => void; flip?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const update = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const raw = (window.innerHeight - rect.top) / (window.innerHeight + rect.height)
      setProgress(Math.max(0, Math.min(1, raw)))
    }
    const scroller = ref.current?.closest("#home-root") ?? window
    update()
    scroller.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      scroller.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  const shift = (progress - 0.5) * -20

  return (
    <div
      ref={ref}
      className={`${flip ? "product-stage-flip" : "product-stage"} relative h-[280px] overflow-hidden rounded-lg bg-[#0f1011] sm:h-[300px]`}
      style={{ transform: `translateY(${shift}px)`, transition: "transform 120ms linear" }}
    >
      {kind === "posts" && (
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <span className="grid size-9 place-items-center rounded-full bg-[#23252a] text-[10px] text-white">TG</span>
            <div>
              <p className="text-[12px] text-white">The Gallery</p>
              <p className="font-[family-name:var(--font-mono)] text-[9px] text-[#62666d]">@ardhana · 8 post</p>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2 p-3 sm:grid-cols-4">
            {THUMBS.map((file, i) => (
              <button key={file} onClick={() => setActive(i)} className={`overflow-hidden rounded-md border text-left ${i === active ? "border-[#e4f222]/60" : "border-white/10"}`}>
                <img src={`/media/thumbnails/${file}`} alt="" className="h-16 w-full object-cover sm:h-20" />
                <p className="truncate px-1.5 py-1 text-[8px] text-[#8a8f98]">{NAMES[i].split(" — ")[0]}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {kind === "tours" && (
        <div className="flex h-full flex-col">
          <div className="relative min-h-[180px] flex-1 overflow-hidden">
            <div
              className="hero-360 absolute inset-[-10%]"
              style={{ backgroundImage: "url(/media/panoramas/layout_1.jpg)", backgroundSize: "auto 115%", backgroundPosition: "50% 50%" }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f1011] via-transparent to-transparent" />
            <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-[#08090a]/80 px-2 py-1 font-[family-name:var(--font-mono)] text-[9px] text-[#e4f222] backdrop-blur">
              layout_1.jpg → live studio
            </span>
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="text-[12px] text-white">Turn your 360 JPG into a live virtual tour</p>
              <div className="mt-2 flex gap-1.5">
                {["Scene", "Hotspot", "Publish"].map((label) => (
                  <span key={label} className="rounded-full border border-white/10 bg-[#08090a]/80 px-2 py-1 text-[9px] text-[#d0d6e0] backdrop-blur">{label}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
            <span className="font-[family-name:var(--font-mono)] text-[9px] text-[#62666d]">layout_1.jpg · 2.9 MB</span>
            <button onClick={onLive} className="cursor-pointer rounded-full bg-[#e4f222] px-2 py-1 text-[9px] font-medium text-[#08090a] hover:brightness-110">Live visual studio</button>
          </div>
        </div>
      )}

      {kind === "publish" && (
        <div className="relative h-full overflow-hidden">
          {/* Panorama sebagai latar — seluruh konten di atasnya */}
          <div
            className="hero-360 absolute inset-[-10%]"
            style={{ backgroundImage: `url(/media/panoramas/${THUMBS[active]})`, backgroundSize: "auto 115%", backgroundPosition: `${35 + active * 10}% 50%` }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f1011] via-[#0f1011]/30 to-transparent" />
          <div className="absolute inset-x-0 top-0 z-10 p-3">
            <span className="rounded-full border border-white/10 bg-[#08090a]/80 px-2 py-1 font-[family-name:var(--font-mono)] text-[9px] text-[#d0d6e0] backdrop-blur">
              {NAMES[active]}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate rounded-full bg-[#08090a]/80 px-2 py-1 font-[family-name:var(--font-mono)] text-[9px] text-[#e4f222] backdrop-blur">/p/ardhana/{NAMES[active].split(" — ")[0].toLowerCase()}</span>
              <span className="rounded-full bg-[#e4f222] px-2 py-1 text-[9px] font-medium text-[#08090a]">Dipublikasi</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["360°", "Embed", "QR"].map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-[#08090a]/70 px-2 py-1 text-[9px] text-[#d0d6e0] backdrop-blur">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
