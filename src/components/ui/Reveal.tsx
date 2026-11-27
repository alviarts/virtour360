import { useEffect, useRef, useState, type ReactNode } from "react"

/** Muncul sekali ketika elemen masuk viewport — bukan fade di setiap elemen. */
export function Reveal({ children, className = "", delay = 0, id }: { children: ReactNode; className?: string; delay?: number; id?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); observer.disconnect() } },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} id={id} className={`reveal ${shown ? "is-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}
