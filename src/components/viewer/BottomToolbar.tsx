import { useState } from "react"
import { Camera, Eye, Maximize2, Minus, Plus, Sparkles } from "lucide-react"
import { formatAngle } from "../../lib/format"
import type { ViewState } from "../../hooks/useTourViewer"

interface BottomToolbarProps {
  view: ViewState
  isAutorotate: boolean
  onToggleAutorotate: () => void
  onAddHotspot: () => void
  onPickHotspot?: (label: string) => void
  onReset: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFullscreen: () => void
  isFullscreen: boolean
  onDraw?: () => void
  onUploadAudio?: () => void
}

export function BottomToolbar({
  view,
  isAutorotate,
  onToggleAutorotate,
  onAddHotspot,
  onPickHotspot,
  onReset,
  onZoomIn,
  onZoomOut,
  onFullscreen,
  isFullscreen,
  onDraw,
  onUploadAudio,
}: BottomToolbarProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const PICKER = ["Point", "Chevron", "Image", "Article", "Video", "Sound", "Link", "Compact", "Product"]

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center">
      <div className="hide-scrollbar pointer-events-auto flex max-w-full items-center gap-2 overflow-x-auto rounded-full bg-black/70 p-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={onToggleAutorotate}
          title="Putar otomatis"
          className={`flex h-8 items-center gap-2 rounded-full px-3 font-mono text-xs transition-colors ${
            isAutorotate ? "bg-amber-400 text-black" : "text-zinc-300 hover:bg-white/10"
          }`}
        >
          <Eye size={14} />
          {formatAngle(view.yaw)} {formatAngle(view.pitch)} {formatAngle(view.zoom)}
        </button>

        <span className="h-5 w-px bg-white/10" />

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (onPickHotspot) setPickerOpen((v) => !v)
              else onAddHotspot()
            }}
            className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-medium text-black transition-colors hover:bg-zinc-200"
          >
            <Plus size={13} strokeWidth={2.6} />
            Hotspot
          </button>
          {pickerOpen && onPickHotspot && (
            <div className="absolute bottom-10 left-1/2 z-20 w-40 -translate-x-1/2 animate-fade-up rounded-xl border border-zinc-700 bg-zinc-900 p-1.5 shadow-2xl">
              <p className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">Jenis hotspot</p>
              {PICKER.map((label) => (
                <button
                  key={label}
                  onClick={() => {
                    setPickerOpen(false)
                    onPickHotspot(label)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white"
                >
                  <span className="size-2 rounded-full bg-amber-400" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={onUploadAudio} title="Unggah audio untuk scene ini" className="flex h-8 items-center gap-1.5 rounded-full px-3 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white">
          <Sparkles size={13} />
          Media
        </button>
        <button type="button" onClick={onDraw} title="Klik panorama untuk menandai area proyek" className="hidden h-8 items-center gap-1.5 rounded-full px-3 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white md:flex">
          <Plus size={13} />
          Polygon
        </button>

        <span className="h-5 w-px bg-white/10" />

        <div className="hidden items-center gap-0.5 lg:flex">
          <button type="button" title="Perkecil" onClick={onZoomOut} className="grid size-8 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white">
            <Minus size={14} />
          </button>
          <button type="button" title="Perbesar" onClick={onZoomIn} className="grid size-8 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white">
            <Plus size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="flex h-8 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium text-zinc-100 transition-colors hover:bg-white/10"
        >
          <Camera size={14} />
          Default view
        </button>

        <button
          type="button"
          onClick={onFullscreen}
          title={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
          className="grid size-8 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  )
}
