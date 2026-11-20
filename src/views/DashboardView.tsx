import { useState } from "react"
import {
  ChevronDown,
  Gift,
  Grid2X2,
  List,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react"
import { scenes } from "../data/scenes"
import { profile } from "../data/profile"
import { navigate } from "../lib/navigation"

const navItems = ["Project", "Media", "Tools", "Promotion", "Enterprise"]

function PanoeeLogo() {
  return (
    <button onClick={() => navigate("studio")} className="mr-6 flex items-center gap-2" title="Buka Studio">
      <span className="grid size-7 place-items-center rounded-lg bg-[#d1005c] text-sm font-black leading-none text-white">
        P
      </span>
      <span className="text-lg font-bold tracking-tight text-white">Panoee</span>
    </button>
  )
}

function ProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-[248px] overflow-hidden rounded-xl border border-zinc-700 bg-[#0c1612] text-left transition-colors hover:border-zinc-500"
    >
      <div className="relative h-[132px] overflow-hidden">
        <img
          src={scenes[0].thumbnail}
          alt="Pratinjau proyek"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-[10px] text-zinc-300">
            <Grid2X2 size={10} /> {scenes.length}
          </span>
          <span className="flex h-5 items-center rounded-full bg-[#0f9d6e] px-2 text-[10px] font-semibold text-white">
            Published
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="grid size-5 place-items-center rounded-full bg-zinc-700 text-[9px] font-semibold">
            {profile.initials}
          </span>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-zinc-200">{profile.initials}</span>
            <span className="text-[10px] text-zinc-500">14 minutes ago</span>
          </div>
        </div>
      </div>
    </button>
  )
}

export function DashboardView() {
  const [tab, setTab] = useState<"studio" | "live">("studio")
  const [showNotice, setShowNotice] = useState(true)

  return (
    <div className="relative h-full w-full overflow-y-auto bg-zinc-950 text-zinc-50">
      {/* Top navigation */}
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-1">
            <PanoeeLogo />
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item}
                  className={`relative flex h-8 items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${
                    item === "Project" ? "bg-zinc-800 text-zinc-50" : "text-zinc-300 hover:bg-white/5"
                  }`}
                >
                  {item}
                  {item === "Tools" && <ChevronDown size={12} />}
                  {item === "Promotion" && (
                    <span className="grid size-4 place-items-center rounded-full bg-amber-400 text-[9px] font-bold text-black">
                      3
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex h-6 items-center rounded-full bg-amber-400 px-2.5 text-[11px] font-semibold text-black">
              7d 10h 5m 12s Trial left
            </button>
            <button className="flex h-8 items-center gap-1.5 rounded-full border border-zinc-700 px-3 text-xs text-zinc-200 hover:bg-white/5">
              <Sparkles size={13} /> Changelog
            </button>
            <button className="flex h-8 items-center gap-1.5 rounded-full bg-[#d1005c] px-3 text-xs font-semibold text-white hover:bg-[#b80051]">
              <Plus size={14} strokeWidth={2.6} /> New Project
            </button>
            <button className="grid size-8 place-items-center rounded-full bg-orange-400 text-xs font-bold text-black">
              {profile.initials[0].toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-8 py-3">
        {/* Toolbar */}
        <div className="flex flex-col justify-between gap-4 py-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-zinc-800 p-0.5">
              {(["live", "studio"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`h-8 rounded px-3 text-xs font-medium capitalize transition-colors ${
                    tab === item ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate("portfolio")}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-200 hover:text-white"
            >
              ↗ View Public Profile
            </button>
          </div>

          {tab === "studio" && (
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-zinc-800 p-0.5">
                <button className="grid size-7 place-items-center rounded bg-zinc-800 text-zinc-100">
                  <Grid2X2 size={13} />
                </button>
                <button className="grid size-7 place-items-center rounded text-zinc-500 hover:text-zinc-200">
                  <List size={13} />
                </button>
              </div>
              <button className="flex h-9 w-28 items-center justify-between rounded-md border border-zinc-800 px-2.5 text-xs text-zinc-300">
                All <ChevronDown size={12} />
              </button>
              <button className="flex h-9 w-28 items-center justify-between rounded-md border border-zinc-800 px-2.5 text-xs text-zinc-300">
                All <ChevronDown size={12} />
              </button>
              <div className="flex h-9 w-56 items-center gap-2 rounded-md border border-zinc-800 px-2.5">
                <Search size={13} className="text-zinc-500" />
                <input placeholder="Search" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-zinc-600" />
              </div>
            </div>
          )}
        </div>

        {/* Konten */}
        {tab === "studio" ? (
          <div className="grid grid-cols-[repeat(auto-fill,248px)] gap-4 pt-2">
            <ProjectCard onClick={() => navigate("studio")} />
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-zinc-500">No posts on Live yet...</div>
        )}
      </main>

      {/* Policy notification */}
      {showNotice && (
        <div className="fixed bottom-8 right-8 z-30 w-[310px] animate-fade-up rounded-xl border border-zinc-800 bg-zinc-900/95 p-4 shadow-2xl">
          <div className="flex items-start justify-between">
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-black">
              Policy update
            </span>
            <button onClick={() => setShowNotice(false)} className="text-zinc-500 hover:text-zinc-200">
              <X size={13} />
            </button>
          </div>
          <h3 className="mt-3 text-sm font-semibold text-zinc-50">Changes after unsubscribing</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            From Oct 1/2026, premium features may be disabled or adjusted to Free plan limits.
          </p>
          <button className="mt-3 text-xs font-semibold text-zinc-100 hover:text-white">Learn more</button>
        </div>
      )}

      {/* Gift button */}
      <button className="fixed bottom-6 left-6 z-30 grid size-10 place-items-center rounded-full bg-amber-500 text-black shadow-lg">
        <Gift size={17} />
      </button>
    </div>
  )
}
