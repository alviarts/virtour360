import { useState } from "react"

const SCENES = [
  { name: "Atrium — The Gallery", slug: "atrium", image: "/media/thumbnails/entrance_hall.jpg", panorama: "/media/panoramas/entrance_hall.jpg" },
  { name: "Studio — Creative Room", slug: "studio", image: "/media/thumbnails/art_studio.jpg", panorama: "/media/panoramas/art_studio.jpg" },
  { name: "Terrace — Sunset View", slug: "terrace", image: "/media/thumbnails/hotel_room.jpg", panorama: "/media/panoramas/hotel_room.jpg" },
  { name: "Ballroom — Event Hall", slug: "ballroom", image: "/media/thumbnails/ballroom.jpg", panorama: "/media/panoramas/ballroom.jpg" },
]

/** Tampilan Studio Virtour360 — sidebar scene, viewer, inspector. */
export function TourStage() {
  const [active, setActive] = useState(0)
  const scene = SCENES[active]
  return (
    <div className="grid h-[420px] grid-cols-[104px_1fr] overflow-hidden rounded-lg bg-[#090a0b] sm:h-[520px] sm:grid-cols-[200px_1fr_240px]">
      {/* Sidebar scene */}
      <div className="flex flex-col border-r border-white/10 bg-[#0f1011] p-2">
        <div className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-white text-[10px] font-medium text-[#08090a]">
          <span className="text-sm leading-none">+</span> Create
        </div>
        <p className="mt-3 px-1 font-[family-name:var(--font-mono)] text-[9px] text-[#62666d]">Uncategory · 4</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {SCENES.map((item, i) => (
            <button
              key={item.name}
              onClick={() => setActive(i)}
              title={`Pindah ke ${item.name}`}
              className={`flex items-center gap-1.5 rounded-md border p-1 text-left transition-colors ${i === active ? "border-[#e4f222]/60" : "border-white/10 hover:border-white/30"}`}
            >
              <img src={item.image} alt="" className="size-7 shrink-0 rounded object-cover sm:size-9" />
              <span className={`hidden min-w-0 flex-1 truncate text-[9px] sm:block ${i === active ? "text-[#f7f8f8]" : "text-[#8a8f98]"}`}>{item.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-auto rounded-md border border-dashed border-white/15 py-1.5 text-center text-[9px] text-[#62666d]">+ Add Scene</div>
      </div>

      {/* Viewer */}
      <div className="relative overflow-hidden bg-[#101112]">
        <div
          className="tour-pano hero-360 absolute -bottom-[8%] -left-[12%] -right-[30%] -top-[8%]"
          style={{ backgroundImage: `url(${scene.panorama})` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090a0b]/80 to-transparent" />
        <span className="absolute left-2 top-2 rounded border border-white/10 bg-[#08090a]/80 px-2 py-1 font-[family-name:var(--font-mono)] text-[9px] text-[#d0d6e0] backdrop-blur">{scene.name} · 4 hotspot</span>
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {["Hotspot", "Media", "Polygon", "Default view"].map((label) => (
            <span key={label} className="rounded-full border border-white/10 bg-[#08090a]/85 px-2 py-1 text-[9px] text-[#d0d6e0] backdrop-blur">{label}</span>
          ))}
        </div>
      </div>

      {/* Inspector */}
      <div className="hidden flex-col gap-2 border-l border-white/10 bg-[#0f1011] p-3 sm:flex">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[10px]">
          <span className="text-[#f7f8f8]">Scene</span>
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-[#8a8f98]">Info</span>
        </div>
        {[
          ["Title", scene.name],
          ["Slug", scene.slug],
          ["Initial view", "0° / 0°"],
        ].map(([label, value]) => (
          <div key={label} className="rounded border border-white/10 px-2 py-1.5">
            <p className="font-[family-name:var(--font-mono)] text-[8px] text-[#62666d]">{label}</p>
            <p className="mt-0.5 truncate text-[10px] text-[#d0d6e0]">{value}</p>
          </div>
        ))}
        <div className="flex items-center justify-between rounded border border-white/10 px-2 py-1.5 text-[9px] text-[#d0d6e0]">
          Nadir badge <span className="size-3 rounded-full bg-[#e4f222]" />
        </div>
        <div className="mt-auto rounded bg-[#e4f222] py-1.5 text-center text-[10px] font-medium text-[#08090a]">Publish sekarang</div>
      </div>
    </div>
  )
}
