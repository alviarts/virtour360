import { useState, type ReactNode } from "react"
import {
  Box,
  Check,
  ClipboardList,
  FileText,
  Globe,
  Image as ImageIcon,
  Languages,
  Map as MapIcon,
  MapPin,
  Megaphone,
  MessageSquare,
  MousePointer2,
  Package,
  Palette,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Shapes,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react"
import { useApp } from "../../context/useApp"
import {
  defaultStudioConfig,
  hotspotKinds,
  themePresets,
  type CmsItem,
  type HotspotDesign,
  type StudioConfig,
  type ThemeConfig,
} from "../../types/studio"

type GroupId = "design" | "cms" | "marketing" | "setting"

const designSections = [
  { id: "theme", label: "Theme", icon: Palette },
  { id: "hotspot", label: "Hotspot", icon: MousePointer2 },
  { id: "polygon", label: "Polygon", icon: Shapes },
  { id: "popup", label: "Popup", icon: MessageSquare },
  { id: "floorplan", label: "Floorplan", icon: MapIcon },
  { id: "googlemap", label: "Googlemap", icon: MapPin },
  { id: "form", label: "Form", icon: ClipboardList },
  { id: "cta", label: "Call To Action", icon: Megaphone },
  { id: "control", label: "Control Bar", icon: SlidersHorizontal },
  { id: "dollhouse", label: "Dollhouse", icon: Box },
]

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex items-start justify-between gap-3 py-2">
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] text-zinc-300">{label}</span>
        {hint && <span className="mt-0.5 block text-[10px] leading-snug text-zinc-600">{hint}</span>}
      </span>
      <span className="shrink-0">{children}</span>
    </label>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row label={label} hint={hint}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 cursor-pointer accent-sky-500"
      />
    </Row>
  )
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Row label={label}>
      <span className="flex items-center gap-1.5">
        <input
          type="color"
          value={value.startsWith("#") && value.length <= 7 ? value : "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="size-7 cursor-pointer rounded border border-zinc-700 bg-transparent"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-[10px] text-zinc-200 outline-none"
        />
      </span>
    </Row>
  )
}

function Text({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Row label={label}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-48 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-[11px] text-zinc-100 outline-none placeholder:text-zinc-600"
      />
    </Row>
  )
}

function Area({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="py-2">
      <span className="block text-[11px] text-zinc-300">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-1.5 w-full resize-y rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-[11px] text-zinc-100 outline-none placeholder:text-zinc-600"
      />
    </div>
  )
}

function Num({ label, value, min = 0, max = 100, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <Row label={label}>
      <span className="flex items-center gap-2">
        <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-28 accent-sky-500" />
        <span className="w-8 text-right font-mono text-[10px] text-zinc-400">{value}</span>
      </span>
    </Row>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <Row label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-40 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-[11px] text-zinc-100 outline-none"
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </Row>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
      <h3 className="border-b border-zinc-800 px-3 py-2 text-[11px] font-semibold text-zinc-200">{title}</h3>
      <div className="divide-y divide-zinc-800/60 px-3 pb-2">{children}</div>
    </section>
  )
}

export function DesignModal({ onClose }: { onClose: () => void }) {
  const { studioConfig, updateStudioConfig, resetStudioConfig, notify } = useApp()
  const [group, setGroup] = useState<GroupId>("design")
  const [section, setSection] = useState("theme")
  const c = studioConfig

  const patch = (value: Partial<StudioConfig>) => updateStudioConfig(value)
  const patchTheme = (value: Partial<ThemeConfig>) => patch({ theme: { ...c.theme, ...value } })
  const patchHotspot = <K extends keyof HotspotDesign>(key: K, value: HotspotDesign[K]) =>
    patch({ hotspot: { ...c.hotspot, [key]: value } })
  const patchLabel = (key: keyof HotspotDesign["label"], value: string | number | boolean) =>
    patchHotspot("label", { ...c.hotspot.label, [key]: value } as HotspotDesign["label"])
  const patchCms = (key: keyof StudioConfig["cms"], value: StudioConfig["cms"][typeof key]) =>
    patch({ cms: { ...c.cms, [key]: value } })

  const groups: { id: GroupId; label: string; icon: typeof Palette }[] = [
    { id: "design", label: "Design", icon: Palette },
    { id: "cms", label: "Content", icon: FileText },
    { id: "marketing", label: "Marketing", icon: Megaphone },
    { id: "setting", label: "Setting", icon: Settings },
  ]

  const renderDesign = () => {
    switch (section) {
      case "theme":
        return (
          <>
            <Card title="Theme Setup">
              <div className="py-3">
                <span className="block text-[11px] text-zinc-300">Preset tema</span>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {themePresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => patchTheme({ preset: preset.id, primaryColor: preset.primary, textColor: preset.text })}
                      className={`rounded-lg border p-2 text-center transition-colors ${
                        c.theme.preset === preset.id ? "border-sky-500 bg-sky-500/10" : "border-zinc-700 hover:border-zinc-500"
                      }`}
                    >
                      <span className="mx-auto mb-1.5 block h-5 w-full rounded" style={{ background: `linear-gradient(90deg, ${preset.primary} 60%, ${preset.text} 60%)` }} />
                      <span className="text-[10px] text-zinc-300">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Color label="Primary color" value={c.theme.primaryColor} onChange={(v) => patchTheme({ primaryColor: v })} />
              <Color label="Text color" value={c.theme.textColor} onChange={(v) => patchTheme({ textColor: v })} />
              <Select label="Primary Font" value={c.theme.primaryFont} options={["Inter", "Roboto", "Open Sans", "Poppins", "Georgia"]} onChange={(v) => patchTheme({ primaryFont: v })} />
              <Select label="Secondary Font" value={c.theme.secondaryFont} options={["Open Sans", "Inter", "Roboto", "Poppins", "Georgia"]} onChange={(v) => patchTheme({ secondaryFont: v })} />
              <Select label="Scene list position" value={c.theme.sceneListPosition} options={["left", "right"]} onChange={(v) => patchTheme({ sceneListPosition: v as ThemeConfig["sceneListPosition"] })} />
              <Toggle label="Hide Project Title" checked={c.theme.hideProjectTitle} onChange={(v) => patchTheme({ hideProjectTitle: v })} />
              <Toggle label="Hide Scene Title on Card Scene" checked={c.theme.hideSceneTitleOnCard} onChange={(v) => patchTheme({ hideSceneTitleOnCard: v })} />
              <Toggle label="Hide Scene Title" checked={c.theme.hideSceneTitle} onChange={(v) => patchTheme({ hideSceneTitle: v })} />
              <Toggle label="Auto open scene list" checked={c.theme.autoOpenSceneList} onChange={(v) => patchTheme({ autoOpenSceneList: v })} />
              <Toggle label="Show Scene Title in Scene List" checked={c.theme.showSceneTitleInList} onChange={(v) => patchTheme({ showSceneTitleInList: v })} />
            </Card>
          </>
        )
      case "hotspot":
        return (
          <>
            <Card title="General">
              <Toggle label="Lock Hotspot" checked={c.hotspot.lockHotspot} onChange={(v) => patchHotspot("lockHotspot", v)} />
              <Toggle label="Keep hotspot position when zooming" checked={c.hotspot.keepPositionOnZoom} onChange={(v) => patchHotspot("keepPositionOnZoom", v)} />
              <Toggle label="Hide title on top" checked={c.hotspot.hideTitleOnTop} onChange={(v) => patchHotspot("hideTitleOnTop", v)} />
              <Toggle label="Hide Preview Box (When Hovering)" checked={c.hotspot.hidePreviewBox} onChange={(v) => patchHotspot("hidePreviewBox", v)} />
              <Toggle label="Hide Title on Preview Box (When Hovering)" checked={c.hotspot.hideTitleOnPreview} onChange={(v) => patchHotspot("hideTitleOnPreview", v)} />
              <Select label="Article Hotspot Popup Size" value={c.hotspot.popupSize} options={["custom", "fixed"]} onChange={(v) => patchHotspot("popupSize", v as HotspotDesign["popupSize"])} />
              <Select label="Article Hotspot Popup Layout" value={c.hotspot.popupLayout} options={["Default", "Card", "Minimal", "Full"]} onChange={(v) => patchHotspot("popupLayout", v)} />
            </Card>
            <Card title="Chevron navigation">
              <Num label="Size" value={c.hotspot.chevronSize} min={1} max={5} onChange={(v) => patchHotspot("chevronSize", v)} />
              <Toggle label="Floating arrow (follows cursor)" checked={c.hotspot.floatingArrow} onChange={(v) => patchHotspot("floatingArrow", v)} />
              <Toggle label="Chevron arrows (on the floor)" checked={c.hotspot.chevronArrows} onChange={(v) => patchHotspot("chevronArrows", v)} />
              <Toggle label="Navigation circles" checked={c.hotspot.navigationCircles} onChange={(v) => patchHotspot("navigationCircles", v)} />
            </Card>
            <Card title="Symbol">
              <Color label="Background" value={c.hotspot.background} onChange={(v) => patchHotspot("background", v)} />
              <Color label="Icon color" value={c.hotspot.iconColor} onChange={(v) => patchHotspot("iconColor", v)} />
              {hotspotKinds.map((kind) => (
                <Text key={kind} label={kind} value={c.hotspot.icons[kind] ?? ""} onChange={(v) => patchHotspot("icons", { ...c.hotspot.icons, [kind]: v })} />
              ))}
            </Card>
            <Card title="Label">
              <Select label="Font Type" value={c.hotspot.label.fontType} options={["inherit", "Inter", "Roboto", "Georgia"]} onChange={(v) => patchLabel("fontType", v)} />
              <Num label="Font Size" value={c.hotspot.label.fontSize} min={8} max={32} onChange={(v) => patchLabel("fontSize", v)} />
              <Num label="Letter Spacing" value={c.hotspot.label.letterSpacing} min={-2} max={10} onChange={(v) => patchLabel("letterSpacing", v)} />
              <Num label="Spacing" value={c.hotspot.label.spacing} min={0} max={40} onChange={(v) => patchLabel("spacing", v)} />
              <Select label="Font Weight" value={c.hotspot.label.fontWeight} options={["400", "500", "600", "700", "800"]} onChange={(v) => patchLabel("fontWeight", v)} />
              <Num label="Padding X" value={c.hotspot.label.paddingX} min={0} max={40} onChange={(v) => patchLabel("paddingX", v)} />
              <Num label="Padding Y" value={c.hotspot.label.paddingY} min={0} max={40} onChange={(v) => patchLabel("paddingY", v)} />
              <Num label="Border Radius" value={c.hotspot.label.radius} min={0} max={40} onChange={(v) => patchLabel("radius", v)} />
              <Color label="Background" value={c.hotspot.label.background} onChange={(v) => patchLabel("background", v)} />
              <Color label="Text Color" value={c.hotspot.label.textColor} onChange={(v) => patchLabel("textColor", v)} />
              <Toggle label="Uppercase" checked={c.hotspot.label.uppercase} onChange={(v) => patchLabel("uppercase", v)} />
              <Toggle label="Italic" checked={c.hotspot.label.italic} onChange={(v) => patchLabel("italic", v)} />
              <Toggle label="Only show on hover" checked={c.hotspot.label.onlyOnHover} onChange={(v) => patchLabel("onlyOnHover", v)} />
            </Card>
            <Card title="Hotspot Distort">
              {hotspotKinds.map((kind) => (
                <Toggle key={kind} label={kind} checked={!!c.hotspot.distort[kind]} onChange={(v) => patchHotspot("distort", { ...c.hotspot.distort, [kind]: v })} />
              ))}
            </Card>
          </>
        )
      case "polygon":
        return (
          <Card title="Polygon Setup">
            <Color label="Background color" value={c.polygon.background} onChange={(v) => patch({ polygon: { ...c.polygon, background: v } })} />
            <Color label="Background color hover" value={c.polygon.backgroundHover} onChange={(v) => patch({ polygon: { ...c.polygon, backgroundHover: v } })} />
            <Color label="Border color" value={c.polygon.border} onChange={(v) => patch({ polygon: { ...c.polygon, border: v } })} />
            <Color label="Border color hover" value={c.polygon.borderHover} onChange={(v) => patch({ polygon: { ...c.polygon, borderHover: v } })} />
            <Num label="Border width" value={c.polygon.borderWidth} min={0} max={10} onChange={(v) => patch({ polygon: { ...c.polygon, borderWidth: v } })} />
          </Card>
        )
      case "popup":
        return (
          <Card title="Popup Setup">
            <Color label="Background color" value={c.popup.background} onChange={(v) => patch({ popup: { ...c.popup, background: v } })} />
            <Color label="Text color" value={c.popup.textColor} onChange={(v) => patch({ popup: { ...c.popup, textColor: v } })} />
          </Card>
        )
      case "floorplan":
        return (
          <Card title="Floorplan">
            <Toggle label="Show on start" checked={c.floorplan.showOnStart} onChange={(v) => patch({ floorplan: { ...c.floorplan, showOnStart: v } })} />
            <Select label="Layout" value={c.floorplan.layout} options={["box", "panel"]} onChange={(v) => patch({ floorplan: { ...c.floorplan, layout: v as typeof c.floorplan.layout } })} />
            <Select label="Position" value={c.floorplan.position} options={["left", "right"]} onChange={(v) => patch({ floorplan: { ...c.floorplan, position: v as typeof c.floorplan.position } })} />
            <Color label="Background color" value={c.floorplan.background} onChange={(v) => patch({ floorplan: { ...c.floorplan, background: v } })} />
            <Toggle label="Radar" checked={c.floorplan.radar} onChange={(v) => patch({ floorplan: { ...c.floorplan, radar: v } })} />
            <Color label="Marker background" value={c.floorplan.markerBackground} onChange={(v) => patch({ floorplan: { ...c.floorplan, markerBackground: v } })} />
            <Color label="Marker border" value={c.floorplan.markerBorder} onChange={(v) => patch({ floorplan: { ...c.floorplan, markerBorder: v } })} />
            <Text label="Image URL" value={c.floorplan.image} placeholder="/media/floorplan.png" onChange={(v) => patch({ floorplan: { ...c.floorplan, image: v } })} />
          </Card>
        )
      case "googlemap":
        return (
          <Card title="Google Map">
            <Toggle label="Map enabled" checked={c.googlemap.enabled} onChange={(v) => patch({ googlemap: { ...c.googlemap, enabled: v } })} />
            <Toggle label="Radar" checked={c.googlemap.radar} onChange={(v) => patch({ googlemap: { ...c.googlemap, radar: v } })} />
            <Text label="Marker image" value={c.googlemap.markerImage} onChange={(v) => patch({ googlemap: { ...c.googlemap, markerImage: v } })} />
            <Text label="Image when active" value={c.googlemap.markerActive} onChange={(v) => patch({ googlemap: { ...c.googlemap, markerActive: v } })} />
            <Num label="Width (px)" value={c.googlemap.width} min={120} max={600} onChange={(v) => patch({ googlemap: { ...c.googlemap, width: v } })} />
          </Card>
        )
      case "form":
        return (
          <Card title="Form Setup">
            <Select label="Layout" value={c.form.layout} options={["dialog", "panel"]} onChange={(v) => patch({ form: { ...c.form, layout: v as typeof c.form.layout } })} />
            <Color label="Background color" value={c.form.background} onChange={(v) => patch({ form: { ...c.form, background: v } })} />
            <Color label="Overlay color" value={c.form.overlay} onChange={(v) => patch({ form: { ...c.form, overlay: v } })} />
          </Card>
        )
      case "cta":
        return (
          <Card title="Call to Action Setup">
            <Toggle label="Tampilkan di viewer publik" checked={c.cta.enabled} onChange={(v) => patch({ cta: { ...c.cta, enabled: v } })} />
            <Select label="Layout" value={c.cta.layout} options={["bubble", "list"]} onChange={(v) => patch({ cta: { ...c.cta, layout: v as typeof c.cta.layout } })} />
            <Select label="Position" value={c.cta.position} options={["left", "right"]} onChange={(v) => patch({ cta: { ...c.cta, position: v as typeof c.cta.position } })} />
            <Num label="Offset" value={c.cta.offset} min={0} max={120} onChange={(v) => patch({ cta: { ...c.cta, offset: v } })} />
            <Text label="Title" value={c.cta.title} onChange={(v) => patch({ cta: { ...c.cta, title: v } })} />
            <Text label="Description" value={c.cta.description} onChange={(v) => patch({ cta: { ...c.cta, description: v } })} />
            <Text label="Link / mailto" value={c.cta.href} onChange={(v) => patch({ cta: { ...c.cta, href: v } })} />
          </Card>
        )
      case "control":
        return (
          <Card title="Control Bar">
            <Toggle label="Control bar when the tour opens" checked={c.controlBar.open} onChange={(v) => patch({ controlBar: { ...c.controlBar, open: v } })} />
            <Num label="Auto-minimize after (0 = off)" value={c.controlBar.autoMinimize} min={0} max={60} onChange={(v) => patch({ controlBar: { ...c.controlBar, autoMinimize: v } })} />
            <p className="py-2 text-[10px] leading-snug text-zinc-600">The bar minimizes after this long without touch, mouse or keyboard activity. Viewers can always open it again.</p>
            <div className="py-2">
              <span className="block text-[11px] text-zinc-300">Tersembunyi (comma separated)</span>
              <input
                value={c.controlBar.hidden.join(", ")}
                onChange={(e) => patch({ controlBar: { ...c.controlBar, hidden: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } })}
                className="mt-1.5 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-[11px] text-zinc-100 outline-none"
              />
            </div>
          </Card>
        )
      case "dollhouse":
        return (
          <Card title="Dollhouse Setup">
            <Toggle label="Disabled" checked={c.dollhouse.disabled} onChange={(v) => patch({ dollhouse: { ...c.dollhouse, disabled: v } })} />
            <Color label="Background color" value={c.dollhouse.background} onChange={(v) => patch({ dollhouse: { ...c.dollhouse, background: v } })} />
            <Color label="Hotspot color" value={c.dollhouse.hotspotColor} onChange={(v) => patch({ dollhouse: { ...c.dollhouse, hotspotColor: v } })} />
          </Card>
        )
      default:
        return null
    }
  }

  const cmsSections: { id: keyof StudioConfig["cms"]; label: string; icon: typeof FileText }[] = [
    { id: "posts", label: "Posts", icon: FileText },
    { id: "products", label: "Products", icon: Package },
    { id: "forms", label: "Forms", icon: ClipboardList },
    { id: "languages", label: "List Language", icon: Languages },
    { id: "translations", label: "List Translation", icon: Globe },
  ]
  const [cmsTab, setCmsTab] = useState("posts")

  const renderCms = () => {
    if (cmsTab === "languages") {
      return (
        <Card title="Bahasa yang tersedia">
          <Text label="Daftar bahasa (comma separated)" value={c.cms.languages.join(", ")} onChange={(v) => patchCms("languages", v.split(",").map((s) => s.trim()).filter(Boolean))} />
          <div className="flex flex-wrap gap-1.5 py-2">
            {c.cms.languages.map((lang) => (
              <button key={lang} onClick={() => patchCms("languages", c.cms.languages.filter((l) => l !== lang))} className="flex items-center gap-1 rounded-full border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300">
                {lang} <X size={10} />
              </button>
            ))}
          </div>
        </Card>
      )
    }
    if (cmsTab === "translations") {
      return (
        <Card title="Terjemahan">
          {(c.cms.languages.length ? c.cms.languages : ["id"]).map((lang) => (
            <Area
              key={lang}
              label={`${lang} — JSON key/value`}
              value={JSON.stringify(c.cms.translations[lang] ?? {}, null, 2)}
              onChange={(v) => {
                try { patchCms("translations", { ...c.cms.translations, [lang]: JSON.parse(v) }) }
                catch { /* biarkan sampai JSON valid */ }
              }}
              placeholder={'{"hello":"Halo"}  '}
            />
          ))}
        </Card>
      )
    }
    const key = cmsTab as "posts" | "products" | "forms"
    const items = c.cms[key]
    return (
      <Card title={`${cmsSections.find((s) => s.id === key)?.label ?? "Item"} — ${items.length} item`}>
        <div className="flex justify-end py-2">
          <button
            onClick={() => patchCms(key, [...items, { id: `${key}-${Date.now()}`, title: "Item baru", body: "", enabled: true }])}
            className="flex items-center gap-1 rounded bg-sky-500 px-2 py-1 text-[10px] font-semibold text-white"
          >
            <Plus size={11} /> Tambah
          </button>
        </div>
        {items.map((item: CmsItem) => (
          <div key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-2">
            <div className="flex items-center gap-2">
              <input value={item.title} onChange={(e) => patchCms(key, items.map((i) => i.id === item.id ? { ...i, title: e.target.value } : i))} className="min-w-0 flex-1 rounded border border-zinc-700 bg-transparent px-2 py-1 text-[11px] text-zinc-100 outline-none" />
              <button title="Aktif/nonaktif" onClick={() => patchCms(key, items.map((i) => i.id === item.id ? { ...i, enabled: !i.enabled } : i))} className={item.enabled ? "text-emerald-400" : "text-zinc-600"}>
                <Check size={14} />
              </button>
              <button title="Hapus" onClick={() => patchCms(key, items.filter((i) => i.id !== item.id))} className="text-zinc-500 hover:text-red-400"><Trash2 size={13} /></button>
            </div>
            <textarea value={item.body} onChange={(e) => patchCms(key, items.map((i) => i.id === item.id ? { ...i, body: e.target.value } : i))} rows={2} placeholder="Deskripsi / field" className="mt-2 w-full resize-y rounded border border-zinc-800 bg-transparent px-2 py-1 text-[10px] text-zinc-300 outline-none" />
          </div>
        ))}
      </Card>
    )
  }

  const renderMarketing = () => {
    const title = c.marketing.seoTitle || "aw"
    return (
      <>
        <Card title="SEO Preview">
          <div className="my-2 overflow-hidden rounded-lg border border-zinc-700">
            <div className="h-28 bg-gradient-to-br from-zinc-700 to-zinc-900" />
            <div className="bg-zinc-100 p-2 text-zinc-900">
              <p className="text-[10px] text-zinc-500">{typeof window === "undefined" ? "virtour360.app" : window.location.host}</p>
              <p className="text-xs font-semibold">{title}</p>
              <p className="mt-0.5 line-clamp-2 text-[10px] text-zinc-600">{c.marketing.seoDescription || "Start free to build high-quality & smart 360° Virtual Tour in minutes."}</p>
            </div>
          </div>
          <Text label="SEO Title" value={c.marketing.seoTitle} placeholder="Judul tour" onChange={(v) => patch({ marketing: { ...c.marketing, seoTitle: v } })} />
          <Area label="SEO Description" value={c.marketing.seoDescription} onChange={(v) => patch({ marketing: { ...c.marketing, seoDescription: v } })} />
          <Text label="SEO Image URL" value={c.marketing.seoImage} placeholder="/media/thumbnails/... " onChange={(v) => patch({ marketing: { ...c.marketing, seoImage: v } })} />
        </Card>
        <Card title="3 Optimize suggestion">
          {[
            { label: !c.marketing.seoTitle ? "Update SEO Title & Description" : "SEO Title & Description sudah diisi", done: !!c.marketing.seoTitle },
            { label: c.setting.copyrightAuthor === "Virtour360" ? "Copyright need more customized" : "Copyright sudah dikustomisasi", done: c.setting.copyrightAuthor !== "Virtour360" },
            { label: "You might need better slug", done: false },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 py-2 text-[11px] text-zinc-300">
              <span className={`size-3 rounded-full border ${s.done ? "border-emerald-400 bg-emerald-400" : "border-zinc-600"}`} />
              {s.label}
            </div>
          ))}
        </Card>
        <Card title="Lainnya">
          <Toggle label="Snapshot / SEO image aktif" checked={c.marketing.snapshotEnabled} onChange={(v) => patch({ marketing: { ...c.marketing, snapshotEnabled: v } })} />
          <Area label="Script Chats / embed script" value={c.marketing.scriptChats} placeholder="<!-- script chat -->" onChange={(v) => patch({ marketing: { ...c.marketing, scriptChats: v } })} />
        </Card>
      </>
    )
  }

  const renderSetting = () => (
    <>
      <Card title="Config">
        <Text label="Initial Scene" value={c.setting.initialScene} placeholder="atrium" onChange={(v) => patch({ setting: { ...c.setting, initialScene: v } })} />
        <Text label="Background Sound" value={c.setting.backgroundSound} placeholder="/media/audio.mp3" onChange={(v) => patch({ setting: { ...c.setting, backgroundSound: v } })} />
        <Text label="Location" value={c.setting.location} onChange={(v) => patch({ setting: { ...c.setting, location: v } })} />
        <Toggle label="Nadir aktif" checked={c.setting.copyrightEnabled} onChange={(v) => patch({ setting: { ...c.setting, copyrightEnabled: v } })} />
      </Card>
      <Card title="Multi-Language">
        <Toggle label="Aktifkan multi-language" checked={c.setting.multiLanguage} onChange={(v) => patch({ setting: { ...c.setting, multiLanguage: v } })} />
        <Text label="Bahasa (comma separated)" value={c.setting.languages.join(", ")} onChange={(v) => patch({ setting: { ...c.setting, languages: v.split(",").map((s) => s.trim()).filter(Boolean) } })} />
      </Card>
      <Card title="Copyright">
        <Toggle label="Enabled" checked={c.setting.copyrightEnabled} onChange={(v) => patch({ setting: { ...c.setting, copyrightEnabled: v } })} />
        <Text label="Link" value={c.setting.copyrightLink} onChange={(v) => patch({ setting: { ...c.setting, copyrightLink: v } })} />
        <Text label="Author name" value={c.setting.copyrightAuthor} onChange={(v) => patch({ setting: { ...c.setting, copyrightAuthor: v } })} />
        <Text label="Description" value={c.setting.copyrightDescription} onChange={(v) => patch({ setting: { ...c.setting, copyrightDescription: v } })} />
        <p className="py-2 text-[10px] leading-snug text-zinc-600">Ingin copyright sesuai brand Anda? Semua field di sini bebas diubah tanpa biaya tambahan.</p>
      </Card>
      <Card title="Branding & kolaborasi">
        <Text label="Logo URL" value={c.setting.logo} placeholder="/media/brand/logo.png" onChange={(v) => patch({ setting: { ...c.setting, logo: v } })} />
        <Area label="Popup Intro" value={c.setting.popupIntro} onChange={(v) => patch({ setting: { ...c.setting, popupIntro: v } })} />
        <Toggle label="Collaboration" checked={c.setting.collaboration} onChange={(v) => patch({ setting: { ...c.setting, collaboration: v } })} />
      </Card>
    </>
  )

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-3 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-[88vh] w-full max-w-5xl animate-fade-up overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar grup */}
        <nav className="flex w-44 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/60 p-2">
          <div className="flex items-center justify-between px-1 pb-3 pt-1">
            <span className="text-sm font-semibold text-white">Studio</span>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200" aria-label="Tutup"><X size={15} /></button>
          </div>
          {groups.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setGroup(item.id)}
                className={`mb-1 flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] transition-colors ${group === item.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50"}`}
              >
                <Icon size={14} /> {item.label}
              </button>
            )
          })}
          <div className="mt-auto border-t border-zinc-800 pt-2">
            <button
              onClick={() => { resetStudioConfig(); notify("Pengaturan studio dikembalikan ke default.") }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            >
              <RotateCcw size={13} /> Reset ke default
            </button>
            <button onClick={onClose} className="mt-2 w-full rounded-lg bg-white py-2 text-[11px] font-semibold text-black hover:bg-zinc-200">
              Selesai
            </button>
          </div>
        </nav>

        {/* Sub-nav Design/CMS */}
        {group === "design" && (
          <nav className="hide-scrollbar w-44 shrink-0 overflow-y-auto border-r border-zinc-800 p-2">
            {designSections.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] transition-colors ${section === item.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50"}`}
                >
                  <Icon size={13} /> {item.label}
                </button>
              )
            })}
          </nav>
        )}
        {group === "cms" && (
          <nav className="w-44 shrink-0 border-r border-zinc-800 p-2">
            {cmsSections.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setCmsTab(item.id)}
                  className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] transition-colors ${cmsTab === item.id ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50"}`}
                >
                  <Icon size={13} /> {item.label}
                </button>
              )
            })}
          </nav>
        )}

        {/* Konten */}
        <div className="hide-scrollbar min-w-0 flex-1 overflow-y-auto p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                {group === "design" ? "Design" : group === "cms" ? "CMS" : group === "marketing" ? "Marketing" : "Setting"}
              </h2>
              <p className="mt-0.5 text-[10px] text-zinc-500">Perubahan tersimpan otomatis dan ikut saat tour dipublish.</p>
            </div>
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400">
              <Check size={10} /> Tersimpan
            </span>
          </div>

          {group === "design" && renderDesign()}
          {group === "cms" && renderCms()}
          {group === "marketing" && renderMarketing()}
          {group === "setting" && renderSetting()}

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-[10px] text-zinc-500">
            <Search size={12} className="shrink-0" />
            <span>Tip: klik ikon <b className="text-zinc-300">Palette</b> di toolbar studio untuk membuka panel ini kapan saja.</span>
          </div>
        </div>

        {/* Preview samping */}
        <aside className="hidden w-52 shrink-0 border-l border-zinc-800 bg-zinc-950/40 p-3 xl:block">
          <p className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500"><ImageIcon size={11} /> Live preview</p>
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-white" style={{ borderTop: `4px solid ${c.theme.primaryColor}` }}>
            <div className="grid h-20 place-items-center bg-gradient-to-br from-zinc-700 to-zinc-900 text-lg font-bold text-white">
              {c.setting.logo ? <img src={c.setting.logo} alt="Logo" className="max-h-12" /> : "360°"}
            </div>
            <div className="p-2.5" style={{ color: c.theme.textColor }}>
              <p className="truncate text-xs font-bold">{c.marketing.seoTitle || "Judul Tour"}</p>
              <p className="mt-1 line-clamp-3 text-[9px] opacity-70">{c.marketing.seoDescription || "Deskripsi tour 360° Anda tampil di sini."}</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="rounded-full px-2 py-0.5 text-[8px] font-semibold text-white" style={{ background: c.theme.primaryColor }}>JELAJAHI</span>
                {c.floorplan.showOnStart && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] text-slate-600">Floorplan</span>}
                {c.googlemap.enabled && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] text-slate-600">Map</span>}
              </div>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-zinc-800 p-2">
            <p className="text-[9px] text-zinc-500">Info hotspot</p>
            <p className="mt-1 text-[10px] text-zinc-300">Ikon: {c.hotspot.icons.Point || "—"}</p>
            <p className="text-[10px] text-zinc-300">Warna: {c.hotspot.background}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

export { defaultStudioConfig }
