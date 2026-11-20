import type { ReactNode } from "react"

export function Badge({ children, tone = "zinc" }: { children: ReactNode; tone?: "zinc" | "amber" | "blue" }) {
  const tones = {
    zinc: "border-zinc-700 bg-zinc-800/60 text-zinc-300",
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-400",
    blue: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  }
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}
