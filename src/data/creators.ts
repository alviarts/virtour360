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

const IMG = [
  { image: "/media/thumbnails/entrance_hall.jpg", panorama: "/media/panoramas/entrance_hall.jpg" },
  { image: "/media/thumbnails/art_studio.jpg", panorama: "/media/panoramas/art_studio.jpg" },
  { image: "/media/thumbnails/hotel_room.jpg", panorama: "/media/panoramas/hotel_room.jpg" },
  { image: "/media/thumbnails/artist_workshop.jpg", panorama: "/media/panoramas/artist_workshop.jpg" },
  { image: "/media/thumbnails/ballroom.jpg", panorama: "/media/panoramas/ballroom.jpg" },
]

/** Kreator contoh — tiap kreator punya 1 post panorama interior 360°. */
export const LOCAL_CREATORS: LocalCreator[] = [
  { id: "c1", name: "Atrium Studio", initials: "AS", color: "bg-amber-100 text-amber-700", title: "Atrium — The Gallery", ...IMG[0], category: "Interior", views: "12 post" },
  { id: "c2", name: "Ruang Kreatif", initials: "RK", color: "bg-sky-100 text-sky-700", title: "Studio — Creative Room", ...IMG[1], category: "Interior", views: "8 post" },
  { id: "c3", name: "Sunset Living", initials: "SL", color: "bg-rose-100 text-rose-700", title: "Apartemen — Kamar", ...IMG[2], category: "Interior", views: "21 post" },
  { id: "c4", name: "Arda Visual", initials: "AV", color: "bg-emerald-100 text-emerald-700", title: "Studio — Workshop", ...IMG[3], category: "Interior", views: "5 post" },
  { id: "c5", name: "Harbor 360", initials: "H3", color: "bg-cyan-100 text-cyan-700", title: "Ballroom — Event Hall", ...IMG[4], category: "Interior", views: "9 post" },
]
