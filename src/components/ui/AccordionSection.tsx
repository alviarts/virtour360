import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

interface AccordionSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function AccordionSection({ title, children, defaultOpen = false }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="border-t border-zinc-800/80 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-full items-center justify-between px-3 text-left text-xs font-medium text-zinc-50 transition-colors hover:bg-white/[0.03]"
      >
        <span>{title}</span>
        <ChevronDown
          size={14}
          className={`text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="animate-fade-up px-3 pb-4">{children}</div>}
    </section>
  )
}
