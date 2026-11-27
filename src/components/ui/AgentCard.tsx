const DOTS = Array.from({ length: 15 }, (_, i) => i)

/** Kartu agent dengan loader titik dan label sweep, mengikuti linear.app. */
export function AgentCard({ label = "Setting up DRV/rideshare-app…", time = "00:07" }: { label?: string; time?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[12px]">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        {DOTS.map((i) => (
          <circle
            key={i}
            className="agent-dot"
            cx={1 + (i % 5) * 3.5}
            cy={1 + Math.floor(i / 5) * 3.5}
            r="1"
            fill="#d0d6e0"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </svg>
      <span className="min-w-0 flex-1 truncate text-[#d0d6e0]">{label}</span>
      <span className="agent-sweep font-[family-name:var(--font-mono)] text-[10px] text-[#8a8f98]">{time}</span>
    </div>
  )
}
