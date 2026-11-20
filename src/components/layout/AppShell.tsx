import type { ReactNode, RefObject } from "react"

export function AppShell({
  containerRef,
  children,
}: {
  containerRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-zinc-950 text-zinc-50 antialiased"
    >
      {children}
    </div>
  )
}
