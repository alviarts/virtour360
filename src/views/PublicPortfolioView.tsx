import type { ReactNode } from "react"
import {
  Bell,
  Compass,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Search,
  Upload,
  User,
} from "lucide-react"
import { profile } from "../data/profile"
import { scenes } from "../data/scenes"
import { navigate } from "../lib/navigation"

const stats = [
  { value: "74", label: "Posts" },
  { value: "44", label: "Tours" },
  { value: "1313", label: "Views" },
  { value: "1", label: "Likes" },
]

const postCards = [
  { title: "Atrium — The Gallery", image: scenes[0].thumbnail, count: 4 },
  { title: "Studio — Creative Room", image: scenes[1].thumbnail, count: 1 },
  { title: "Terrace — Sunset View", image: scenes[2].thumbnail, count: 2 },
  { title: "2BR MASTER BEDROOM", image: scenes[0].thumbnail, count: 1 },
  { title: "Living Room 360", image: scenes[1].thumbnail, count: 3 },
  { title: "Trungtamyte", image: scenes[2].thumbnail, count: 1 },
  { title: "CT05 20260512 OVERVIEW 1", image: scenes[0].thumbnail, count: 1 },
  { title: "0512a", image: scenes[1].thumbnail, count: 1 },
]

const tourCards = [
  { title: "2BR CXL 20261119", image: scenes[0].thumbnail, comments: 0, likes: 1 },
  { title: "4BR CXL 20261119", image: scenes[1].thumbnail, comments: 0, likes: 1 },
  { title: "TienichTrongNha CXL 20261119", image: scenes[2].thumbnail, comments: 0, likes: 1 },
  { title: "ED CXL 20261119", image: scenes[0].thumbnail, comments: 2, likes: 0 },
  { title: "ED CXL 20261113", image: scenes[1].thumbnail, comments: 0, likes: 0 },
  { title: "Tienich ID CXL 20261024", image: scenes[2].thumbnail, comments: 8, likes: 0 },
]

function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("portfolio")} className="flex items-center gap-1.5">
          <span className="grid size-6 place-items-center rounded-md bg-slate-900 text-xs font-black text-white">P</span>
          <span className="text-lg font-bold tracking-tight text-slate-900">panoee</span>
        </button>
        <div className="flex h-9 w-64 items-center gap-2 rounded-full bg-slate-100 px-3.5">
          <Search size={15} className="text-slate-400" />
          <span className="flex-1 text-xs text-slate-400">Search</span>
          <span className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-500">⌘</span>
          <span className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-500">K</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex h-9 items-center gap-1.5 rounded-full bg-cyan-500 px-3.5 text-xs font-semibold text-white hover:bg-cyan-600">
          <Upload size={13} /> Create
        </button>
        <button onClick={() => navigate("studio")} className="flex h-9 items-center gap-1.5 rounded-full bg-[#d1005c] px-4 text-xs font-semibold text-white hover:bg-[#b80051]">
          <Compass size={13} /> Studio
        </button>
        <button className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-500">
          <Bell size={15} />
        </button>
        <button className="h-9 rounded-full border border-slate-200 px-4 text-xs font-medium text-slate-700">
          Login
        </button>
      </div>
    </header>
  )
}

function ProfileHeader() {
  return (
    <div className="flex flex-col items-center bg-white px-4 py-10">
      <div className="grid size-24 place-items-center rounded-full border-4 border-white bg-emerald-200 text-3xl shadow-md">
        {profile.initials.toUpperCase()}
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{profile.name}</h1>
      <p className="mt-0.5 text-sm text-slate-400">@ardhana.studio</p>
      <div className="mt-6 flex items-start gap-10">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center">
            <span className="text-xl font-bold text-slate-900">{stat.value}</span>
            <span className="mt-0.5 text-xs text-slate-400">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
      <span className="text-lg">▣</span> {children}
    </h2>
  )
}

function PostCard({ item }: { item: (typeof postCards)[number] }) {
  return (
    <button className="group text-left">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
        <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-slate-800/60 text-white backdrop-blur">
          <Heart size={13} />
        </span>
        <span className="absolute bottom-2 left-2 flex h-6 items-center gap-1 rounded-md bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
          360°
        </span>
        <span className="absolute bottom-2 right-2 flex h-6 items-center gap-1 rounded-md bg-slate-900/70 px-1.5 text-[10px] font-medium text-white">
          {item.count} ▣
        </span>
      </div>
      <p className="mt-2 truncate text-xs font-medium text-slate-800">{item.title}</p>
    </button>
  )
}

function TourCard({ item }: { item: (typeof tourCards)[number] }) {
  return (
    <button onClick={() => navigate("studio")} className="group text-left">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
        <img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-slate-800/60 text-white backdrop-blur">
          <Heart size={13} />
        </span>
        <span className="absolute bottom-2 left-2 flex h-6 items-center gap-1 rounded-md bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
          360°
        </span>
        {(item.comments > 0 || item.likes > 0) && (
          <span className="absolute right-2 top-10 flex h-6 items-center gap-1 rounded-md bg-slate-900/70 px-1.5 text-[10px] text-white">
            <MessageCircle size={10} /> {item.comments || item.likes}
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-xs font-medium text-slate-800">{item.title}</p>
    </button>
  )
}

function FloatingNav() {
  const items = [
    { label: "Home", icon: Home, active: true },
    { label: "Map", icon: MapPin },
    { label: "Author", icon: User },
    { label: "Explore", icon: Compass },
  ]
  return (
    <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/70 bg-white/90 px-2 py-1.5 shadow-xl backdrop-blur-md">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.label}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              item.active ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon size={14} /> {item.label}
          </button>
        )
      })}
    </div>
  )
}

export function PublicPortfolioView() {
  return (
    <div className="h-full w-full overflow-y-auto bg-[#f7f9fc] text-slate-900">
      <Header />
      <ProfileHeader />

      <div className="mx-auto max-w-[1200px] px-6 pb-28">
        {/* 360 posts */}
        <section className="rounded-2xl bg-[#eef2f8] p-6">
          <SectionTitle>360° posts by {profile.initials}</SectionTitle>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {postCards.map((item, i) => <PostCard key={i} item={item} />)}
          </div>
          <div className="mt-6 text-center">
            <button className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white">View more</button>
          </div>
        </section>

        {/* Promo banner */}
        <div className="mx-auto mt-8 flex max-w-[620px] overflow-hidden rounded-xl">
          <div className="relative w-2/5 bg-gradient-to-br from-fuchsia-600 via-pink-600 to-cyan-400">
            <div className="absolute inset-0 opacity-40 [background-image:repeating-linear-gradient(115deg,transparent,transparent_12px,rgba(255,255,255,0.35)_12px,rgba(255,255,255,0.35)_14px)]" />
          </div>
          <div className="flex w-3/5 flex-col justify-center bg-[#d1005c] px-5 py-5 text-white">
            <p className="text-sm font-bold leading-snug">
              Publish Advanced &amp; Premium Virtual Tours in Panoee Studio
            </p>
            <button onClick={() => navigate("studio")} className="mt-3 w-fit rounded border border-white/60 px-3 py-1.5 text-[10px] font-semibold tracking-wide">
              EXPLORE NOW →
            </button>
          </div>
        </div>

        {/* Virtual tours */}
        <section className="mt-10 rounded-2xl bg-[#eef2f8] p-6">
          <SectionTitle>Virtual tours by {profile.initials}</SectionTitle>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {tourCards.map((item, i) => <TourCard key={i} item={item} />)}
          </div>
          <div className="mt-6 text-center">
            <button className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white">View more</button>
          </div>
        </section>

        {/* Footer CTA */}
        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Share your world in 360</h3>
            <p className="mt-1 text-xs text-slate-500">
              Turn this dead-end into your next discovery by publishing your own panorama.
            </p>
          </div>
          <button className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-cyan-500 px-4 text-xs font-semibold text-white hover:bg-cyan-600">
            Upload your own 360 →
          </button>
        </div>
      </div>

      <FloatingNav />
    </div>
  )
}
