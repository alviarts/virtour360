import { useEffect, useMemo, useState } from "react"
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDot,
  Command,
  Filter,
  Inbox,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react"
import { Logo360 } from "../components/ui/Logo360"
import { navigate } from "../lib/navigation"
import { useApp } from "../context/useApp"

type Status = "Backlog" | "Todo" | "In Progress" | "Done"

interface Issue {
  id: string
  title: string
  status: Status
  label: string
  priority: 0 | 1 | 2 | 3
  assignee: string
}

const ISSUES: Issue[] = [
  { id: "VIR-241", title: "Perpanjang transisi antar scene", status: "Backlog", label: "Viewer", priority: 2, assignee: "AW" },
  { id: "VIR-238", title: "Tambah filter kategori di halaman publik", status: "Backlog", label: "Frontend", priority: 1, assignee: "RH" },
  { id: "VIR-235", title: "Dokumentasi alur publish", status: "Backlog", label: "Docs", priority: 0, assignee: "DK" },
  { id: "VIR-230", title: "Simpan slug project hasil publish", status: "Todo", label: "Backend", priority: 3, assignee: "AW" },
  { id: "VIR-229", title: "Popup hotspot tipe product", status: "Todo", label: "Viewer", priority: 2, assignee: "RH" },
  { id: "VIR-226", title: "Perbaiki kontras teks pada panel gelap", status: "Todo", label: "Design", priority: 1, assignee: "DK" },
  { id: "VIR-221", title: "Parallax layer pada hero", status: "In Progress", label: "Design", priority: 2, assignee: "AW" },
  { id: "VIR-218", title: "Gate password untuk tour privat", status: "In Progress", label: "Backend", priority: 3, assignee: "RH" },
  { id: "VIR-204", title: "Hash router untuk tujuh rute", status: "Done", label: "Frontend", priority: 1, assignee: "AW" },
  { id: "VIR-199", title: "Konversi derajat ke radian PSV", status: "Done", label: "Viewer", priority: 3, assignee: "RH" },
]

const STATUSES: Status[] = ["Backlog", "Todo", "In Progress", "Done"]

function StatusIcon({ status }: { status: Status }) {
  if (status === "Done") return <CheckCircle2 size={14} className="text-[#27a644]" />
  if (status === "In Progress") return <CircleDot size={14} className="text-[#e4f222]" />
  if (status === "Todo") return <Circle size={14} className="text-[#8a8f98]" />
  return <span className="block size-3.5 rounded-full border border-dashed border-[#62666d]" />
}

function Priority({ value }: { value: number }) {
  return <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#62666d]">{"▮".repeat(value) || "–"}</span>
}

export function LabView() {
  const { user } = useApp()
  const [selectedId, setSelectedId] = useState<string | null>("VIR-221")
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All")

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPaletteOpen((v) => !v)
      }
      if (event.key === "Escape") setPaletteOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const visible = useMemo(
    () => ISSUES.filter((i) =>
      (statusFilter === "All" || i.status === statusFilter) &&
      (i.title.toLowerCase().includes(query.toLowerCase()) || i.id.toLowerCase().includes(query.toLowerCase()))),
    [query, statusFilter],
  )

  const selected = ISSUES.find((i) => i.id === selectedId) ?? null

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#08090a] text-[#d0d6e0] antialiased">
      {/* Sidebar workspace */}
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[#23252a] bg-[#0f1011] md:flex">
        <div className="flex h-11 items-center gap-2 border-b border-[#23252a] px-3">
          <Logo360 tone="white" showText={false} size={20} />
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#ffffff]">Virtour360</span>
          <ChevronDown size={13} className="text-[#8a8f98]" />
        </div>
        <div className="px-2 py-2">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-8 w-full items-center gap-2 rounded-md border border-[#23252a] bg-[#161718] px-2 text-[12px] text-[#8a8f98] hover:border-[#383b3f]"
          >
            <Search size={13} /> Cari atau lompat ke…
            <span className="ml-auto rounded border border-[#23252a] px-1 font-[family-name:var(--font-mono)] text-[9px]">⌘K</span>
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 px-2 text-[13px]">
          {[
            { label: "Inbox", icon: Inbox, badge: "3" },
            { label: "My issues", icon: CircleDot },
            { label: "Projects", icon: Sparkles },
          ].map(({ label, icon: Icon, badge }) => (
            <button key={label} className="flex h-8 items-center gap-2 rounded-md px-2 text-[#d0d6e0] hover:bg-[#161718]">
              <Icon size={14} className="text-[#8a8f98]" /> {label}
              {badge && <span className="ml-auto rounded bg-[#23252a] px-1.5 font-[family-name:var(--font-mono)] text-[10px] text-[#8a8f98]">{badge}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-5 px-2">
          <p className="px-2 pb-1 text-[10px] uppercase tracking-wide text-[#62666d]">Team</p>
          <button className="flex h-8 w-full items-center gap-2 rounded-md bg-[#161718] px-2 text-[13px] text-[#ffffff]">
            <span className="grid size-5 place-items-center rounded bg-[#7AA2FF]/15 font-[family-name:var(--font-mono)] text-[9px] text-[#7AA2FF]">VIR</span>
            Virtour
            <ChevronDown size={12} className="ml-auto text-[#8a8f98]" />
          </button>
          <div className="mt-1 flex flex-col pl-3">
            {["Issues", "Roadmap", "Cycles", "Views"].map((item) => (
              <button key={item} className={`flex h-7 items-center rounded-md px-2 text-[12px] ${item === "Issues" ? "text-[#ffffff]" : "text-[#8a8f98] hover:text-[#d0d6e0]"}`}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-auto flex h-11 items-center gap-2 border-t border-[#23252a] px-3 text-[12px]">
          <span className="grid size-6 place-items-center rounded bg-[#23252a] font-[family-name:var(--font-mono)] text-[9px] text-[#d0d6e0]">{user?.initials ?? "LA"}</span>
          <span className="truncate text-[#8a8f98]">{user?.name ?? "Lab account"}</span>
          <Settings size={13} className="ml-auto text-[#62666d]" />
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center gap-3 border-b border-[#23252a] px-4 text-[12px]">
          <span className="text-[#8a8f98]">VIR</span>
          <span className="text-[#62666d]">/</span>
          <span className="text-[#ffffff]">Issues</span>
          <button onClick={() => setPaletteOpen(true)} className="ml-2 flex items-center gap-1 rounded border border-[#23252a] px-2 py-1 text-[11px] text-[#8a8f98] hover:border-[#383b3f]">
            <Filter size={12} /> Filter
          </button>
          <button onClick={() => setStatusFilter(statusFilter === "All" ? "Todo" : "All")} className="flex items-center gap-1 rounded border border-[#23252a] px-2 py-1 text-[11px] text-[#8a8f98] hover:border-[#383b3f]">
            <SlidersHorizontal size={12} /> {statusFilter === "All" ? "All statuses" : statusFilter}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => navigate("home")} className="rounded border border-[#23252a] px-2 py-1 text-[11px] text-[#8a8f98] hover:text-[#d0d6e0]">Keluar lab</button>
            <button className="flex h-7 items-center gap-1.5 rounded-md bg-[#7AA2FF] px-3 text-[12px] font-medium text-[#08090a] hover:brightness-110">
              <Plus size={13} /> New issue
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto">
            {STATUSES.map((status) => {
              const rows = visible.filter((i) => i.status === status)
              if (!rows.length) return null
              return (
                <section key={status}>
                  <div className="flex h-8 items-center gap-2 border-b border-[#23252a] bg-[#0f1011] px-4 text-[11px]">
                    <StatusIcon status={status} />
                    <span className="text-[#d0d6e0]">{status}</span>
                    <span className="font-[family-name:var(--font-mono)] text-[#62666d]">{rows.length}</span>
                  </div>
                  {rows.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => setSelectedId(issue.id)}
                      className={`group flex h-10 w-full items-center gap-3 border-b border-[#23252a]/70 px-4 text-left text-[13px] hover:bg-[#0f1011] ${selectedId === issue.id ? "bg-[#0f1011]" : ""}`}
                    >
                      <StatusIcon status={issue.status} />
                      <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#62666d]">{issue.id}</span>
                      <span className={`min-w-0 flex-1 truncate ${selectedId === issue.id ? "text-[#ffffff]" : "text-[#d0d6e0]"}`}>{issue.title}</span>
                      <span className="hidden rounded bg-[#23252a]/70 px-1.5 py-0.5 text-[10px] text-[#8a8f98] sm:inline">{issue.label}</span>
                      <Priority value={issue.priority} />
                      <span className="grid size-5 shrink-0 place-items-center rounded bg-[#23252a] font-[family-name:var(--font-mono)] text-[9px] text-[#d0d6e0]">{issue.assignee}</span>
                    </button>
                  ))}
                </section>
              )
            })}
            {!visible.length && <p className="p-10 text-center text-[12px] text-[#62666d]">Tidak ada issue cocok.</p>}
          </div>

          {/* Detail */}
          {selected && (
            <aside className="hidden w-[360px] shrink-0 flex-col border-l border-[#23252a] bg-[#0f1011] lg:flex">
              <div className="flex h-11 items-center gap-2 border-b border-[#23252a] px-4 text-[12px] text-[#8a8f98]">
                <StatusIcon status={selected.status} />
                <span className="font-[family-name:var(--font-mono)] text-[11px]">{selected.id}</span>
                <MoreHorizontal size={14} className="ml-auto" />
                <button onClick={() => setSelectedId(null)} className="hover:text-[#d0d6e0]"><X size={14} /></button>
              </div>
              <div className="overflow-y-auto px-5 py-6">
                <h2 className="text-[20px] font-normal leading-[1.33] tracking-[-0.012em] text-[#ffffff]">{selected.title}</h2>
                <p className="mt-4 text-[13px] leading-relaxed text-[#8a8f98]">
                  Contoh issue di lab UI. Panel ini memakai sudut 6px, hairline `#23252a`, dan tipografi Inter weight 400–510 — tanpa shadow tebal.
                </p>
                <div className="mt-6 space-y-3 border-t border-[#23252a] pt-5 text-[12px]">
                  <div className="flex justify-between"><span className="text-[#62666d]">Status</span><span className="text-[#d0d6e0]">{selected.status}</span></div>
                  <div className="flex justify-between"><span className="text-[#62666d]">Label</span><span className="rounded bg-[#23252a] px-1.5 py-0.5 text-[10px] text-[#8a8f98]">{selected.label}</span></div>
                  <div className="flex justify-between"><span className="text-[#62666d]">Assignee</span><span className="font-[family-name:var(--font-mono)] text-[#d0d6e0]">{selected.assignee}</span></div>
                  <div className="flex justify-between"><span className="text-[#62666d]">Priority</span><Priority value={selected.priority} /></div>
                </div>
                <div className="mt-6 border-t border-[#23252a] pt-4">
                  <p className="text-[11px] text-[#62666d]">Activity</p>
                  <div className="mt-3 flex gap-2 text-[12px]">
                    <span className="grid size-6 shrink-0 place-items-center rounded bg-[#23252a] font-[family-name:var(--font-mono)] text-[9px]">{selected.assignee}</span>
                    <p className="text-[#8a8f98]">membuat issue ini <span className="text-[#62666d]">· kemarin</span></p>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Command palette */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[18vh] backdrop-blur-sm" onClick={() => setPaletteOpen(false)}>
          <div className="w-full max-w-lg overflow-hidden rounded-lg border border-[#383b3f] bg-[#0f1011] shadow-[rgba(8,9,10,.6)_0_4px_32px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-11 items-center gap-2 border-b border-[#23252a] px-3">
              <Search size={15} className="text-[#8a8f98]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari issue atau jalankan perintah…"
                className="min-w-0 flex-1 bg-transparent text-[13px] text-[#ffffff] outline-none placeholder:text-[#62666d]"
              />
              <span className="rounded border border-[#23252a] px-1.5 font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">ESC</span>
            </div>
            <div className="max-h-[320px] overflow-y-auto p-1.5 text-[12px]">
              <p className="px-2 py-1.5 text-[10px] uppercase tracking-wide text-[#62666d]">Commands</p>
              {[
                { label: "Buat issue baru", icon: Plus, run: () => setPaletteOpen(false) },
                { label: "Buka Inbox", icon: Inbox, run: () => setPaletteOpen(false) },
                { label: "Kembali ke Home", icon: Command, run: () => { setPaletteOpen(false); navigate("home") } },
              ].map(({ label, icon: Icon, run }) => (
                <button key={label} onClick={run} className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-[#d0d6e0] hover:bg-[#161718]">
                  <Icon size={13} className="text-[#8a8f98]" /> {label}
                </button>
              ))}
              <p className="px-2 pb-1.5 pt-2 text-[10px] uppercase tracking-wide text-[#62666d]">Issues</p>
              {visible.slice(0, 5).map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => { setSelectedId(issue.id); setPaletteOpen(false) }}
                  className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[#d0d6e0] hover:bg-[#161718]"
                >
                  <StatusIcon status={issue.status} />
                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">{issue.id}</span>
                  <span className="min-w-0 flex-1 truncate">{issue.title}</span>
                  <Check size={12} className="text-[#62666d]" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 border-t border-[#23252a] px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">
              <span>↑↓ navigate</span><span>↵ select</span><span>esc close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
