import { useEffect, useRef, useState } from "react"
import { ArrowRight, ChevronRight } from "lucide-react"
import { Logo360 } from "../components/ui/Logo360"
import { PublicViewerModal } from "../components/viewer/PublicViewerModal"
import { SlackBox } from "../components/ui/SlackBox"
import { TourStage } from "../components/ui/TourStage"
import { AgentCard } from "../components/ui/AgentCard"
import { FeatureVisual } from "../components/ui/FeatureVisual"
import { Reveal } from "../components/ui/Reveal"
import { useApp } from "../context/useApp"
import { navigate, navigateHash, navigateProfile } from "../lib/navigation"

const NAV = ["Home", "Product", "Resources", "Customers", "Pricing", "Contact"]

const MENUS: Record<string, { title: string; detail: string }[]> = {
  Product: [
    { title: "Issues", detail: "Lacak hotspot, bug, dan progres tiap scene" },
    { title: "Projects", detail: "Kumpulkan tour dan scene dalam satu project" },
    { title: "Roadmap", detail: "Rencanakan apa yang akan dirilis berikutnya" },
    { title: "Cycles", detail: "Kerja dalam putaran yang fokus dan terukur" },
    { title: "Insights", detail: "Lihat view dan interaksi pengunjung per scene" },
  ],
  Resources: [
    { title: "Documentation", detail: "Panduan lengkap upload, hotspot, dan publish" },
    { title: "Guides", detail: "Resep singkat untuk tour properti, museum, dan kelas" },
    { title: "Changelog", detail: "Catatan fitur yang baru saja kami kirim" },
    { title: "Community", detail: "Lihat karya kreator lain dan bagikan milikmu" },
  ],
}

const FEATURES = [
  {
    title: "A new species of product tool",
    lead: "Purpose-built for modern teams.",
    body: "Upload panoramas, arrange scenes and place hotspots in one workspace. No plugin hunting, no template wrestling.",
    tag: "studio / scene editor",
    chips: ["Scene +", "Hotspot +", "Media +"],
  },
  {
    title: "Turn your 360 JPG into a live tour",
    lead: "From single panorama to visual studio.",
    body: "Drop an equirectangular JPG, arrange scenes, add hotspots and watch it become a walkable tour.",
    tag: "layout_1.jpg → live visual studio",
    chips: ["Scene +", "Hotspot +", "Publish +"],
  },
  {
    title: "AI and automations",
    lead: "For the repetitive parts.",
    body: "Generate titles, suggest hotspots and tidy descriptions while you keep your hands on the panorama.",
    tag: "/p/<uid> / published",
    chips: ["Publish +", "QR +", "Embed +"],
  },
]

const KINDS = ["posts", "tours", "publish"] as const

/** Teks yang mengetik saat masuk viewport. */
function ScrollTyped({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null)
  const [count, setCount] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setCount(text.length); return }
      let i = 0
      const timer = window.setInterval(() => {
        i += 1
        setCount(i)
        if (i >= text.length) window.clearInterval(timer)
      }, 20)
    }, { threshold: 0.3 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [text])
  return (
    <p ref={ref} className={className}>
      {text.slice(0, count)}
      {count < text.length && <span className="typing-caret text-[#e4f222]">|</span>}
    </p>
  )
}

export function PublicHomeView() {
  const { user, setDemoMode, logout, notify } = useApp()
  const [menu, setMenu] = useState("")

  const goCreate = () => navigate(user ? "dashboard" : "signup")
  const goSignUp = () => navigate("signup")
  const goLogin = () => navigate(user ? "dashboard" : "login")
  const [layoutOpen, setLayoutOpen] = useState(false)
  const agentLabels = ["Menyiapkan scene Atrium…", "Publish ke /p/the-gallery"]
  const agentTimes = ["00:07", "00:23"]
  const publishedUid = typeof window !== "undefined" ? localStorage.getItem("virtour360.publishedUid") : null

  return (
    <div id="home-root" className="h-full w-full overflow-y-auto bg-[#08090a] text-[#d0d6e0] antialiased">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-[12px] focus:text-[#08090a]">
        Lewati ke konten
      </a>
      {/* Nav tetap ala Linear */}
      <header
        className="sticky relative top-0 z-40 h-[72px]"
        onMouseLeave={() => setMenu("")}
        style={{ background: "linear-gradient(rgba(11,11,11,.8) 0%, rgba(27,27,28,.76) 100%)", backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto flex h-full max-w-[1200px] items-center px-6">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2">
            <Logo360 tone="white" size={22} />
          </button>
          <nav className="ml-auto hidden items-center gap-4 text-[12px] text-[#d0d6e0] md:flex">
            {NAV.map((item) => (
              <div key={item} className="relative">
                <button
                  onMouseEnter={() => setMenu(item)}
                  onClick={() => navigate(item.toLowerCase() as "product")}
                  className={`transition-colors hover:text-white ${menu === item ? "text-white" : ""}`}
                >
                  {item}
                </button>

                {MENUS[item] && menu === item && (
                  <div className="absolute left-0 top-full z-50 mt-3 w-[300px] rounded-lg border border-white/10 bg-[#0f1011] p-2 shadow-[0_16px_50px_-24px_rgba(0,0,0,.9)]">
                    <p className="px-2 pb-2 pt-1 font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">{item.toLowerCase()}</p>
                    {MENUS[item].map((entry) => (
                      <button
                        key={entry.title}
                        onClick={() => {
                          setMenu("")
                          if (entry.title === "Changelog") document.getElementById("changelog")?.scrollIntoView({ behavior: "smooth" })
                          else document.getElementById("product")?.scrollIntoView({ behavior: "smooth" })
                        }}
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

          <div className="ml-2 flex items-center gap-2 text-[12px] md:ml-10">
            {user ? (
              <button onClick={() => navigate("dashboard")} className="flex items-center gap-2 rounded-full border border-white/10 px-2.5 py-1.5 hover:bg-white/5">
                <span className="grid size-5 place-items-center rounded-full bg-[#e4f222] text-[9px] font-semibold text-[#08090a]">{user.initials}</span>
                <span className="max-w-24 truncate text-[#d0d6e0]">{user.name}</span>
              </button>
            ) : null}
            {user && (
              <button
                onClick={() => { logout(); notify("Anda telah keluar."); navigate("home") }}
                title="Keluar"
                className="rounded-full border border-white/10 px-2 py-1.5 text-[11px] text-[#8a8f98] hover:text-white"
              >
                Keluar
              </button>
            )}
            {!user && (
              <>
                <button onClick={goLogin} className="text-[#d0d6e0] hover:text-white">Log in</button>
                <button onClick={goSignUp} className="h-7 rounded-full bg-white px-3.5 font-medium text-[#08090a] hover:bg-[#e5e5e6]">Sign up</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-3 pb-24 pt-24 sm:px-4 lg:pt-32">
        {/* Grid titik_background seperti linear.app */}
        <div className="dot-grid pointer-events-none absolute right-[4%] top-16 hidden w-[420px] grid-cols-12 gap-x-9 gap-y-7 opacity-40 sm:grid">
          {Array.from({ length: 84 }, (_, i) => (
            <span key={i} style={{ animationDelay: `${(i % 12) * 0.11}s` }} />
          ))}
        </div>
        <div className="mx-auto max-w-[1200px]">
          <button onClick={() => navigateProfile(user?.name, user?.uid)} className="flex items-center gap-1 text-[12px] text-[#d0d6e0] hover:text-white">
            New — Virtual tour 360° <ArrowRight size={12} />
          </button>
          <h1
            className="mt-5 max-w-[900px] text-[42px] leading-[1.02] tracking-[-0.022em] text-white sm:text-[56px] lg:text-[64px]"
            style={{ fontWeight: 510 }}
          >
            Virtual tour software for teams and creators
            <span className="text-[#8a8f98]">. Built to publish, not to fiddle.</span>
          </h1>
          <p className="mt-6 max-w-[540px] text-[15px] leading-[1.6] text-[#8a8f98]">
            Upload 360° panoramas, connect scenes, add hotspots and share a tour in minutes. Everything in one quiet workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={goCreate} className="h-9 rounded-md bg-[#e4f222] px-4 text-[13px] font-medium text-[#08090a] hover:brightness-110">Start free</button>
            <button onClick={() => { setDemoMode(true); navigate("studio") }} className="h-9 rounded-md border border-[#23252a] px-4 text-[13px] text-[#d0d6e0] hover:border-[#383b3f]">Buka demo studio</button>
          </div>

        </div>

        {/* Atmospheric floor — menyatu penuh, tidak terputus */}
        <div className="hero-floor pointer-events-none absolute inset-0" />

        {/* Stage produk tanpa frame — fade, shadow, dan reveal saat scroll */}
        <Reveal id="product" className="relative mx-auto mt-16 w-full max-w-[1344px]" delay={80}>
          <div className="stage-wrapper">
            <div className="product-stage product-frame rounded-xl bg-[#090a0b] p-2 lg:scale-[1.02]">
              <TourStage />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Feature sections — 96px rhythm, two-tone headings */}
      <main id="main-content" className="mx-auto max-w-[1200px] px-6 pb-24">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.tag} delay={index * 80}>
          <section id={index === 2 ? "customers" : undefined} className="mt-24 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className={index === 2 ? "lg:order-2" : ""}>
              <p className="font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">Fig 0.{index + 1}</p>
              <h2
                className="mt-3 text-[32px] leading-[1.13] tracking-[-0.022em] text-white"
                style={{ fontWeight: 510 }}
              >
                {feature.title}
                <span className="block text-[#8a8f98]">{feature.lead}</span>
              </h2>
              <p className="mt-5 max-w-[440px] text-[15px] leading-[1.6] text-[#8a8f98]">{feature.body}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {feature.chips.map((chip) => (
                  <span key={chip} className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[10px] text-[#8a8f98]">{chip}</span>
                ))}
                {index === 1 && (
                  <button
                    onClick={() => setLayoutOpen(true)}
                    className="rounded-full bg-[#e4f222] px-2.5 py-1 text-[10px] font-medium text-[#08090a] hover:brightness-110"
                  >
                    Live layout_1.jpg
                  </button>
                )}
              </div>
              <button
                onClick={() => (index === 2 && publishedUid ? navigateHash(`#/p/${publishedUid}`) : goCreate())}
                className="mt-6 flex items-center gap-1 text-[13px] text-[#d0d6e0] hover:text-white"
              >
                {index === 2 ? "Lihat tour yang dipublish" : "Coba sekarang"} <ChevronRight size={13} />
              </button>
            </div>
            <div className={`feature-frame relative overflow-hidden rounded-lg ${index === 2 ? "lg:order-1 lg:w-full" : "lg:-mr-24 lg:w-[calc(100%+96px)]"}`}>
              <FeatureVisual kind={KINDS[index]} flip={index === 2} onLive={() => setLayoutOpen(true)} />
              <p className="px-2 py-2 font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">{feature.tag}</p>
            </div>
          </section>
          </Reveal>
        ))}

        <Reveal delay={60}>
        <section className="mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-[32px] leading-[1.13] tracking-[-0.022em] text-white" style={{ fontWeight: 510 }}>
              Intake and integrations
              <span className="block text-[#8a8f98]">From any conversation.</span>
            </h2>
            <p className="mt-5 max-w-[440px] text-[15px] leading-[1.6] text-[#8a8f98]">
              Turn feedback and requests into tour issues automatically. Drop a link in any thread and it lands in the right place, already routed and labeled.
            </p>
            <button onClick={goCreate} className="mt-6 flex items-center gap-1 text-[13px] text-[#d0d6e0] hover:text-white">
              Lihat integrasi <ChevronRight size={13} />
            </button>
          </div>
          <SlackBox />
        </section>
        </Reveal>

        <Reveal delay={60}>
        <section className="mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-[32px] leading-[1.13] tracking-[-0.022em] text-white" style={{ fontWeight: 510 }}>
              Susun, tinjau, dan bagikan
              <span className="block text-[#8a8f98]">Semua dari satu workspace.</span>
            </h2>
            <p className="mt-5 max-w-[440px] text-[15px] leading-[1.6] text-[#8a8f98]">
              Upload panorama, hubungkan scene, pasang hotspot, lalu publish. Semua berjalan di satu alur tanpa pindah aplikasi.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {agentLabels.map((label, i) => (
              <Reveal key={label} delay={i * 350}>
                <AgentCard label={label} time={agentTimes[i]} />
              </Reveal>
            ))}
          </div>
        </section>
        </Reveal>

        {/* Customer strip */}
        <section id="customers" className="mt-24">
          <p className="text-center font-[family-name:var(--font-mono)] text-[11px] text-[#62666d]">dipakai untuk portofolio, properti, museum, dan ruang kerja</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Atrium Studio", "Tour properti kami selesai dalam satu hari."],
              ["Creative Room", "Hotspot-nya mudah diatur, bahkan oleh tim non-teknis."],
              ["Sunset Terrace", "Link publish-nya langsung bisa dibagikan ke klien."],
            ].map(([name, quote]) => (
              <div key={name} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <ScrollTyped text={`“${quote}”`} className="text-[12px] leading-relaxed text-[#d0d6e0]" />
                <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">{name}</p>
              </div>
            ))}
          </div>
        </section>

        <Reveal delay={60}>
        <section id="changelog" className="mt-24">
          <h2 className="text-[32px] leading-[1.13] tracking-[-0.022em] text-white" style={{ fontWeight: 510 }}>
            Changelog
            <span className="block text-[#8a8f98]">What shipped recently.</span>
          </h2>
          <div className="mt-6 flex flex-col">
            {[
              ["Nov 2026", "Panel Design dan style hotspot", "Atur 7 preset tema, ikon, label, dan efek marker langsung di studio."],
              ["Okt 2026", "Publish ke link sendiri", "Slug, QR, embed, dan proteksi password kini benar-benar bekerja."],
              ["Sep 2026", "9 tipe hotspot", "Point hingga Product kini jadi tipe data nyata, bukan alias."],
            ].map(([date, title, desc], i) => (
              <Reveal key={title} delay={i * 140}>
                <div className="grid gap-1 border-b border-[#23252a] py-4 sm:grid-cols-[100px_1fr] sm:gap-4">
                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">{date}</span>
                  <div>
                    <p className="text-[13px] text-white">{title}</p>
                    <ScrollTyped text={desc} className="mt-1 text-[12px] text-[#8a8f98]" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
        </Reveal>

        <Reveal delay={60}>
        <section className="relative mt-24 overflow-hidden rounded-xl border border-[#23252a] bg-[#0f1011] px-8 py-14 text-center shadow-[inset_0_0_0_1px_#23252a]">
          <svg className="pointer-events-none absolute -right-16 -top-16 size-[380px] text-white opacity-50 [animation:logoTurn_40s_linear_infinite]" viewBox="0 0 200 200" fill="none" aria-hidden="true">
            <circle cx="100" cy="100" r="76" stroke="currentColor" strokeWidth="0.7" />
            <ellipse cx="100" cy="100" rx="76" ry="26" stroke="currentColor" strokeWidth="0.7" />
            <ellipse cx="100" cy="100" rx="76" ry="52" stroke="currentColor" strokeWidth="0.7" />
            <ellipse cx="100" cy="100" rx="26" ry="76" stroke="currentColor" strokeWidth="0.7" />
            <ellipse cx="100" cy="100" rx="52" ry="76" stroke="currentColor" strokeWidth="0.7" />
            <path d="M24 100h152M100 24v152" stroke="currentColor" strokeWidth="0.7" />
          </svg>
          <div className="relative">
          <h2 className="text-[32px] tracking-[-0.022em] text-white" style={{ fontWeight: 510 }}>Bangun tour pertamamu hari ini</h2>
          <p className="mx-auto mt-3 max-w-[460px] text-[15px] text-[#8a8f98]">Gratis untuk mulai. Publikasi ke link sendiri tanpa watermark.</p>
          <button onClick={goCreate} className="mt-7 h-9 rounded-md bg-[#e4f222] px-4 text-[13px] font-medium text-[#08090a] hover:brightness-110">Start free</button>
          </div>
        </section>
        </Reveal>
      </main>

      <footer className="border-t border-[#23252a] px-6 py-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Logo360 tone="white" size={24} />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-[#8a8f98]">
            <button onClick={() => navigate("product")} className="hover:text-white">Product</button>
            <button onClick={() => navigate("pricing")} className="hover:text-white">Pricing</button>
            <button onClick={() => navigate("customers")} className="hover:text-white">Customers</button>
            <button onClick={() => navigate("resources")} className="hover:text-white">Resources</button>
            <button onClick={() => navigate("contact")} className="hover:text-white">Contact</button>
            <a href="https://instagram.com/vwrks" target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a>
          </div>
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">© 2026 Virtour360</span>
        </div>
      </footer>

      {layoutOpen && (
        <PublicViewerModal
          title="Live layout_1.jpg — Visual Studio"
          panorama="/media/panoramas/layout_1.jpg"
          onClose={() => setLayoutOpen(false)}
        />
      )}
    </div>
  )
}
