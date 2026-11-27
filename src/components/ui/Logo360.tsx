interface Logo360Props {
  tone?: "pink" | "dark" | "white"
  showText?: boolean
  size?: number
  className?: string
}

/** Mark baru: kubus miring dengan garis dalam — monokrom, tanpa angka 360. */
export function Logo360({ tone = "pink", showText = true, size = 30, className = "" }: Logo360Props) {
  const color = tone === "dark" ? "#0f172a" : "#ffffff"
  const textClass = tone === "dark" ? "text-[#0f172a]" : "text-white"

  return (
    <span className={`inline-flex shrink-0 items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <g className="logo-mark" transform="rotate(45 20 20)" style={{ transformOrigin: "20px 20px" }}>
          <rect x="8" y="8" width="24" height="24" rx="6" stroke={color} strokeWidth="2.6" />
          <path d="M8 20h24M20 8v24" stroke={color} strokeWidth="1.2" opacity="0.38" />
          <rect x="13" y="13" width="14" height="14" rx="3" fill={color} opacity="0.9" />
        </g>
      </svg>
      {showText && (
        <span className={`text-[15px] tracking-[-0.03em] ${textClass}`} style={{ fontWeight: 510 }}>virtour360</span>
      )}
    </span>
  )
}
