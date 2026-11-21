export interface LocalCreator {
  id: string
  name: string
  initials: string
  color: string
  title: string
  image: string
  panorama: string
  category: string
  views: string
  email?: string
}

/** Kreator contoh saat backend belum dikonfigurasi — tiap kreator 1 post 360°. */
export const LOCAL_CREATORS: LocalCreator[] = [
  { id: "c1", name: "Atrium Studio", initials: "AS", color: "bg-amber-100 text-amber-700", title: "Atrium — The Gallery", image: "/media/thumbnails/key-biscayne-1.jpg", panorama: "/media/panoramas/key-biscayne-1.jpg", category: "Interior", views: "12 post" },
  { id: "c2", name: "Ruang Kreatif", initials: "RK", color: "bg-sky-100 text-sky-700", title: "Studio — Creative Room", image: "/media/thumbnails/key-biscayne-2.jpg", panorama: "/media/panoramas/key-biscayne-2.jpg", category: "Interior", views: "8 post" },
  { id: "c3", name: "Sunset Living", initials: "SL", color: "bg-rose-100 text-rose-700", title: "Terrace — Sunset View", image: "/media/thumbnails/key-biscayne-3.jpg", panorama: "/media/panoramas/key-biscayne-3.jpg", category: "Outdoor", views: "21 post" },
  { id: "c4", name: "Arda Visual", initials: "AV", color: "bg-emerald-100 text-emerald-700", title: "Living Room 360", image: "/media/thumbnails/key-biscayne-1.jpg", panorama: "/media/panoramas/key-biscayne-2.jpg", category: "Interior", views: "5 post" },
  { id: "c5", name: "Nusantara Tour", initials: "NT", color: "bg-violet-100 text-violet-700", title: "Trungtamyte", image: "/media/thumbnails/key-biscayne-2.jpg", panorama: "/media/panoramas/key-biscayne-1.jpg", category: "Outdoor", views: "14 post" },
  { id: "c6", name: "Harbor 360", initials: "H3", color: "bg-cyan-100 text-cyan-700", title: "Sunset Harbor", image: "/media/thumbnails/key-biscayne-3.jpg", panorama: "/media/panoramas/key-biscayne-3.jpg", category: "Travel", views: "9 post" },
]
