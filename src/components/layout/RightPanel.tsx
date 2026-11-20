import { useState, type ReactNode } from "react"
import {
  ArrowUpRight,
  Camera,
  ExternalLink,
  Hash,
  Image as ImageIcon,
  Mail,
  MapPin,
  Maximize2,
  MousePointerClick,
  Sparkles,
  Type,
  Upload,
} from "lucide-react"
import { theme } from "../../config/theme"
import { profile } from "../../data/profile"
import type { Hotspot, Scene } from "../../types/tour"
import { AccordionSection } from "../ui/AccordionSection"
import { Badge } from "../ui/Badge"

type Tab = "scene" | "hotspot" | "location"

interface RightPanelProps {
  scene: Scene
  selectedHotspot: Hotspot | null
  onClearHotspot: () => void
  onGoToScene: (id: string) => void
}

function Field({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-transparent px-2.5 transition-colors focus-within:border-zinc-500">
      <span className="text-zinc-500">{icon}</span>
      <input
        readOnly
        value={value}
        className="min-w-0 flex-1 bg-transparent text-xs text-zinc-100 outline-none placeholder:text-zinc-600"
      />
    </div>
  )
}

function ActionButton({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <button className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-white text-xs font-medium text-black transition-colors hover:bg-zinc-200">
      {icon}
      {children}
    </button>
  )
}

export function RightPanel({ scene, selectedHotspot, onClearHotspot, onGoToScene }: RightPanelProps) {
  const [tab, setTab] = useState<Tab>("scene")

  const tabs: { id: Tab; label: string }[] = [
    { id: "scene", label: "Scene" },
    { id: "hotspot", label: "Hotspot" },
    { id: "location", label: "Location" },
  ]

  return (
    <aside
      className="fixed bottom-0 right-0 top-14 z-20 flex flex-col bg-zinc-900"
      style={{ width: theme.size.inspector }}
    >
      {/* Tab — header aksi berada di TopBar */}
      <div className="px-2 pt-2">
        <div className="flex rounded-lg border border-zinc-700 p-0.5">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex h-8 flex-1 items-center justify-center gap-1 rounded-md text-xs font-medium transition-colors ${
                tab === item.id ? "bg-zinc-700/70 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {item.label}
              {item.id === "hotspot" && (
                <span className="text-[10px] text-zinc-500">{scene.hotspots.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Konten */}
      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-24 pt-2">
        {tab === "scene" && (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
            <AccordionSection title="Config" defaultOpen>
              <div className="flex flex-col gap-2">
                <Field icon={<Type size={14} />} value={scene.name} />
                <Field icon={<Hash size={14} />} value={scene.id} />

                <div className="flex h-10 items-center gap-1 rounded-lg border border-zinc-700 px-1">
                  <img src={scene.thumbnail} alt="" className="size-8 rounded object-cover" />
                  <span className="min-w-0 flex-1 truncate text-xs text-zinc-300">Thumbnail</span>
                  <button className="grid size-7 place-items-center rounded text-zinc-400 hover:bg-white/10 hover:text-white" title="Ambil gambar">
                    <Camera size={14} />
                  </button>
                  <button className="grid size-7 place-items-center rounded text-zinc-400 hover:bg-white/10 hover:text-white" title="Perbesar">
                    <Maximize2 size={13} />
                  </button>
                </div>

                <button className="flex h-9 items-center justify-end px-2 text-xs font-medium text-zinc-50 hover:text-white">
                  Replace
                </button>

                <div className="flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-2.5">
                  <ImageIcon size={14} className="text-zinc-500" />
                  <span className="text-xs text-zinc-400">Select post</span>
                </div>

                <ActionButton icon={<Upload size={13} />}>Upload file .mp3</ActionButton>
              </div>
            </AccordionSection>

            <AccordionSection title="AI Edit 360">
              <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
                Hapus objek, tripod, atau orang, atau ubah area dengan prompt langsung pada gambar 360°.
              </p>
              <ActionButton icon={<Sparkles size={13} />}>AI Edit</ActionButton>
            </AccordionSection>

            <AccordionSection title="Levelling">
              <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
                Luruskan panorama yang miring. Utara / yaw tidak berubah.
              </p>
              <ActionButton>Level this scene</ActionButton>
            </AccordionSection>

            <AccordionSection title="Nadir">
              <p className="text-[11px] leading-relaxed text-zinc-500">Perbaiki bagian bawah panorama.</p>
            </AccordionSection>

            <AccordionSection title="Quick Fix">
              <p className="text-[11px] leading-relaxed text-zinc-500">Koreksi cepat pencahayaan dan warna.</p>
            </AccordionSection>

            <AccordionSection title="Custom Fix">
              <p className="text-[11px] leading-relaxed text-zinc-500">Penyesuaian manual exposure, contrast, dan white balance.</p>
            </AccordionSection>

            <AccordionSection title="Staging Day To Dusk">
              <p className="text-[11px] leading-relaxed text-zinc-500">Ubah suasana siang menjadi senja.</p>
            </AccordionSection>

            <AccordionSection title="Filter Processing">
              <p className="text-[11px] leading-relaxed text-zinc-500">Terapkan filter kreatif ke panorama.</p>
            </AccordionSection>

            <AccordionSection title="Sun light">
              <p className="text-[11px] leading-relaxed text-zinc-500">Sesuaikan arah dan intensitas cahaya matahari.</p>
            </AccordionSection>

            <AccordionSection title="View">
              <div className="flex flex-col gap-3 text-[11px] text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>Limit view</span>
                  <span className="font-mono text-zinc-300">-90 / 90 / -180 / 180</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Zoom limit</span>
                  <span className="font-mono text-zinc-300">60 / 150</span>
                </div>
              </div>
            </AccordionSection>
          </div>
        )}

        {tab === "hotspot" && (
          <div className="animate-fade-up">
            {selectedHotspot ? (
              <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-black/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-100">Detail hotspot</span>
                  <Badge tone={selectedHotspot.type === "scene" ? "blue" : "amber"}>
                    {selectedHotspot.type}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-white">{selectedHotspot.title}</h3>
                {selectedHotspot.description && (
                  <p className="text-[11px] leading-relaxed text-zinc-400">{selectedHotspot.description}</p>
                )}
                <div className="flex gap-2 font-mono text-[10px] text-zinc-500">
                  <span>yaw {selectedHotspot.yaw}</span>
                  <span>pitch {selectedHotspot.pitch}</span>
                </div>

                {selectedHotspot.type === "scene" && selectedHotspot.targetSceneId && (
                  <button
                    onClick={() => onGoToScene(selectedHotspot.targetSceneId!)}
                    className="flex h-9 items-center justify-center gap-2 rounded-lg bg-white text-xs font-medium text-black hover:bg-zinc-200"
                  >
                    Kunjungi scene
                    <ArrowUpRight size={13} />
                  </button>
                )}
                {selectedHotspot.type === "link" && selectedHotspot.href && (
                  <a
                    href={selectedHotspot.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-9 items-center justify-center gap-2 rounded-lg bg-white text-xs font-medium text-black hover:bg-zinc-200"
                  >
                    Buka tautan
                    <ExternalLink size={13} />
                  </a>
                )}
                <button onClick={onClearHotspot} className="text-[11px] text-zinc-500 hover:text-zinc-300">
                  Tutup
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-black/40 px-4 py-10 text-center">
                <span className="size-3 rounded-full bg-pink-500 shadow-[0_0_14px_rgba(236,72,153,0.9)]" />
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Pilih hotspot pada panorama untuk melihat detailnya.
                </p>
                <MousePointerClick size={18} className="text-zinc-700" />
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2">
              {scene.hotspots.map((spot) => (
                <button
                  key={spot.id}
                  onClick={() => onGoToScene(scene.id)}
                  className="flex items-center gap-2 rounded-lg border border-zinc-800 px-2.5 py-2 text-left transition-colors hover:border-zinc-600"
                >
                  <span className="size-1.5 rounded-full bg-amber-400" />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300">{spot.title}</span>
                  <span className="font-mono text-[10px] text-zinc-600">{spot.yaw}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "location" && (
          <div className="animate-fade-up flex flex-col gap-3">
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black/40">
              <div className="relative h-36 bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.18),transparent_60%),linear-gradient(#18181b,#09090b)]">
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(#3f3f46_1px,transparent_1px),linear-gradient(90deg,#3f3f46_1px,transparent_1px)] [background-size:24px_24px]" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <MapPin size={22} className="text-sky-400 drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
                </span>
              </div>
              <div className="p-3 text-xs text-zinc-300">{profile.location}</div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-black/40 p-3 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2"><Mail size={13} /> {profile.email}</div>
              <div className="flex items-center gap-2"><ExternalLink size={13} /> {profile.website}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
