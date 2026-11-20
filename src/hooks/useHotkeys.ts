import { useEffect } from "react"

type Handlers = {
  onPrev?: () => void
  onNext?: () => void
  onReset?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFullscreen?: () => void
}

export function useHotkeys(handlers: Handlers) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return

      switch (event.key) {
        case "ArrowLeft":
          handlers.onPrev?.()
          break
        case "ArrowRight":
          handlers.onNext?.()
          break
        case "r":
        case "R":
          handlers.onReset?.()
          break
        case "+":
        case "=":
          handlers.onZoomIn?.()
          break
        case "-":
          handlers.onZoomOut?.()
          break
        case "f":
        case "F":
          handlers.onFullscreen?.()
          break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [handlers])
}
