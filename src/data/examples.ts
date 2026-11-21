/**
 * 3 contoh panorama 360° gratis untuk demo (Panoee / Photo Sphere Viewer demo data).
 * Alur: ruang publik → apartemen → terrace, supaya perpindahan scene terasa alami.
 */
export interface Example360 {
  id: string
  title: string
  kind: "umum" | "Apartemen" | "Terrace"
  image: string
  panorama: string
  description: string
  yaw: number
  pitch: number
}

import type { Scene } from "../types/tour"

export const EXAMPLES_360: Example360[] = [
  {
    id: "public-square",
    title: "Ruang Publik — Taman & Monumen",
    kind: "umum",
    image: "/media/thumbnails/key-biscayne-1.jpg",
    panorama: "/media/panoramas/key-biscayne-1.jpg",
    description: "Jalur pejalan kaki terbuka dengan taman dan monumen — cocok untuk scene pembuka.",
    yaw: 0,
    pitch: 0,
  },
  {
    id: "apartment",
    title: "Apartemen — Ruang Kerja",
    kind: "Apartemen",
    image: "/media/thumbnails/key-biscayne-2.jpg",
    panorama: "/media/panoramas/key-biscayne-2.jpg",
    description: "Interior apartemen dengan meja kerja dan pencahayaan alami.",
    yaw: 30,
    pitch: 0,
  },
  {
    id: "terrace",
    title: "Terrace — Pemandangan",
    kind: "Terrace",
    image: "/media/thumbnails/key-biscayne-3.jpg",
    panorama: "/media/panoramas/key-biscayne-3.jpg",
    description: "Area terbuka dengan panorama langit — penutup alur tur.",
    yaw: -20,
    pitch: 4,
  },
]

/** Susun 3 contoh menjadi tur dengan alur: umum → apartemen → terrace → umum. */
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
          id: `next-${item.id}`,
          type: "scene",
          yaw: 90,
          pitch: 0,
          title: `Lanjut ke ${next.title}`,
          description: next.description,
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
