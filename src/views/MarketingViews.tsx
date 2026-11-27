import { type ReactNode } from "react"
import { ArrowRight, BookOpen, Globe2, LifeBuoy, Mail, MapPin, MessageCircle, Play, Sparkles, Users, type LucideIcon } from "lucide-react"
import { Logo360 } from "../components/ui/Logo360"
import { TourStage } from "../components/ui/TourStage"
import { useApp } from "../context/useApp"
import { navigate, navigateHash, profileSlug } from "../lib/navigation"
import { LOCAL_CREATORS } from "../data/creators"

const LINKS = ["Home", "Product", "Resources", "Customers", "Pricing", "Contact"] as const

function Shell({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <div className="h-full w-full overflow-y-auto bg-[#08090a] text-[#d0d6e0]">
      <header className="sticky top-0 z-30 h-[72px] border-b border-white/[0.06] bg-[#08090a]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1200px] items-center px-6">
          <button onClick={() => navigate("home")} className="flex items-center"><Logo360 tone="white" size={22} /></button>
          <nav className="ml-auto hidden items-center gap-5 text-[12px] md:flex">
            {LINKS.map((link) => (
              <button key={link} onClick={() => navigate(link.toLowerCase() as "product")} className="text-[#d0d6e0] transition-colors hover:text-white">{link}</button>
            ))}
          </nav>
          <div className="ml-5 flex items-center gap-2">
            <button onClick={() => navigate("login")} className="text-[12px] text-[#d0d6e0] hover:text-white">Log in</button>
            <button onClick={() => navigate("signup")} className="rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-[#08090a]">Sign up</button>
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
              <button key={link} onClick={() => navigate(link.toLowerCase() as "product")} className="hover:text-white">{link}</button>
            ))}
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
      <button onClick={() => navigate("home")} className={BTN + " mt-10"}>Lihat demo <ArrowRight size={13} /></button>
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
            {["Unlimited project", "3 GB storage", "7 tipe hotspot", "Panorama sampai 32K", "Publish ke link sendiri", "Tanpa watermark"].map((x) => <li key={x}>· {x}</li>)}
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
          <button onClick={() => navigate("contact")} className={BTN + " mt-8"}>Tanya sales <ArrowRight size={13} /></button>
        </div>
      </div>
    </Shell>
  )
}

export function CustomersView() {
  const { user } = useApp()
  const slug = profileSlug(user?.name, user?.uid)
  return (
    <Shell title="Explore tours from the community" lead="Karya kreator baru dan lama yang sudah dipublikasikan, dikumpulkan di satu tempat.">
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { name: user?.name ?? "ardhana", slug, title: "The Gallery · tour kamu", image: "/media/thumbnails/entrance_hall.jpg" },
          ...LOCAL_CREATORS.map((c, i) => ({
            name: c.name, slug: profileSlug(c.name, c.id), title: c.title,
            image: ["/media/thumbnails/art_studio.jpg", "/media/thumbnails/hotel_room.jpg", "/media/thumbnails/ballroom.jpg"][i % 3],
          })),
        ].map((c) => (
          <button key={c.slug} onClick={() => navigate("home")} className={`${CARD} overflow-hidden p-0 text-left transition-colors hover:border-white/25`}>
            <img src={c.image} alt="" className="h-32 w-full object-cover" />
            <div className="p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-white/10 text-[11px] text-white">{c.name.slice(0, 2).toUpperCase()}</span>
                <div className="min-w-0"><p className="truncate text-[13px] text-[#f7f8f8]">{c.name}</p><p className="truncate text-[11px] text-[#8a8f98]">{c.title}</p></div>
              </div>
              <p className="mt-4 truncate font-[family-name:var(--font-mono)] text-[10px] text-[#e4f222]">/u/{c.slug}</p>
            </div>
          </button>
        ))}
      </div>
    </Shell>
  )
}

export function ResourcesView() {
  const items = [
    { slug: "documentation", name: "Documentation", desc: "Panduan lengkap upload, scene, hotspot, dan publish.", body: "Mulai dari Dashboard: buat project, beri nama dan kategori, lalu buka Studio. Di Studio, unggah panorama equirectangular 2:1, susun scene di sidebar, lalu pasang hotspot di kanvas. Panel inspector mengatur judul, initial view, dan efek warna.", Icon: BookOpen },
    { slug: "quick-start", name: "Quick start", desc: "Buat tour pertama dalam tiga langkah.", body: "1. Buat project dari Dashboard. 2. Unggah satu JPG 360° lalu tambahkan scene kedua. 3. Hubungkan keduanya dengan hotspot navigasi dan klik Publish. Link /p/<slug> siap dibagikan dalam hitungan detik.", Icon: Play },
    { slug: "hotspot-guide", name: "Hotspot guide", desc: "Memilih tipe konten yang tepat untuk tiap titik.", body: "Sembilan tipe tersedia: Point untuk teks singkat, Chevron untuk pindah scene, Image dan Video untuk media, Sound untuk audio, Link untuk tautan eksternal, Compact untuk label ringkas, dan Product untuk kartu produk dengan CTA.", Icon: MapPin },
    { slug: "embed-share", name: "Embed & share", desc: "Pasang tour di website mana pun.", body: "Salin kode iframe dari modal Publish, lalu tempel di halaman website. Opsi fullscreen, VR, dan lazy loading bisa diatur. QR code otomatis dibuat dari link publish untuk dibagikan ke ponsel.", Icon: Globe2 },
    { slug: "community", name: "Community", desc: "Lihat karya kreator lain.", body: "Halaman Customers mengumpulkan tour dari kreator baru maupun lama yang sudah publish. Buka salah satu kartu untuk melihat profil dan karyanya.", Icon: Users },
    { slug: "changelog", name: "Changelog", desc: "Fitur terbaru yang kami kirim.", body: "Panel Design dengan tujuh preset tema, sembilan tipe hotspot sungguhan, publish dengan slug unik, mode demo per sesi browser, dan halaman marketing baru.", Icon: Sparkles },
  ]
  const slug = window.location.hash.match(/^#\/resources\/([^/?]+)/)?.[1]
  const current = items.find((item) => item.slug === slug)

  if (current) {
    return (
      <Shell title={current.name} lead={current.desc}>
        <div className={`${CARD} mt-12 max-w-[720px]`}>
          <span className="grid size-10 place-items-center rounded-lg bg-white/5 text-[#e4f222]"><current.Icon size={18} /></span>
          <p className="mt-6 text-[14px] leading-[1.7] text-[#d0d6e0]">{current.body}</p>
        </div>
        <button onClick={() => navigate("resources")} className={`${BTN} mt-8`}>Kembali ke Resources <ArrowRight size={13} /></button>
      </Shell>
    )
  }

  return (
    <Shell title="Resources and documentation" lead="Semua yang kamu butuhkan untuk membuat, mempublikasikan, dan membagikan tour 360°.">
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ slug: itemSlug, name, desc, Icon }) => (
          <button key={itemSlug} onClick={() => navigateHash(`#/resources/${itemSlug}`)} className={`${CARD} text-left transition-colors hover:border-white/25`}>
            <span className="grid size-9 place-items-center rounded-lg bg-white/5 text-[#e4f222]"><Icon size={17} /></span>
            <p className="mt-5 text-[13px] font-medium text-[#f7f8f8]">{name}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#8a8f98]">{desc}</p>
            <p className="mt-4 font-[family-name:var(--font-mono)] text-[10px] text-[#e4f222]">/resources/{itemSlug}</p>
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
          {["Community", "Documentation", "Developers", "System status"].map((x) => <button key={x} onClick={() => notify(x)} className="hover:text-white">{x}</button>)}
        </div>
      </div>
    </Shell>
  )
}
