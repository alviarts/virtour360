interface Logo360Props {
  tone?: "pink" | "dark" | "white"
  showText?: boolean
  size?: number
  className?: string
}

/**
 * Logo Virtour360  cincin penuh + orbit + angka 360.
 * tone "pink" untuk header gelap, "dark" untuk header terang, "white" untuk overlay.
 */
export function Logo360({ tone = "pink", showText = true, size = 30, className = "" }: Logo360Props) {
  const color = tone === "pink" ? "#d1005c" : tone === "dark" ? "#0f172a" : "#fafafa"
  const textClass = tone === "dark" ? "text-slate-900" : "text-white"

  return (
    <span className={`inline-flex shrink-0 items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <ellipse
          className="globe-spin"
          cx="20"
          cy="20"
          rx="18"
          ry="8"
          transform="rotate(-24 20 20)"
          stroke={color}
          strokeWidth="1.6"
          opacity="0.45"
        />
        <circle cx="20" cy="20" r="15.5" stroke={color} strokeWidth="3" />
        <text
          x="20"
          y="24.2"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="800"
          fontFamily="Inter, system-ui, sans-serif"
          fill={color}
          letterSpacing="-0.4"
        >
          360
        </text>
      </svg>
      {showText && (
        <span className={`text-lg font-bold tracking-tight ${textClass}`}>virtour360</span>
      )}
    </span>
  )
}
