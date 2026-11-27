import { useCallback, useEffect, useRef, useState } from "react"

const GLOW =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='832' fill='none'%3E%3Cpath fill='%231C1D1E' d='M0 0h1280v832H0z'/%3E%3Cg filter='url(%23a)' opacity='0.22'%3E%3Crect width='240' height='560' x='781' y='133' fill='%23F7F8F8' rx='120' transform='rotate(45 781 133)'/%3E%3C/g%3E%3Cdefs%3E%3Cfilter id='a' width='722.274' height='722.274' x='306.726' y='54.706' color-interpolation-filters='sRGB' filterUnits='userSpaceOnUse'%3E%3CfeFlood flood-opacity='0' result='BackgroundImageFix'/%3E%3CfeBlend in='SourceGraphic' in2='BackgroundImageFix' result='shape'/%3E%3CfeGaussianBlur result='effect1_foregroundBlur_1_2' stdDeviation='64'/%3E%3C/filter%3E%3C/defs%3E%3C/svg%3E\")"

const MESSAGES = [
  { who: "ardhana", time: "09:12", text: "Sudah upload panorama Atrium. Scene-nya sudah nyambung lewat pintu utama." },
  { who: "lena", time: "09:14", text: "Boleh tambah hotspot article di dinding kiri?" },
]

/** Mengetik per huruf, lalu memberi aba-aba ke pesan berikutnya. */
function Typed({ text, active, index, advance }: { text: string; active: boolean; index: number; advance: (i: number) => void }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(text.length)
      advance(index)
      return
    }
    let i = 0
    const timer = window.setInterval(() => {
      i += 1
      setCount(i)
      if (i >= text.length) {
        window.clearInterval(timer)
        advance(index)
      }
    }, 16)
    return () => window.clearInterval(timer)
  }, [active, text, index, advance])

  return (
    <>
      {text.slice(0, count)}
      {count < text.length && <span className="typing-caret text-[#e4f222]">|</span>}
    </>
  )
}

/** Slack thread card dengan glow kanan + chat yang mengetik. */
export function SlackBox() {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const advance = useCallback((i: number) => setStep((s) => Math.max(s, i + 1)), [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ backgroundImage: GLOW, backgroundSize: "1280px 832px", backgroundPosition: "-200px -185px", borderRadius: 16 }}
    >
      <div className="p-5">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-[13px] text-white">
          <span>Thread</span>
          <span className="text-[#8a8f98]">#gallery</span>
        </div>
        <div className="mt-4 flex flex-col gap-5">
          {MESSAGES.map((m, i) => {
            const active = visible && step >= i
            return (
              <div
                key={`${m.who}-${m.time}`}
                className="flex gap-3 transition-opacity duration-300"
                style={{ opacity: active ? 1 : 0 }}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white/10 text-[10px] font-medium text-white">
                  {m.who.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] font-medium text-white">{m.who}</span>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[#62666d]">{m.time}</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-[1.6] text-[#d0d6e0]">
                    <Typed text={m.text} active={active} index={i} advance={advance} />
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[12px] text-[#8a8f98]">
          <span className="rounded bg-[#e4f222] px-1.5 py-0.5 font-medium text-[#08090a]">@Virtour360</span>
          buat hotspot dan assign ke scene Atrium
        </div>
      </div>
    </div>
  )
}
