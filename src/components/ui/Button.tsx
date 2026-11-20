import type { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "white" | "ghost" | "blue" | "amber" | "outline"
type Size = "sm" | "md"

const variants: Record<Variant, string> = {
  white: "bg-white text-black hover:bg-zinc-200",
  ghost: "bg-transparent text-zinc-50 hover:bg-white/10",
  blue: "bg-sky-500 text-white hover:bg-sky-400",
  amber: "bg-transparent text-amber-400 hover:bg-amber-400/10",
  outline: "border border-zinc-700 bg-transparent text-zinc-300 hover:bg-white/5",
}

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3 text-xs",
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  children?: ReactNode
}

export function Button({
  variant = "ghost",
  size = "md",
  icon,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon}
      {children}
    </button>
  )
}
