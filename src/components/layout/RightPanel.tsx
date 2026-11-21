import { useEffect, useState, type ReactNode } from "react"
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
  Music2,
  Plus,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react"
import { theme } from "../../config/theme"
import { profile } from "../../data/profile"
import type { Hotspot, Scene } from "../../types/tour"
import { AccordionSection } from "../ui/AccordionSection"
import { Badge } from "../ui/Badge"
import { useApp } from "../../context/AppContext"
import { defaultEffects, effectPresets, type SceneEffects } from "../../lib/effects"

type Tab = "scene" | "hotspot" | "location"

interface RightPanelProps {
  scene: Scene
  scenes: Scene[]
  selectedHotspot: Hotspot | null
  onClearHotspot: () => void
  onSelectHotspot: (id: string) => void
  onGoToScene: (id: string) => void
  onUpdateHotspot: (id: string, patch: Partial<Hotspot>) => void
  onRemoveHotspot: (id: string) => void
  onAddHotspot: () => void
  onCaptureThumbnail: () => void
  onExpandThumbnail: () => void
  onSelectPost: () => void
  onReplace: () => void
  onUploadAudio: () => void
  onRemoveAudio: () => void
  audioName?: string
}

function Field({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-lg border border-zinc-700 bg-transparent px-2.5 transition-colors focus-within:border-zinc-500">
      <span className="text-zinc-500">{icon}</span>
      <input
        readOnly
        value={value}
        title="Informasi scene (ubah melalui panel pengaturan proyek)"
        className="min-w-0 flex-1 bg-transparent text-xs text-zinc-100 outline-none placeholder:text-zinc-600"
      />
    </div>
  )
}

function ActionButton({
  children,
  icon,
  onClick,
  disabled,
  title,
}: {
  children: ReactNode
  icon?: ReactNode
  onClick?: () => void
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-white text-xs font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
    >
      {icon}
      {children}
    </button>
  )
}

function EffectSlider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-[10px] text-zinc-500">
      <span className="flex items-center justify-between">
        <span>{label}</span>
        <span className="font-mono text-zinc-300">{value}{suffix}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer accent-amber-400"
      />
    </label>
  )
}

export function RightPanel({
  scene,
  scenes,
  selectedHotspot,
  onClearHotspot,
  onSelectHotspot,
  onGoToScene,
  onUpdateHotspot,
  onRemoveHotspot,
  onAddHotspot,
  onCaptureThumbnail,
  onExpandThumbnail,
  onSelectPost,
  onReplace,
  onUploadAudio,
  onRemoveAudio,
  audioName,
}: RightPanelProps) {
  const { effectsByScene, setSceneEffects, resetSceneEffects, notify } = useApp()
  const effects = effectsByScene[scene.id] ?? defaultEffects
  const patchEffects = (patch: Partial<SceneEffects>) => setSceneEffects(scene.id, patch)

  const [tab, setTab] = useState<Tab>("scene")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [href, setHref] = useState("")

  useEffect(() => {
    setTitle(selectedHotspot?.title ?? "")
    setDescription(selectedHotspot?.description ?? "")
    setHref(selectedHotspot?.href ?? "")
  }, [selectedHotspot?.id, selectedHotspot?.title, selectedHotspot?.description, selectedHotspot?.href])

  const tabs: { id: Tab; label: string }[] = [
    { id: "scene", label: "Scene" },
    { id: "hotspot", label: "Hotspot" },
    { id: "location", label: "Location" },
  ]

  const saveHotspot = () => {
    if (!selectedHotspot) return
    onUpdateHotspot(selectedHotspot.id, {
      title: title.trim() || "Hotspot",
      description: description.trim(),
      ...(selectedHotspot.type === "link" ? { href: href.trim() } : {}),
    })
  }

  return (
    <aside
      className="fixed bottom-0 right-0 top-14 z-20 flex flex-col bg-zinc-900"
      style={{ width: theme.size.inspector }}
    >
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
              {item.id === "hotspot" && <span className="text-[10px] text-zinc-500">{scene.hotspots.length}</span>}
            </button>
          ))}
        </div>
      </div>

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
                  <button onClick={onCaptureThumbnail} className="grid size-7 place-items-center rounded text-zinc-400 hover:bg-white/10 hover:text-white" title="Jadikan panorama aktif sebagai thumbnail">
                    <Camera size={14} />
                  </button>
                  <button onClick={onExpandThumbnail} className="grid size-7 place-items-center rounded text-zinc-400 hover:bg-white/10 hover:text-white" title="Perbesar thumbnail">
                    <Maximize2 size={13} />
                  </button>
                </div>

                <button onClick={onReplace} className="flex h-9 items-center justify-end px-2 text-xs font-medium text-zinc-50 hover:text-white" title="Unggah gambar pengganti untuk scene ini">
                  Replace
                </button>

                <button onClick={onSelectPost} className="flex h-10 w-full items-center gap-2 rounded-lg border border-zinc-700 px-2.5 text-left transition-colors hover:border-zinc-500">
                  <ImageIcon size={14} className="text-zinc-500" />
                  <span className="text-xs text-zinc-400">Select post</span>
                </button>

                {audioName ? (
                  <div className="flex h-10 items-center gap-2 rounded-lg border border-zinc-700 px-2.5">
                    <Music2 size={14} className="shrink-0 text-sky-400" />
                    <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300" title={audioName}>{audioName}</span>
                    <button onClick={onRemoveAudio} title="Hapus audio" className="grid size-6 place-items-center rounded text-zinc-500 hover:bg-white/10 hover:text-red-400">
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <ActionButton icon={<Upload size={13} />} onClick={onUploadAudio}>
                    Upload file .mp3
                  </ActionButton>
                )}
              </div>
            </AccordionSection>

            <AccordionSection title="Levelling">
              <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
                Luruskan panorama yang miring. Utara / yaw tidak berubah.
              </p>
              <div className="flex flex-col gap-3">
                <EffectSlider label="Roll" value={effects.roll} min={-20} max={20} suffix="°" onChange={(roll) => patchEffects({ roll })} />
                <ActionButton onClick={() => { patchEffects({ roll: 0 }); notify("Scene berhasil diratakan.") }}>Level this scene</ActionButton>
              </div>
            </AccordionSection>

            <AccordionSection title="Nadir">
              <label className="flex items-center gap-2 text-[11px] text-zinc-400">
                <input type="checkbox" checked={effects.nadir} onChange={(e) => patchEffects({ nadir: e.target.checked })} className="accent-amber-400" />
                Tampilkan penutup nadir
              </label>
            </AccordionSection>

            <AccordionSection title="Quick Fix">
              <p className="mb-2 text-[11px] text-zinc-500">Preset koreksi cepat.</p>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.entries(effectPresets)
                  .filter(([key]) => key !== "dusk")
                  .map(([key, preset]) => (
                    <button key={key} onClick={() => patchEffects(preset)} className="rounded-md border border-zinc-700 py-1.5 text-[10px] capitalize text-zinc-300 hover:border-zinc-500 hover:text-white">
                      {key}
                    </button>
                  ))}
              </div>
            </AccordionSection>

            <AccordionSection title="Custom Fix">
              <div className="flex flex-col gap-3">
                <EffectSlider label="Brightness" value={effects.brightness} min={50} max={150} suffix="%" onChange={(brightness) => patchEffects({ brightness })} />
                <EffectSlider label="Contrast" value={effects.contrast} min={50} max={150} suffix="%" onChange={(contrast) => patchEffects({ contrast })} />
                <EffectSlider label="Saturation" value={effects.saturate} min={0} max={200} suffix="%" onChange={(saturate) => patchEffects({ saturate })} />
              </div>
            </AccordionSection>

            <AccordionSection title="Staging Day To Dusk">
              <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">Ubah suasana siang menjadi senja.</p>
              <ActionButton onClick={() => patchEffects(effectPresets.dusk)}>Terapkan senja</ActionButton>
            </AccordionSection>

            <AccordionSection title="Filter Processing">
              <div className="flex flex-col gap-3">
                <EffectSlider label="Hue" value={effects.hue} min={-180} max={180} suffix="°" onChange={(hue) => patchEffects({ hue })} />
                <EffectSlider label="Grayscale" value={effects.grayscale} min={0} max={100} suffix="%" onChange={(grayscale) => patchEffects({ grayscale })} />
                <EffectSlider label="Sepia" value={effects.sepia} min={0} max={100} suffix="%" onChange={(sepia) => patchEffects({ sepia })} />
              </div>
            </AccordionSection>

            <AccordionSection title="Sun light">
              <div className="flex flex-col gap-3">
                <EffectSlider label="Brightness" value={effects.brightness} min={50} max={150} suffix="%" onChange={(brightness) => patchEffects({ brightness })} />
                <div className="grid grid-cols-2 gap-1.5">
                  <button onClick={() => patchEffects(effectPresets.warm)} className="rounded-md border border-zinc-700 py-1.5 text-[10px] text-zinc-300 hover:border-zinc-500">Hangat</button>
                  <button onClick={() => patchEffects(effectPresets.cool)} className="rounded-md border border-zinc-700 py-1.5 text-[10px] text-zinc-300 hover:border-zinc-500">Dingin</button>
                </div>
                <button onClick={() => { resetSceneEffects(scene.id); notify("Efek scene dikembalikan ke awal.") }} className="text-[10px] text-zinc-500 hover:text-zinc-300">Reset semua efek</button>
              </div>
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
            <ActionButton icon={<Plus size={13} />} onClick={onAddHotspot} title="Tambah hotspot di tengah tampilan">
              Tambah hotspot
            </ActionButton>

            {selectedHotspot ? (
              <div className="mt-3 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-black/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-100">Edit hotspot</span>
                  <div className="flex items-center gap-1.5">
                    <Badge tone={selectedHotspot.type === "scene" ? "blue" : "amber"}>{selectedHotspot.type}</Badge>
                    <button onClick={() => { onRemoveHotspot(selectedHotspot.id); onClearHotspot() }} title="Hapus hotspot" className="text-zinc-500 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                    <button onClick={onClearHotspot} title="Tutup" className="text-zinc-500 hover:text-zinc-200">
                      <X size={13} />
                    </button>
                  </div>
                </div>

                <label className="flex flex-col gap-1 text-[10px] text-zinc-500">
                  Jenis hotspot
                  <select
                    value={selectedHotspot.type}
                    onChange={(e) => onUpdateHotspot(selectedHotspot.id, { type: e.target.value as Hotspot["type"] })}
                    className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-[11px] text-zinc-100 outline-none focus:border-zinc-500"
                  >
                    <option value="info">Info</option>
                    <option value="project">Karya</option>
                    <option value="scene">Pindah ke layer</option>
                    <option value="link">Tautan</option>
                  </select>
                </label>

                {selectedHotspot.type === "scene" && scenes.length > 1 && (
                  <button
                    onClick={() => {
                      const index = scenes.findIndex((s) => s.id === scene.id)
                      const next = scenes[(index + 1) % scenes.length]
                      onUpdateHotspot(selectedHotspot.id, { targetSceneId: next.id })
                    }}
                    className="flex h-8 items-center justify-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 text-[11px] font-medium text-sky-300 hover:bg-sky-500/20"
                  >
                    <ArrowUpRight size={12} /> Set ke layer berikutnya
                  </button>
                )}

                <label className="flex flex-col gap-1 text-[10px] text-zinc-500">
                  Judul
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-[11px] text-zinc-100 outline-none focus:border-zinc-500"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[10px] text-zinc-500">
                  Deskripsi
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-[11px] leading-relaxed text-zinc-100 outline-none focus:border-zinc-500"
                  />
                </label>
                {selectedHotspot.type === "link" && (
                  <label className="flex flex-col gap-1 text-[10px] text-zinc-500">
                    URL tautan
                    <input
                      value={href}
                      onChange={(e) => setHref(e.target.value)}
                      placeholder="https://…"
                      className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-[11px] text-zinc-100 outline-none focus:border-zinc-500"
                    />
                  </label>
                )}
                {selectedHotspot.type === "scene" && (
                  <label className="flex flex-col gap-1 text-[10px] text-zinc-500">
                    Scene tujuan
                    <select
                      value={selectedHotspot.targetSceneId ?? ""}
                      onChange={(e) => onUpdateHotspot(selectedHotspot.id, { targetSceneId: e.target.value })}
                      className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-[11px] text-zinc-100 outline-none focus:border-zinc-500"
                    >
                      {scenes.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="flex gap-2 font-mono text-[10px] text-zinc-500">
                  <span>yaw {selectedHotspot.yaw}</span>
                  <span>pitch {selectedHotspot.pitch}</span>
                </div>

                <button onClick={saveHotspot} className="h-8 rounded-lg bg-white text-[11px] font-semibold text-black hover:bg-zinc-200">
                  Simpan perubahan
                </button>

                {selectedHotspot.type === "scene" && selectedHotspot.targetSceneId && (
                  <button
                    onClick={() => onGoToScene(selectedHotspot.targetSceneId!)}
                    className="flex h-8 items-center justify-center gap-2 rounded-lg border border-zinc-700 text-[11px] text-zinc-200 hover:bg-white/5"
                  >
                    Kunjungi scene <ArrowUpRight size={12} />
                  </button>
                )}
                {selectedHotspot.type === "link" && selectedHotspot.href && (
                  <a
                    href={selectedHotspot.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 items-center justify-center gap-2 rounded-lg border border-zinc-700 text-[11px] text-zinc-200 hover:bg-white/5"
                  >
                    Buka tautan <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ) : (
              <div className="mt-3 flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-black/40 px-4 py-8 text-center">
                <span className="size-3 rounded-full bg-pink-500 shadow-[0_0_14px_rgba(236,72,153,0.9)]" />
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Pilih hotspot pada panorama, atau tambah hotspot baru lalu atur judul dan deskripsinya di sini.
                </p>
                <MousePointerClick size={18} className="text-zinc-700" />
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2">
              {scene.hotspots.map((spot) => (
                <div key={spot.id} className="flex items-center gap-1 rounded-lg border border-zinc-800 px-2.5 py-2 transition-colors hover:border-zinc-600">
                  <button onClick={() => onSelectHotspot(spot.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <span className="size-1.5 shrink-0 rounded-full bg-amber-400" />
                    <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300">{spot.title}</span>
                    <span className="font-mono text-[10px] text-zinc-600">{spot.yaw}</span>
                  </button>
                  <button
                    onClick={() => { onRemoveHotspot(spot.id); if (selectedHotspot?.id === spot.id) onClearHotspot() }}
                    title={`Hapus ${spot.title}`}
                    className="grid size-6 shrink-0 place-items-center rounded text-zinc-600 hover:bg-white/5 hover:text-red-400"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
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
              <a href={`mailto:${profile.email}`} className="flex items-center gap-2 hover:text-zinc-100"><Mail size={13} /> {profile.email}</a>
              <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-zinc-100"><ExternalLink size={13} /> {profile.website}</a>
            </div>
            <p className="text-[10px] leading-relaxed text-zinc-600">Lokasi bersifat informasi profil; tidak ada geotagging nyata pada panorama.</p>
          </div>
        )}
      </div>
    </aside>
  )
}
