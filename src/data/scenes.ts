import type { Scene } from "../types/tour"

const P = "/media/panoramas"
const T = "/media/thumbnails"

export const scenes: Scene[] = [
  {
    id: "atrium",
    name: "Atrium — The Gallery",
    description: "Ruang pamer utama dengan pencahayaan alami dan artefak pilihan.",
    group: "Uncategory",
    panorama: `${P}/entrance_hall.jpg`,
    thumbnail: `${T}/entrance_hall.jpg`,
    initialView: { yaw: 0, pitch: 0, zoom: 70 },
    hotspots: [
      {
        id: "hs-about",
        type: "info",
        yaw: 18,
        pitch: -4,
        title: "Tentang karya ini",
        description: "Panorama 360° pertama dalam seri galeri. Setiap sudut dipotret dan dijahit menjadi satu ruang yang bisa dijelajahi.",
      },
      {
        id: "hs-next",
        type: "scene",
        yaw: -95,
        pitch: 2,
        title: "Menuju Studio",
        description: "Lanjut ke ruang kerja kreatif",
        targetSceneId: "studio",
      },
    ],
    project: {
      title: "The Gallery",
      role: "360° Capture & Interactive Design",
      client: "Diraja Art Space",
      year: "2025",
      tags: ["360°", "Photography", "WebGL"],
    },
  },
  {
    id: "studio",
    name: "Studio — Creative Room",
    description: "Ruang kerja kreatif tempat ide, sketsa, dan prototipe dibentuk.",
    group: "Uncategory",
    panorama: `${P}/art_studio.jpg`,
    thumbnail: `${T}/art_studio.jpg`,
    initialView: { yaw: 30, pitch: 0, zoom: 70 },
    hotspots: [
      {
        id: "hs-process",
        type: "project",
        yaw: -40,
        pitch: -6,
        title: "Proses kreatif",
        description: "Dari riset, moodboard, pemotretan equirectangular, hingga komposisi hotspot interaktif.",
      },
      {
        id: "hs-back",
        type: "scene",
        yaw: 120,
        pitch: 3,
        title: "Kembali ke Atrium",
        targetSceneId: "atrium",
      },
      {
        id: "hs-next",
        type: "scene",
        yaw: -120,
        pitch: 1,
        title: "Menuju Terrace",
        targetSceneId: "terrace",
      },
    ],
    project: {
      title: "Creative Room",
      role: "Virtual Tour & Spatial Storytelling",
      client: "Personal Project",
      year: "2025",
      tags: ["Tour", "Storytelling", "UI"],
    },
  },
  {
    id: "terrace",
    name: "Terrace — Sunset View",
    description: "Area terbuka dengan panorama langit dan cakrawala yang luas.",
    group: "Uncategory",
    panorama: `${P}/hotel_room.jpg`,
    thumbnail: `${T}/hotel_room.jpg`,
    initialView: { yaw: -20, pitch: 4, zoom: 65 },
    hotspots: [
      {
        id: "hs-link",
        type: "link",
        yaw: 60,
        pitch: 0,
        title: "Lihat karya lainnya",
        description: "Kunjungi galeri online untuk proyek lainnya.",
        href: "https://www.behance.net",
      },
      {
        id: "hs-back",
        type: "scene",
        yaw: -90,
        pitch: 2,
        title: "Kembali ke Studio",
        targetSceneId: "studio",
      },
    ],
    project: {
      title: "Sunset Terrace",
      role: "Panoramic Content & Color Grading",
      client: "Sunset Harbor",
      year: "2024",
      tags: ["360°", "Grading", "Hospitality"],
    },
  },
]

export const defaultSceneId = scenes[0].id
