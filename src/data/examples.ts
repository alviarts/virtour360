import { defaultHotspotStyle, type Scene } from "../types/tour"

/**
 * 3 contoh panorama interior 360° gratis (Poly Haven, CC0).
 * Alur: Atrium/lobby → Studio kreatif → Kamar apartemen.
 */
export interface Example360 {
  id: string
  title: string
  kind: string
  image: string
  panorama: string
  description: string
  yaw: number
  pitch: number
}

export const EXAMPLES_360: Example360[] = [
  {
    id: "atrium",
    title: "Atrium — The Gallery",
    kind: "Interior",
    image: "/media/thumbnails/entrance_hall.jpg",
    panorama: "/media/panoramas/entrance_hall.jpg",
    description: "Lobby bergaya klasik dengan lengkungan dan cahaya hangat — cocok sebagai scene pembuka.",
    yaw: 0,
    pitch: 0,
  },
  {
    id: "studio",
    title: "Studio — Creative Room",
    kind: "Interior",
    image: "/media/thumbnails/art_studio.jpg",
    panorama: "/media/panoramas/art_studio.jpg",
    description: "Ruang studio seni dengan lukisan dan area kerja kreatif.",
    yaw: 30,
    pitch: 0,
  },
  {
    id: "apartment",
    title: "Apartemen — Kamar & Ruang Kerja",
    kind: "Interior",
    image: "/media/thumbnails/hotel_room.jpg",
    panorama: "/media/panoramas/hotel_room.jpg",
    description: "Kamar dan ruang kerja yang hangat — penutup alur tur.",
    yaw: -20,
    pitch: 0,
  },
]

/** Tur 3 scene yang dimulai dari panorama khas kreator. */
export function buildCreatorScenes(index: number): Scene[] {
  const ordered = [
    CREATOR_PANORAMAS[index % CREATOR_PANORAMAS.length],
    ...CREATOR_PANORAMAS.filter((_, i) => i !== index % CREATOR_PANORAMAS.length),
  ].slice(0, 3)
  const labels = ["Scene utama", "Scene lanjutan", "Scene terakhir"]

  return ordered.map((item, i) => {
    return {
      id: `creator-${index}-${i}`,
      name: `${labels[i]} — kreator ${index + 1}`,
      description: "Panorama interior dari karya kreator ini.",
      group: "Kreator",
      panorama: item.panorama,
      thumbnail: item.image,
      initialView: { yaw: 0, pitch: 0, zoom: 70 },
      hotspots: [
        {
          id: `next-c${index}-${i}`,
          type: "scene",
          yaw: 90,
          pitch: 0,
          title: "Lanjut ke scene berikutnya",
          targetSceneId: `creator-${index}-${(i + 1) % ordered.length}`,
        },
        {
          id: `info-c${index}-${i}`,
          type: "info",
          yaw: -60,
          pitch: -5,
          title: labels[i],
          description: "Geser untuk menjelajahi ruang ini.",
        },
      ],
      project: { title: labels[i], role: "Kreator", client: "Virtour360", year: "2026", tags: ["Interior"] },
    }
  })
}

/** Panorama interior cadangan untuk kreator demo. */
export const CREATOR_PANORAMAS = [
  { image: "/media/thumbnails/entrance_hall.jpg", panorama: "/media/panoramas/entrance_hall.jpg" },
  { image: "/media/thumbnails/art_studio.jpg", panorama: "/media/panoramas/art_studio.jpg" },
  { image: "/media/thumbnails/hotel_room.jpg", panorama: "/media/panoramas/hotel_room.jpg" },
  { image: "/media/thumbnails/artist_workshop.jpg", panorama: "/media/panoramas/artist_workshop.jpg" },
  { image: "/media/thumbnails/ballroom.jpg", panorama: "/media/panoramas/ballroom.jpg" },
]

/** Susun 3 contoh menjadi tur dengan alur yang pas. */
/** Posisi pintu pada tiap panorama contoh (derajat yaw). */
const DOOR_YAW = [0, -70, 130]

export function buildExampleScenes(): Scene[] {
  return EXAMPLES_360.map((item, index) => {
    const next = EXAMPLES_360[(index + 1) % EXAMPLES_360.length]
    return {
      id: item.id,
      name: item.title,
      description: item.description,
      group: "Contoh",
      panorama: item.panorama,
      thumbnail: item.image,
      initialView: { yaw: item.yaw, pitch: item.pitch, zoom: 70 },
      hotspots: [
        {
          id: `door-${item.id}`,
          type: "info",
          yaw: DOOR_YAW[index] ?? 0,
          pitch: 0,
          title: `Pintu → ${next.title}`,
          description: "Klik pintu untuk masuk ke ruang berikutnya.",
          targetSceneId: next.id,
          style: {
            ...defaultHotspotStyle,
            icon: "link",
            color: "#0ea5e9",
            size: 4,
            showLabel: true,
          },
        },
        {
          id: `door-link-${item.id}`,
          type: "scene",
          yaw: DOOR_YAW[index] ?? 0,
          pitch: 0,
          title: `Masuk ke ${next.title}`,
          targetSceneId: next.id,
        },
        {
          id: `info-${item.id}`,
          type: "info",
          yaw: -70,
          pitch: -5,
          title: item.title,
          description: item.description,
        },
      ],
      project: {
        title: item.title,
        role: "Contoh 360° gratis",
        client: "Virtour360",
        year: "2026",
        tags: ["360°", item.kind],
      },
    }
  })
}
