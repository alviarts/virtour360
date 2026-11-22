/**
 * Konfigurasi Studio ala platform referensi — dipakai oleh editor Design/CMS/Marketing/Setting
 * dan ikut terkirim saat tour dipublish (PublicPayload.studioConfig).
 */

export type ThemePreset = "default" | "default2" | "solid" | "wall" | "base" | "folio" | "blank"

export const themePresets: { id: ThemePreset; name: string; primary: string; text: string }[] = [
  { id: "default", name: "Default", primary: "#d1005c", text: "#0f172a" },
  { id: "default2", name: "Default 2.0", primary: "#0ea5e9", text: "#0f172a" },
  { id: "solid", name: "Solid", primary: "#18181b", text: "#fafafa" },
  { id: "wall", name: "Wall", primary: "#f59e0b", text: "#1c1917" },
  { id: "base", name: "Base", primary: "#6366f1", text: "#f8fafc" },
  { id: "folio", name: "Folio", primary: "#0f766e", text: "#f8fafc" },
  { id: "blank", name: "Blank", primary: "#71717a", text: "#18181b" },
]

export interface ThemeConfig {
  preset: ThemePreset
  primaryColor: string
  textColor: string
  primaryFont: string
  secondaryFont: string
  sceneListPosition: "left" | "right"
  hideProjectTitle: boolean
  hideSceneTitleOnCard: boolean
  hideSceneTitle: boolean
  autoOpenSceneList: boolean
  showSceneTitleInList: boolean
}

export interface HotspotDesign {
  lockHotspot: boolean
  keepPositionOnZoom: boolean
  hideTitleOnTop: boolean
  hidePreviewBox: boolean
  hideTitleOnPreview: boolean
  popupSize: "custom" | "fixed"
  popupLayout: string
  chevronSize: number
  floatingArrow: boolean
  chevronArrows: boolean
  navigationCircles: boolean
  background: string
  iconColor: string
  icons: Record<string, string>
  label: {
    fontType: string
    fontSize: number
    letterSpacing: number
    spacing: number
    fontWeight: string
    paddingX: number
    paddingY: number
    radius: number
    background: string
    textColor: string
    uppercase: boolean
    italic: boolean
    onlyOnHover: boolean
  }
  distort: Record<string, boolean>
}

export interface PolygonDesign {
  background: string
  backgroundHover: string
  border: string
  borderHover: string
  borderWidth: number
}

export interface PopupDesign {
  background: string
  textColor: string
}

export interface FloorplanDesign {
  showOnStart: boolean
  layout: "box" | "panel"
  position: "left" | "right"
  background: string
  radar: boolean
  markerBackground: string
  markerBorder: string
  image: string
}

export interface GooglemapDesign {
  enabled: boolean
  radar: boolean
  markerImage: string
  markerActive: string
  width: number
}

export interface FormDesign {
  layout: "dialog" | "panel"
  background: string
  overlay: string
}

export interface CtaDesign {
  layout: "bubble" | "list"
  position: "left" | "right"
  offset: number
  title: string
  description: string
  href: string
}

export interface ControlBarDesign {
  open: boolean
  autoMinimize: number
  hidden: string[]
}

export interface DollhouseDesign {
  disabled: boolean
  background: string
  hotspotColor: string
}

export interface CmsItem {
  id: string
  title: string
  body: string
  enabled: boolean
}

export interface CmsConfig {
  posts: CmsItem[]
  products: CmsItem[]
  forms: CmsItem[]
  languages: string[]
  translations: Record<string, Record<string, string>>
}

export interface MarketingConfig {
  seoTitle: string
  seoDescription: string
  seoImage: string
  scriptChats: string
  snapshotEnabled: boolean
}

export interface SettingConfig {
  initialScene: string
  backgroundSound: string
  location: string
  copyrightEnabled: boolean
  copyrightLink: string
  copyrightAuthor: string
  copyrightDescription: string
  multiLanguage: boolean
  languages: string[]
  logo: string
  popupIntro: string
  collaboration: boolean
}

export interface StudioConfig {
  theme: ThemeConfig
  hotspot: HotspotDesign
  polygon: PolygonDesign
  popup: PopupDesign
  floorplan: FloorplanDesign
  googlemap: GooglemapDesign
  form: FormDesign
  cta: CtaDesign
  controlBar: ControlBarDesign
  dollhouse: DollhouseDesign
  cms: CmsConfig
  marketing: MarketingConfig
  setting: SettingConfig
}

export const hotspotKinds = [
  "Point", "Chevron", "Image", "Article", "Video", "Sound", "Link", "Compact", "Product",
] as const

export const defaultStudioConfig: StudioConfig = {
  theme: {
    preset: "default",
    primaryColor: "#d1005c",
    textColor: "#0f172a",
    primaryFont: "Inter",
    secondaryFont: "Open Sans",
    sceneListPosition: "left",
    hideProjectTitle: false,
    hideSceneTitleOnCard: false,
    hideSceneTitle: false,
    autoOpenSceneList: false,
    showSceneTitleInList: true,
  },
  hotspot: {
    lockHotspot: true,
    keepPositionOnZoom: true,
    hideTitleOnTop: false,
    hidePreviewBox: false,
    hideTitleOnPreview: false,
    popupSize: "custom",
    popupLayout: "Default",
    chevronSize: 1,
    floatingArrow: true,
    chevronArrows: true,
    navigationCircles: true,
    background: "#E54D42",
    iconColor: "#FFFFFF",
    icons: {
      Point: "Location01Icon",
      Image: "Image01Icon",
      Article: "NewspaperIcon",
      Video: "Video01Icon",
      Sound: "MusicNote01Icon",
      Link: "Link01Icon",
      Product: "CubeIcon",
    },
    label: {
      fontType: "inherit",
      fontSize: 12,
      letterSpacing: 0,
      spacing: 4,
      fontWeight: "600",
      paddingX: 8,
      paddingY: 4,
      radius: 12,
      background: "#000000,35%",
      textColor: "#FFFFFF",
      uppercase: false,
      italic: false,
      onlyOnHover: false,
    },
    distort: Object.fromEntries(hotspotKinds.map((kind) => [kind, false])),
  },
  polygon: {
    background: "#FFFFFF,13%",
    backgroundHover: "#FFFFFF,31%",
    border: "#FFFFFF",
    borderHover: "#FFFFFF",
    borderWidth: 1,
  },
  popup: { background: "#FFFFFF", textColor: "#000000" },
  floorplan: {
    showOnStart: false,
    layout: "box",
    position: "left",
    background: "#FFFFFF,46%",
    radar: true,
    markerBackground: "#007AFE",
    markerBorder: "#FFFFFF",
    image: "",
  },
  googlemap: {
    enabled: false,
    radar: false,
    markerImage: "",
    markerActive: "",
    width: 240,
  },
  form: { layout: "dialog", background: "#FFFFFF", overlay: "#000000,45%" },
  cta: {
    layout: "bubble",
    position: "right",
    offset: 16,
    title: "Hubungi kami",
    description: "Tertarik dengan tour ini? Mari bicara.",
    href: "mailto:hello@example.com",
  },
  controlBar: {
    open: true,
    autoMinimize: 0,
    hidden: [],
  },
  dollhouse: { disabled: true, background: "#000000", hotspotColor: "#FFFFFF" },
  cms: {
    posts: [{ id: "post-1", title: "Contoh post", body: "Deskripsi singkat karya.", enabled: true }],
    products: [],
    forms: [{ id: "form-1", title: "Form kontak", body: "Nama, email, pesan", enabled: false }],
    languages: ["id", "en"],
    translations: {},
  },
  marketing: {
    seoTitle: "",
    seoDescription: "",
    seoImage: "",
    scriptChats: "",
    snapshotEnabled: true,
  },
  setting: {
    initialScene: "",
    backgroundSound: "",
    location: "",
    copyrightEnabled: true,
    copyrightLink: typeof window === "undefined" ? "" : window.location.origin,
    copyrightAuthor: "Virtour360",
    copyrightDescription: "Made with Virtour360",
    multiLanguage: false,
    languages: ["id"],
    logo: "",
    popupIntro: "",
    collaboration: false,
  },
}

/** Gabungkan data lama dengan default agar config baru selalu lengkap. */
export function normalizeStudioConfig(value: Partial<StudioConfig> | null | undefined): StudioConfig {
  if (!value) return structuredClone(defaultStudioConfig)
  return {
    theme: { ...defaultStudioConfig.theme, ...value.theme },
    hotspot: {
      ...defaultStudioConfig.hotspot,
      ...value.hotspot,
      icons: { ...defaultStudioConfig.hotspot.icons, ...value.hotspot?.icons },
      label: { ...defaultStudioConfig.hotspot.label, ...value.hotspot?.label },
      distort: { ...defaultStudioConfig.hotspot.distort, ...value.hotspot?.distort },
    },
    polygon: { ...defaultStudioConfig.polygon, ...value.polygon },
    popup: { ...defaultStudioConfig.popup, ...value.popup },
    floorplan: { ...defaultStudioConfig.floorplan, ...value.floorplan },
    googlemap: { ...defaultStudioConfig.googlemap, ...value.googlemap },
    form: { ...defaultStudioConfig.form, ...value.form },
    cta: { ...defaultStudioConfig.cta, ...value.cta },
    controlBar: { ...defaultStudioConfig.controlBar, ...value.controlBar },
    dollhouse: { ...defaultStudioConfig.dollhouse, ...value.dollhouse },
    cms: { ...defaultStudioConfig.cms, ...value.cms },
    marketing: { ...defaultStudioConfig.marketing, ...value.marketing },
    setting: { ...defaultStudioConfig.setting, ...value.setting },
  }
}
