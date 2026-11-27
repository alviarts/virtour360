import type { View } from "./navigation"

/** Label menu publik yang dipakai di landing page dan halaman marketing. */
export const NAV_LINKS = ["Home", "Product", "Resources", "Explore", "Pricing", "Contact"] as const
export type NavLink = (typeof NAV_LINKS)[number]

/** Rute untuk menu tingkat atas. "Explore" tetap memakai view customers. */
export const NAV_ROUTE: Record<NavLink, View> = {
  Home: "home",
  Product: "product",
  Resources: "resources",
  Explore: "customers",
  Pricing: "pricing",
  Contact: "contact",
}

export type NavMenuEntry = { title: string; detail: string; route: string }

/**
 * Submenu memakai rute nyata, bukan anchor dekoratif, supaya setiap item bisa
 * diklik dan membuka halaman yang sesuai di landing page maupun Shell marketing.
 */
export const NAV_MENUS: Partial<Record<NavLink, NavMenuEntry[]>> = {
  Product: [
    { title: "Studio", detail: "Editor scene, hotspot, dan desain tour", route: "#/studio" },
    { title: "Scene & hotspot", detail: "Sembilan tipe hotspot yang bisa dipakai", route: "#/resources/hotspot-guide" },
    { title: "Publish & embed", detail: "Slug unik, QR, password, iframe", route: "#/resources/embed-share" },
    { title: "Pricing", detail: "Gratis untuk semua, bayar storage saja", route: "#/pricing" },
  ],
  Resources: [
    { title: "Documentation", detail: "Panduan lengkap dari project sampai publish", route: "#/resources/documentation" },
    { title: "Quick start", detail: "Tour pertama dalam tiga langkah", route: "#/resources/quick-start" },
    { title: "Fitur & batasan", detail: "Daftar fitur dan batas paket gratis", route: "#/resources/features" },
    { title: "Syarat & ketentuan", detail: "Aturan penggunaan layanan", route: "#/resources/terms" },
    { title: "Kebijakan privasi", detail: "Data apa yang kami simpan", route: "#/resources/privacy" },
    { title: "Changelog", detail: "Catatan pembaruan terbaru", route: "#/resources/changelog" },
  ],
}
