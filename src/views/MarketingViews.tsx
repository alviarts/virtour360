import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Globe2,
  LifeBuoy,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Play,
  Search,
  Shield,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { Logo360 } from "../components/ui/Logo360"
import { ThemeToggle } from "../components/ui/ThemeToggle"
import { WorkflowFlow } from "../components/ui/WorkflowFlow"
import { HotspotDemo } from "../components/ui/HotspotDemo"
import { TourStage } from "../components/ui/TourStage"
import { useApp } from "../context/useApp"
import { navigate, navigateHash, profileSlug } from "../lib/navigation"
import { isRemote } from "../lib/supabase"
import { listPublishedPayloads, watchPublishedChanges, type PublishedItem } from "../lib/publicStore"
import { LOCAL_CREATORS } from "../data/creators"

const LINKS = ["Home", "Product", "Resources", "Explore", "Pricing", "Contact"] as const

/** Label menu → rute internal ("Explore" tetap memakai view customers). */
const LINK_ROUTE: Record<(typeof LINKS)[number], "home" | "product" | "resources" | "customers" | "pricing" | "contact"> = {
  Home: "home",
  Product: "product",
  Resources: "resources",
  Explore: "customers",
  Pricing: "pricing",
  Contact: "contact",
}

type MenuEntry = { title: string; detail: string; route: string }
const MENUS: Record<string, MenuEntry[]> = {
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

function Shell({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  const [menu, setMenu] = useState("")
  const { user, logout, notify } = useApp()

  return (
    <div className="h-full w-full overflow-y-auto bg-[#08090a] text-[#d0d6e0]">
      <header
        className="sticky top-0 z-30 h-[72px] border-b border-white/[0.06] bg-[#08090a]/90 backdrop-blur-xl"
        onMouseLeave={() => setMenu("")}
      >
        <div className="mx-auto flex h-full max-w-[1200px] items-center px-6">
          <button onClick={() => navigate("home")} className="flex items-center"><Logo360 tone="white" size={22} /></button>
          <nav className="ml-auto hidden items-center gap-5 text-[12px] md:flex">
            {LINKS.map((link) => (
              <div key={link} className="relative" onMouseEnter={() => setMenu(MENUS[link] ? link : "")}>
                <button
                  onClick={() => navigate(LINK_ROUTE[link])}
                  className={`flex items-center gap-1 transition-colors hover:text-white ${menu === link ? "text-white" : "text-[#d0d6e0]"}`}
                >
                  {link}
                  {MENUS[link] && <ChevronDown size={11} className="text-[#62666d]" />}
                </button>
                {MENUS[link] && menu === link && (
                  <div className="absolute left-0 top-full z-50 mt-3 w-[300px] rounded-lg border border-white/10 bg-[#0f1011] p-2 shadow-[0_16px_50px_-24px_rgba(0,0,0,.9)]">
                    <p className="px-2 pb-2 pt-1 font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">{link.toLowerCase()}</p>
                    {MENUS[link].map((entry) => (
                      <button
                        key={entry.title}
                        onClick={() => { setMenu(""); navigateHash(entry.route) }}
                        className="flex w-full flex-col rounded-md px-2 py-2 text-left hover:bg-white/[0.05]"
                      >
                        <span className="text-[12px] text-[#f7f8f8]">{entry.title}</span>
                        <span className="mt-0.5 text-[10px] text-[#8a8f98]">{entry.detail}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="ml-5 flex items-center gap-2 text-[12px]">
            <ThemeToggle />
            {user ? (
              <>
                <button onClick={() => navigate("dashboard")} className="flex items-center gap-2 rounded-full border border-white/10 px-2.5 py-1.5 hover:bg-white/5">
                  <span className="grid size-5 place-items-center rounded-full bg-[#e4f222] text-[9px] font-semibold text-[#08090a]">{user.initials}</span>
                  <span className="hidden max-w-24 truncate lg:inline">{user.name}</span>
                </button>
                <button
                  onClick={() => { logout(); notify("Anda telah keluar."); navigate("home") }}
                  title="Keluar"
                  className="grid size-8 place-items-center rounded-full border border-white/10 text-[#8a8f98] hover:text-white"
                >
                  <LogOut size={13} />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate("login")} className="text-[#d0d6e0] hover:text-white">Log in</button>
                <button onClick={() => navigate("signup")} className="rounded-full bg-white px-3 py-1.5 font-medium text-[#08090a]">Sign up</button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 pb-24">
        <div className="pt-20">
          <h1 className="text-[40px] font-medium leading-[1.05] tracking-[-0.022em] text-[#f7f8f8] sm:text-[56px]">{title}</h1>
          <p className="mt-5 max-w-[620px] text-[15px] leading-[1.6] text-[#8a8f98]">{lead}</p>
        </div>
        {children}
      </main>

      <footer className="border-t border-white/[0.06] px-6 py-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Logo360 tone="white" size={24} />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-[#8a8f98]">
            {LINKS.map((link) => (
              <button key={link} onClick={() => navigate(LINK_ROUTE[link])} className="hover:text-white">{link}</button>
            ))}
            <button onClick={() => navigateHash("#/resources/terms")} className="hover:text-white">Syarat & ketentuan</button>
            <button onClick={() => navigateHash("#/resources/privacy")} className="hover:text-white">Privasi</button>
            <a href="https://instagram.com/vwrks" target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a>
          </div>
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">© 2026 Virtour360</span>
        </div>
      </footer>
    </div>
  )
}

const CARD = "rounded-xl border border-white/[0.08] bg-white/[0.02] p-6"
const BTN = "flex h-9 items-center gap-1.5 rounded-md border border-white/10 px-3 text-[12px] text-[#d0d6e0] hover:border-white/25"

export function ProductView() {
  return (
    <Shell title="A 360° tour workspace for creators" lead="Upload panoramas, arrange scenes, add hotspots and publish a walkable tour — all from one quiet workspace.">
      <div className="mt-12"><TourStage /></div>
      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Scene", "Susun dan urutkan panorama dalam satu project."],
          ["Hotspot", "Sembilan tipe konten: info, gambar, video, audio, produk."],
          ["Publish", "Slug unik, password, QR, dan embed iframe."],
          ["Explore", "Kumpulkan tour milik kreator baru maupun lama."],
        ].map(([name, desc], i) => (
          <div key={name} className={CARD}>
            <div className="flex items-center justify-between">
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#e4f222]">0{i + 1}</span>
              <span className="size-1.5 rounded-full bg-white/20" />
            </div>
            <p className="mt-6 text-[13px] font-medium text-[#f7f8f8]">{name}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#8a8f98]">{desc}</p>
            {i < 3 && <p className="mt-4 text-[10px] text-[#62666d]">Langkah berikut →</p>}
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <button onClick={() => navigate("home")} className={BTN}>Lihat demo <ArrowRight size={13} /></button>
        <button onClick={() => navigateHash("#/resources/documentation")} className={BTN}>Baca dokumentasi <ArrowRight size={13} /></button>
      </div>
    </Shell>
  )
}

export function PricingView() {
  const { notify } = useApp()
  return (
    <Shell title="Free for all users" lead="Mulai tanpa kartu kredit. Bayar hanya bila butuh storage lebih — project dan publish tetap unlimited.">
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <div className={`${CARD} border-[#e4f222]/30`}>
          <div className="flex items-center justify-between"><span className="text-[13px] font-medium text-white">Free</span><span className="rounded-full bg-[#e4f222]/15 px-2 py-0.5 text-[10px] text-[#e4f222]">Forever</span></div>
          <p className="mt-6 text-[32px] tracking-tight text-white">$0</p>
          <ul className="mt-6 space-y-2 text-[12px] text-[#d0d6e0]">
            {["Unlimited project", "3 GB storage", "9 tipe hotspot", "Panorama sampai 32K", "Publish ke link sendiri", "Tanpa watermark"].map((x) => <li key={x}>· {x}</li>)}
          </ul>
          <button onClick={() => notify("Paket gratis aktif untuk semua akun.")} className="mt-8 h-9 w-full rounded-md bg-[#e4f222] text-[12px] font-medium text-[#08090a]">Start free</button>
        </div>
        <div className={CARD}>
          <p className="text-[13px] font-medium text-white">Storage tambahan</p>
          <p className="mt-6 text-[32px] tracking-tight text-white">$0,15<span className="text-[12px] text-[#8a8f98]"> /GB</span></p>
          <p className="mt-6 text-[12px] leading-relaxed text-[#8a8f98]">Tambah kapasitas kapan saja. Tagihan hanya untuk storage di atas 3 GB.</p>
        </div>
        <div className={CARD}>
          <p className="text-[13px] font-medium text-white">Syarat & ketentuan</p>
          <p className="mt-6 text-[12px] leading-relaxed text-[#8a8f98]">Project draft dan arsip tetap gratis. Download ZIP/self-hosting dan white-label tersedia pada paket lanjutan.</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <button onClick={() => navigateHash("#/resources/terms")} className={BTN}>Syarat <ArrowRight size={13} /></button>
            <button onClick={() => navigate("contact")} className={BTN}>Tanya sales <ArrowRight size={13} /></button>
          </div>
        </div>
      </div>
    </Shell>
  )
}

type FeedCard = {
  key: string
  name: string
  title: string
  image: string
  uid: string
  slug: string
  demo: boolean
  source?: "local" | "supabase"
  updatedAt?: string
}

type FeedSort = "newest" | "oldest" | "name"

export function CustomersView() {
  const [feed, setFeed] = useState<PublishedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<FeedSort>("newest")

  const reload = useCallback(async () => {
    const items = await listPublishedPayloads()
    setFeed(items)
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
    const stop = watchPublishedChanges(() => void reload())
    return stop
  }, [reload])

  const realCards: FeedCard[] = feed.map(({ uid, payload, source }) => {
    const name = payload.profile?.name || "Kreator Virtour360"
    const thumbnail = payload.scenes[0]?.thumbnail
    return {
      key: uid,
      name,
      title: payload.folders?.[0]?.name || payload.scenes[0]?.project?.title || "Virtual tour 360°",
      image: thumbnail && !thumbnail.startsWith("blob:") ? thumbnail : "/media/thumbnails/entrance_hall.jpg",
      uid,
      slug: uid.split("/")[0] || profileSlug(name),
      demo: false,
      source,
      updatedAt: payload.updatedAt,
    }
  })

  const demoCards: FeedCard[] = LOCAL_CREATORS.map((creator, i) => ({
    key: creator.id,
    name: creator.name,
    title: creator.title,
    image: ["/media/thumbnails/art_studio.jpg", "/media/thumbnails/hotel_room.jpg", "/media/thumbnails/ballroom.jpg"][i % 3],
    uid: "",
    slug: profileSlug(creator.name, creator.id),
    demo: true,
  }))

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (card: FeedCard) => !q || `${card.name} ${card.title} ${card.uid}`.toLowerCase().includes(q)
    const real = realCards.filter(matches)
    const demo = demoCards.filter(matches)
    if (sort === "name") return [...real, ...demo].sort((a, b) => a.name.localeCompare(b.name))
    const ordered = sort === "oldest" ? [...real].reverse() : real
    return [...ordered, ...demo]
  }, [realCards, demoCards, query, sort])

  const supabaseCount = realCards.filter((card) => card.source === "supabase").length
  const localCount = realCards.length - supabaseCount

  return (
    <Shell title="Explore tours from the community" lead="Karya kreator yang sudah dipublish, terkumpul di satu tempat dan diperbarui saat ada tour baru.">
      <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px] text-[#8a8f98]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live · {realCards.length} tour dipublish
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">
          {supabaseCount} Supabase · {localCount} lokal
        </span>
        <button onClick={() => void reload()} className="rounded-md border border-white/10 px-2.5 py-1 hover:border-white/25 hover:text-white">Segarkan</button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-full max-w-[260px] items-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-3">
          <Search size={13} className="shrink-0 text-[#62666d]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama atau judul tour…"
            aria-label="Cari tour berdasarkan nama"
            className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#62666d]"
          />
          {query && <button onClick={() => setQuery("")} title="Hapus pencarian" className="text-[#62666d] hover:text-white"><X size={12} /></button>}
        </div>
        <div className="flex h-9 items-center gap-2 rounded-md border border-white/10 px-2.5 text-[11px] text-[#8a8f98]">
          <ArrowUpDown size={12} className="shrink-0" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as FeedSort)}
            aria-label="Urutkan tour"
            className="bg-transparent outline-none"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="name">Nama A–Z</option>
          </select>
        </div>
        {(query || sort !== "newest") && (
          <button onClick={() => { setQuery(""); setSort("newest") }} className="h-9 rounded-md border border-white/10 px-2.5 text-[11px] text-[#8a8f98] hover:border-white/25 hover:text-white">
            Reset filter
          </button>
        )}
        <span className="ml-auto font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">{cards.length} ditampilkan</span>
      </div>

      <p className="mt-3 max-w-[760px] text-[11px] leading-relaxed text-[#62666d]">
        {isRemote ? (
          <>
            Terhubung ke Supabase: publish tersimpan di tabel <code className="font-[family-name:var(--font-mono)] text-[#8a8f98]">virtour_state</code> dan feed diperbarui lewat realtime.
            Kartu berlabel <span className="text-[#8a8f98]">Lokal</span> berasal dari browser ini.
          </>
        ) : (
          <>
            Mode lokal aktif: feed diambil dari tour yang dipublish di browser ini dan langsung diperbarui saat publish.
            Untuk sinkron antar perangkat, isi <code className="font-[family-name:var(--font-mono)] text-[#8a8f98]">VITE_SUPABASE_URL</code> dan{" "}
            <code className="font-[family-name:var(--font-mono)] text-[#8a8f98]">VITE_SUPABASE_ANON_KEY</code> lalu jalankan ulang — lihat docs/14-cara-menjalankan.md.
          </>
        )}
      </p>
      {loading ? (
        <p className="mt-12 text-[12px] text-[#62666d]">Memuat feed publish…</p>
      ) : (
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <button
              key={card.key}
              onClick={() => navigateHash(card.demo ? `#/u/${card.slug}` : `#/p/${card.uid}`)}
              className={`${CARD} overflow-hidden p-0 text-left transition-colors hover:border-white/25`}
            >
              <img src={card.image} alt="" className="h-32 w-full object-cover" />
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-white/10 text-[11px] text-white">{card.name.slice(0, 2).toUpperCase()}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-[#f7f8f8]">{card.name}</p>
                    <p className="truncate text-[11px] text-[#8a8f98]">{card.title}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <p className="truncate font-[family-name:var(--font-mono)] text-[10px] text-[#e4f222]">{card.demo ? `/u/${card.slug}` : `/p/${card.uid}`}</p>
                  {card.demo ? (
                    <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[9px] text-[#8a8f98]">Contoh</span>
                  ) : (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] ${card.source === "supabase" ? "bg-emerald-500/10 text-emerald-300" : "bg-white/5 text-[#8a8f98]"}`}>
                      {card.source === "supabase" ? "Supabase" : "Lokal"}
                    </span>
                  )}
                </div>
                <p className="mt-3 flex items-center gap-1.5 border-t border-white/[0.06] pt-3 font-[family-name:var(--font-mono)] text-[9px] text-[#62666d]">
                  <CalendarDays size={11} />
                  {card.updatedAt ? new Date(card.updatedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "Contoh bawaan"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
      {!loading && !cards.length && (
        <div className="mt-12 rounded-xl border border-dashed border-white/10 py-16 text-center">
          <p className="text-[13px] text-[#8a8f98]">Tidak ada tour yang cocok dengan pencarian ini.</p>
          <button onClick={() => { setQuery(""); setSort("newest") }} className="mt-4 rounded-md border border-white/15 px-3 py-1.5 text-[11px] text-[#d0d6e0] hover:border-white/30">
            Reset filter
          </button>
        </div>
      )}
    </Shell>
  )
}

type DocSection = { title: string; paragraphs?: string[]; bullets?: string[]; note?: string }
type ResourceDoc = {
  slug: string
  name: string
  desc: string
  Icon: LucideIcon
  intro: string
  sections: DocSection[]
}

const DOCS: ResourceDoc[] = [
  {
    slug: "documentation",
    name: "Documentation",
    desc: "Panduan lengkap upload, scene, hotspot, dan publish.",
    Icon: BookOpen,
    intro: "Dokumentasi resmi Virtour360. Alurnya sederhana: buat project, isi scene, lalu publish link yang bisa dibagikan tanpa perlu akun untuk melihat.",
    sections: [
      {
        title: "Alur kerja",
        bullets: [
          "Dashboard (#/dashboard): buat project, tentukan kategori, lalu pilih Buka Studio. Tiap project menyimpan scene dan identitas publishnya sendiri.",
          "Studio (#/studio): unggah panorama equirectangular rasio 2:1 (misal 4096×2048). Scene tersimpan di browser/perangkat atau di Supabase saat mode server aktif.",
          "Susun scene di sidebar, beri nama, masukkan ke grup, dan atur urutan. Klik scene untuk mengedit di kanvas 360°.",
          "Pasang hotspot di kanvas, lalu atur judul, deskripsi, media, dan initial view di inspector.",
          "Panel Design mengatur tema, floorplan, CMS, dan SEO. Tombol Published membuka modal publish untuk slug, akses, QR, dan embed.",
        ],
      },
      {
        title: "Rute yang dipakai",
        bullets: [
          "#/home — landing dan demo studio sesi browser ini.",
          "#/dashboard — gateway project; klik kartu untuk pindah project, tombol mata untuk pratinjau 360°.",
          "#/studio — editor penuh: scene, hotspot, grup, dan pengaturan tampilan.",
          "#/u/<slug> — portofolio publik milik akun, hanya menampilkan project yang dipublish.",
          "#/p/<uid> — link publish langsung ke satu tour.",
        ],
      },
      {
        title: "Penyimpanan data",
        paragraphs: [
          "Secara default Virtour360 berjalan lokal: akun, project, scene, dan hasil publish disimpan di browser yang dipakai. Ini membuat demo mudah dicoba tanpa konfigurasi.",
          "Jika VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY diisi, klien Supabase dipakai untuk state bersama. Kredensial service-role tidak boleh dimasukkan ke variabel VITE_* karena ikut ter-bundle ke browser.",
        ],
        note: "Panorama hasil unggah bersifat privat di perangkat asal. Pastikan mode server/storage dikonfigurasi bila tour harus dibuka dari perangkat lain.",
      },
    ],
  },
  {
    slug: "quick-start",
    name: "Quick start",
    desc: "Buat tour pertama dalam tiga langkah.",
    Icon: Play,
    intro: "Dari kosong sampai link publish yang bisa dibagikan. Cukup tiga langkah dan tidak memerlukan kartu kredit.",
    sections: [
      {
        title: "1. Buat project",
        paragraphs: ["Buka Dashboard, klik Buat Project, isi nama dan kategori (360° Post, Virtual Tour, Portofolio, Produk, atau Lainnya). Project langsung aktif dan Studio terbuka."],
      },
      {
        title: "2. Unggah panorama",
        paragraphs: ["Di Studio, klik Unggah panorama, pilih JPG/PNG/WebP equirectangular 2:1, beri nama scene, lalu klik Unggah & tambahkan scene. Ulangi untuk scene kedua bila ingin tour berpindah-pindah."],
      },
      {
        title: "3. Hubungkan dan publish",
        paragraphs: ["Pilih hotspot navigasi di scene pertama, arahkan ke scene kedua, lalu klik Published. Slug default berbentuk username/nama-scene-kode-acak supaya project berbeda tidak saling menimpa."],
        note: "Link siap dibagikan sebagai #/p/<slug>. Tombol Salin link menyalin URL; bila clipboard diblokir browser, teks akan ditampilkan untuk disalin manual.",
      },
    ],
  },
  {
    slug: "hotspot-guide",
    name: "Hotspot guide",
    desc: "Memilih tipe konten yang tepat untuk tiap titik.",
    Icon: MapPin,
    intro: "Sembilan jenis hotspot tersedia di Studio. Semua disimpan per hotspot dan tampil di viewer publik dengan gaya yang sama seperti di editor.",
    sections: [
      {
        title: "Jenis hotspot",
        bullets: [
          "Point — label teks singkat untuk menjelaskan objek di panorama.",
          "Chevron — penunjuk arah atau aksi lanjutan.",
          "Image — gambar tambahan yang muncul saat titik diklik.",
          "Article — teks panjang/artikel pendek di dalam popup.",
          "Video — media video dengan kontrol putar.",
          "Sound — audio narasi atau ambience.",
          "Link — tautan ke halaman eksternal.",
          "Compact — label ringkas untuk penanda tanpa popup besar.",
          "Product — kartu produk dengan gambar, harga, dan CTA.",
        ],
      },
      {
        title: "Navigasi antar scene",
        paragraphs: ["Pindah scene memakai tipe hotspot 'scene'. Tipe lain tidak diubah menjadi panah, jadi arah navigasi tetap jelas di viewer."],
        bullets: ["Bentuk yang tersedia: circle, square, diamond, star, hexagon, triangle, dan heart.", "Ikon yang tersedia: point, info, link, image, video, sound, product, star, dan heart.", "Atur posisi dengan klik panorama saat alat hotspot aktif; posisi yaw/pitch tersimpan bersama scene."],
      },
    ],
  },
  {
    slug: "embed-share",
    name: "Embed & share",
    desc: "Pasang tour di website mana pun.",
    Icon: Globe2,
    intro: "Setiap project yang dipublish mendapat alamat unik. Bagikan langsung, tampilkan QR, atau tanamkan sebagai iframe.",
    sections: [
      {
        title: "Link dan QR",
        paragraphs: ["Modal Publish menampilkan URL #/p/<uid> dan QR code yang dibuat dari URL tersebut. QR cocok untuk dibagikan ke pengunjung yang membuka tour dari ponsel."],
      },
      {
        title: "Embed iframe",
        paragraphs: ["Salin kode iframe dari modal Publish, lalu tempel di CMS atau halaman website. Opsi fullscreen, VR, dan lazy loading bisa diatur sebelum menyalin."],
        note: "Akses public dapat dibuka siapa pun dengan link. Akses password meminta hash password sebelum viewer dimuat; akses draft tidak bisa dibuka publik.",
      },
    ],
  },
  {
    slug: "community",
    name: "Community",
    desc: "Lihat karya kreator lain.",
    Icon: Users,
    intro: "Halaman Explore mengumpulkan tour yang sudah dipublish. Kartu berasal dari data publish nyata, bukan daftar statis, dan bisa difilter berdasarkan nama atau tanggal.",
    sections: [
      {
        title: "Feed publish",
        bullets: [
          "Kartu dengan label /p/<uid> adalah tour sungguhan; klik untuk membuka viewer 360°.",
          "Kartu berlabel Contoh adalah sampel bawaan yang bisa dipakai sebagai referensi visual.",
          "Feed diperbarui otomatis saat ada publish baru, dari tab lain, atau dari perubahan Supabase bila terhubung.",
        ],
      },
      {
        title: "Bergabung",
        paragraphs: ["Buat akun, publish project pertama, lalu tour kamu akan muncul di feed Explore. Profil publik tersedia di #/u/<slug> dan menampilkan hanya project yang sudah dipublish."],
      },
    ],
  },
  {
    slug: "changelog",
    name: "Changelog",
    desc: "Catatan fitur terbaru yang kami kirim.",
    Icon: Sparkles,
    intro: "Ringkasan pembaruan yang sudah masuk ke aplikasi.",
    sections: [
      {
        title: "Terbaru",
        bullets: [
          "Publish per project: UID unik dan slug acak, publish ulang tidak menimpa project lain.",
          "Dashboard: klik kartu hanya memilih project; Studio dibuka lewat tombol eksplisit, pratinjau lewat tombol mata.",
          "Portofolio: hanya menampilkan project published milik akun, thumbnail persisten setelah refresh.",
          "Viewer: project satu scene tidak lagi memicu error plugin tour; tombol kembali di link publish menuju portofolio pemilik.",
          "Halaman marketing: dropdown Product/Resources, dokumentasi animatif, dan feed Explore yang bisa difilter nama/tanggal.",
        ],
      },
      {
        title: "Sebelumnya",
        bullets: ["Panel Design dengan preset tema, floorplan, CMS, dan SEO.", "Sembilan tipe hotspot dengan media, bentuk, dan ikon.", "Mode demo per sesi browser, login/daftar full-page, dan responsivitas mobile."],
      },
    ],
  },
  {
    slug: "features",
    name: "Fitur & batasan",
    desc: "Apa yang termasuk paket gratis dan batasnya.",
    Icon: Shield,
    intro: "Paket gratis dirancang untuk bisa dipakai serius: project dan publish tidak dibatasi, yang dikenakan biaya hanya storage tambahan.",
    sections: [
      {
        title: "Termasuk",
        bullets: ["Project dan scene tanpa batas.", "Sembilan tipe hotspot, grup, weblog aktivitas, dan undo.", "Design theme, floorplan, CMS, dan SEO per project.", "Publish ke link sendiri, QR, kode embed, serta akses public/password/draft.", "Tanpa watermark."],
      },
      {
        title: "Batasan",
        bullets: ["Storage gratis 3 GB; tambahan dihitung per GB.", "Panorama disarankan equirectangular 2:1 hingga 32K.", "Mode lokal menyimpan data di browser perangkat; perpindahan perangkat memerlukan mode Supabase.", "Download ZIP/self-hosting dan white-label tersedia pada paket lanjutan."],
        note: "Rincian harga dan ketentuan komersial ada di halaman Pricing. Pertanyaan khusus bisa dikirim lewat halaman Contact.",
      },
    ],
  },
  {
    slug: "terms",
    name: "Syarat & ketentuan",
    desc: "Aturan penggunaan layanan Virtour360.",
    Icon: FileText,
    intro: "Dengan membuat akun atau memakai Virtour360, kamu menyetujui ketentuan berikut. Versi ini berlaku untuk penggunaan layanan gratis maupun berbayar.",
    sections: [
      {
        title: "Akun dan keamanan",
        paragraphs: ["Kamu bertanggung jawab atas email dan kata sandi yang dipakai. Password disimpan sebagai hash, bukan teks mentah. Jika perangkat bersama, keluar dari akun setelah selesai."],
      },
      {
        title: "Konten kamu",
        paragraphs: ["Kamu tetap memiliki panorama, teks, dan media yang kamu unggah. Kamu menjamin memiliki hak untuk mengunggah dan membagikan material tersebut. Kami tidak menjual konten kamu."],
      },
      {
        title: "Penggunaan yang diizinkan",
        bullets: ["Dilarang mengunggah material ilegal, melanggar hak pihak lain, atau memuat malware.", "Dilarang melakukan automasi yang memberatkan layanan, mencoba membaca data akun lain, atau menyalahkan akses publik untuk distribusi konten berbahaya.", "Dilarang menghapus atau mengubah identitas layanan pada tampilan yang dipublish kecuali dengan paket yang mengizinkan white-label."],
      },
      {
        title: "Layanan dan perubahan",
        paragraphs: ["Kami dapat memperbarui fitur untuk perbaikan kinerja dan keamanan. Perubahan ketentuan akan diumumkan lewat halaman Resources atau kontak akun. Pertanyaan: hello@virtour360.app."],
      },
    ],
  },
  {
    slug: "privacy",
    name: "Kebijakan privasi",
    desc: "Data apa yang kami simpan dan bagaimana kami menjaganya.",
    Icon: Shield,
    intro: "Kami hanya menyimpan data yang diperlukan untuk menjalankan akun dan tour kamu. Berikut penjelasannya dalam bahasa sederhana.",
    sections: [
      {
        title: "Data yang disimpan",
        bullets: ["Akun: nama, email, inisial, UID profil, dan hash password.", "Konten: project, scene, hotspot, grup, pengaturan tampilan, serta panorama dan thumbnail yang kamu unggah.", "Hasil publish: slug, metadata profil publik, dan konfigurasi akses tour."],
      },
      {
        title: "Lokasi penyimpanan",
        paragraphs: ["Pada mode lokal, seluruh data berada di browser/perangkat yang kamu pakai. Kami tidak menerima salinan konten tersebut sampai kamu mengaktifkan mode server."],
        note: "Saat mode Supabase aktif, data tersimpan di project Supabase yang kamu konfigurasi sendiri. Gunakan anon PUBLIC key di browser dan simpan service-role key hanya di sisi server.",
      },
      {
        title: "Pengunjung tour",
        paragraphs: ["Tour dengan akses public bisa dilihat tanpa akun. Kami tidak meminta data pribadi pengunjung untuk membuka tour. Password tour disimpan sebagai hash, bukan password mentah."],
      },
      {
        title: "Hak kamu",
        paragraphs: ["Kamu dapat menghapus project, scene, atau akun lokal dari perangkat yang dipakai. Untuk permintaan penghapusan data pada mode server, hubungi hello@virtour360.app."],
      },
    ],
  },
]

const DOC_HIGHLIGHTS: Record<string, string[]> = {
  terms: [
    "Password disimpan sebagai hash, bukan teks mentah.",
    "Konten yang kamu unggah tetap menjadi hak kamu.",
    "Dilarang menyalahgunakan akses publik atau data akun lain.",
    "Perubahan ketentuan diumumkan lewat Resources atau email akun.",
  ],
  privacy: [
    "Data akun: nama, email, inisial, UID, dan hash password.",
    "Mode lokal menyimpan data hanya di perangkatmu.",
    "Pengunjung tour publik tidak perlu memberi data pribadi.",
    "Hubungi kami untuk penghapusan data pada mode server.",
  ],
}

export function ResourcesView() {
  const slug = window.location.hash.match(/^#\/resources\/([^/?]+)/)?.[1]
  const current = DOCS.find((doc) => doc.slug === slug)
  const [activeSection, setActiveSection] = useState(0)

  useEffect(() => setActiveSection(0), [slug])

  if (current) {
    const words = [current.intro, ...current.sections.flatMap((s) => [...(s.paragraphs ?? []), ...(s.bullets ?? [])])].join(" ").length
    const minutes = Math.max(1, Math.round(words / 550))
    const highlights = DOC_HIGHLIGHTS[current.slug]
    const goTo = (index: number) => {
      setActiveSection(index)
      document.getElementById(`doc-section-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    return (
      <Shell title={current.name} lead={current.desc}>
        <div className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_236px]">
          <article className={`${CARD} min-w-0`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-white/5 text-[#e4f222]"><current.Icon size={19} /></span>
              <div>
                <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide text-[#62666d]">Panduan · diperbarui Nov 2026</p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#8a8f98]"><Clock3 size={12} /> {minutes} menit baca · {current.sections.length} bagian</p>
              </div>
            </div>

            <p className="mt-7 text-[14px] leading-[1.75] text-[#d0d6e0]">{current.intro}</p>

            {highlights && (
              <div className="mt-7 rounded-xl border border-[#e4f222]/20 bg-[#e4f222]/[0.04] p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#e4f222]">Ringkasan singkat</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {highlights.map((item) => (
                    <li key={item} className="flex gap-2 text-[11px] leading-relaxed text-[#a6aab1]">
                      <Check size={12} className="mt-0.5 shrink-0 text-[#e4f222]" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {current.slug === "documentation" && <WorkflowFlow />}
            {current.slug === "hotspot-guide" && <HotspotDemo />}

            <div className="mt-10 space-y-10">
              {current.sections.map((section, index) => (
                <section key={section.title} id={`doc-section-${index}`} className="scroll-mt-24">
                  <div className="flex items-baseline gap-3 border-b border-white/[0.06] pb-3">
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#e4f222]">{String(index + 1).padStart(2, "0")}</span>
                    <h2 className="text-[14px] font-medium text-[#f7f8f8]">{section.title}</h2>
                  </div>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mt-4 text-[12px] leading-[1.8] text-[#8a8f98]">{paragraph}</p>
                  ))}
                  {section.bullets && (
                    <ul className="mt-4 space-y-3 text-[12px] leading-[1.7] text-[#a6aab1]">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2.5">
                          <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[#e4f222]" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.note && (
                    <p className="mt-5 rounded-lg border border-[#e4f222]/15 bg-[#e4f222]/5 px-3 py-2.5 text-[11px] leading-relaxed text-[#c7cb93]">{section.note}</p>
                  )}
                </section>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3 border-t border-white/[0.06] pt-6">
              <button onClick={() => navigate("resources")} className={BTN}><ArrowLeft size={13} /> Kembali ke Resources</button>
              <button onClick={() => navigate("contact")} className={BTN}>Butuh bantuan? <ArrowRight size={13} /></button>
            </div>
          </article>

          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide text-[#62666d]">Dalam halaman ini</p>
            <nav className="mt-3 border-l border-white/10">
              {current.sections.map((section, index) => (
                <button
                  key={section.title}
                  onClick={() => goTo(index)}
                  className={`block w-full border-l-2 py-2 pl-3 text-left text-[11px] transition-colors ${
                    activeSection === index ? "border-[#e4f222] text-[#f7f8f8]" : "border-transparent text-[#8a8f98] hover:text-white"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
            <p className="mt-8 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wide text-[#62666d]">Panduan lain</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {DOCS.filter((item) => item.slug !== current.slug).slice(0, 5).map((item) => (
                <button
                  key={item.slug}
                  onClick={() => navigateHash(`#/resources/${item.slug}`)}
                  className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-[#8a8f98] hover:border-white/25 hover:text-white"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title="Resources and documentation" lead="Semua yang kamu butuhkan untuk membuat, mempublikasikan, dan membagikan tour 360°.">
      <div className="mt-10 flex flex-wrap items-center gap-2 text-[11px] text-[#8a8f98]">
        <span className="rounded-full border border-[#e4f222]/25 bg-[#e4f222]/5 px-2.5 py-1 font-[family-name:var(--font-mono)] text-[10px] text-[#e4f222]">{DOCS.length} panduan</span>
        <span>Mulai dari Quick start, lalu buka Documentation untuk alur lengkap.</span>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOCS.map(({ slug: itemSlug, name, desc, Icon }, index) => (
          <button
            key={itemSlug}
            onClick={() => navigateHash(`#/resources/${itemSlug}`)}
            className={`${CARD} group text-left transition-all hover:-translate-y-0.5 hover:border-white/25`}
          >
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-lg bg-white/5 text-[#e4f222] transition-transform group-hover:scale-105"><Icon size={17} /></span>
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">{String(index + 1).padStart(2, "0")}</span>
            </div>
            <p className="mt-5 text-[13px] font-medium text-[#f7f8f8]">{name}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#8a8f98]">{desc}</p>
            <p className="mt-4 flex items-center gap-1 font-[family-name:var(--font-mono)] text-[10px] text-[#e4f222]">/resources/{itemSlug} <ArrowRight size={11} className="transition-transform group-hover:translate-x-1" /></p>
          </button>
        ))}
      </div>
    </Shell>
  )
}

export function ContactView() {
  const { notify } = useApp()
  return (
    <Shell title="How can we help?" lead="Pilih jalur yang paling sesuai. Kami biasanya menjawab dalam satu hari kerja.">
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {([
          { name: "Sales", desc: "Tanya paket, storage, atau minta demo untuk tim kamu.", action: "Talk to sales", Icon: LifeBuoy },
          { name: "Support", desc: "Tanya produk, laporkan masalah, atau kirim masukan.", action: "Contact support", Icon: MessageCircle },
          { name: "Other inquiries", desc: "Untuk press, partnership, dan pertanyaan lain.", action: "hello@virtour360.app", Icon: Mail },
        ] satisfies { name: string; desc: string; action: string; Icon: LucideIcon }[]).map(({ name, desc, action, Icon }) => (
          <div key={name} className={CARD}>
            <span className="grid size-9 place-items-center rounded-lg bg-white/5 text-[#e4f222]"><Icon size={17} /></span>
            <p className="mt-5 text-[14px] font-medium text-[#f7f8f8]">{name}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#8a8f98]">{desc}</p>
            {name === "Other inquiries" ? (
              <a href="https://instagram.com/vwrks" target="_blank" rel="noreferrer" className={BTN + " mt-6"}>
                instagram.com/vwrks <ArrowRight size={13} />
              </a>
            ) : (
              <button onClick={() => notify(`${name}: ${action}`)} className={BTN + " mt-6"}>{action} <ArrowRight size={13} /></button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-12 border-t border-white/[0.06] pt-8">
        <p className="text-[11px] uppercase tracking-wide text-[#62666d]">Resources</p>
        <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-[#8a8f98]">
          {[
            { label: "Community", route: "#/customers" },
            { label: "Documentation", route: "#/resources/documentation" },
            { label: "Hotspot guide", route: "#/resources/hotspot-guide" },
            { label: "Syarat & ketentuan", route: "#/resources/terms" },
            { label: "Privasi", route: "#/resources/privacy" },
          ].map(({ label, route }) => (
            <button key={label} onClick={() => navigateHash(route)} className="hover:text-white">{label}</button>
          ))}
        </div>
      </div>
    </Shell>
  )
}
