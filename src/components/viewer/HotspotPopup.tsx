import {
  ArrowUpRight,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  MapPin,
  Music2,
  Package,
  Play,
  Video,
  X,
} from "lucide-react"
import { hotspotKindLabels, type Hotspot } from "../../types/tour"

interface HotspotPopupProps {
  spot: Hotspot
  onClose: () => void
}

const kindIcon = {
  point: MapPin,
  chevron: ArrowUpRight,
  image: ImageIcon,
  article: FileText,
  video: Video,
  sound: Music2,
  link: Link2,
  compact: MapPin,
  product: Package,
} as const

export function HotspotPopup({ spot, onClose }: HotspotPopupProps) {
  const kind = spot.kind ?? (spot.type === "link" ? "link" : spot.type === "scene" ? "chevron" : "point")
  const Icon = kindIcon[kind]
  const needsMedia = kind === "image" || kind === "video" || kind === "sound"

  return (
    <div className="pointer-events-auto absolute left-1/2 top-1/2 z-[70] w-[min(360px,90%)] -translate-x-1/2 -translate-y-1/2 animate-fade-up overflow-hidden rounded-2xl border border-white/15 bg-zinc-900/95 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-white/10 p-4">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full"
          style={{ background: spot.style?.color ?? "#facc15", color: "#09090b" }}
        >
          <Icon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{spot.title || hotspotKindLabels[kind]}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">{hotspotKindLabels[kind]}</p>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white" aria-label="Tutup popup"><X size={15} /></button>
      </div>

      {/* Konten */}
      <div className="max-h-[55vh] overflow-y-auto p-4 text-xs leading-relaxed text-zinc-300">
        {kind === "image" && (
          spot.mediaUrl ? (
            <img src={spot.mediaUrl} alt={spot.title} className="w-full rounded-lg object-cover" />
          ) : (
            <div className="grid h-36 place-items-center rounded-lg border border-dashed border-zinc-700 text-[11px] text-zinc-500">
              <span className="flex flex-col items-center gap-1"><ImageIcon size={20} /> Belum ada gambar. Isi Media URL di panel Hotspot.</span>
            </div>
          )
        )}

        {kind === "video" && (
          spot.mediaUrl ? (
            <video src={spot.mediaUrl} controls playsInline className="w-full rounded-lg bg-black" />
          ) : (
            <div className="grid h-36 place-items-center rounded-lg border border-dashed border-zinc-700 text-[11px] text-zinc-500">
              <span className="flex flex-col items-center gap-1"><Play size={20} /> Belum ada video. Isi Media URL di panel Hotspot.</span>
            </div>
          )
        )}

        {kind === "sound" && (
          <div className="flex flex-col gap-3">
            <div className="grid size-14 place-items-center rounded-full bg-sky-500/15 text-sky-300"><Music2 size={24} /></div>
            {spot.mediaUrl ? (
              <audio src={spot.mediaUrl} controls className="w-full" />
            ) : (
              <p className="text-[11px] text-zinc-500">Belum ada audio. Isi Media URL di panel Hotspot.</p>
            )}
          </div>
        )}

        {kind === "product" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-white">{spot.price || "Rp 0"}</span>
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] text-amber-300">Produk</span>
            </div>
            <a
              href={spot.ctaHref || "#"}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 items-center justify-center gap-2 rounded-lg bg-white text-xs font-semibold text-black hover:bg-zinc-200"
            >
              <ExternalLink size={13} /> {spot.ctaLabel || "Beli sekarang"}
            </a>
          </div>
        )}

        {kind === "link" && (
          <a
            href={spot.href || "#"}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 items-center justify-center gap-2 rounded-lg bg-sky-500 text-xs font-semibold text-white hover:bg-sky-400"
          >
            <ExternalLink size={13} /> Buka tautan
          </a>
        )}

        {kind === "chevron" && (
          <p className="text-[11px] text-zinc-400">
            {spot.targetSceneId ? "Hotspot navigasi ke scene lain." : "Navigasi belum diatur. Pilih scene tujuan di panel Hotspot."}
          </p>
        )}

        {(spot.description || needsMedia || kind === "article" || kind === "point" || kind === "compact") && (
          <p className={`whitespace-pre-line ${kind === "article" ? "text-[13px] leading-relaxed text-zinc-200" : "mt-3"} ${kind === "compact" ? "text-[11px] text-zinc-400" : ""}`}>
            {spot.description || (needsMedia ? "" : "Tidak ada deskripsi.")}
          </p>
        )}
      </div>
    </div>
  )
}
