import { useContext } from "react"
import { AppContext, type AppContextValue } from "./AppContext"

/** Hook untuk mengakses state global Virtour360. */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp harus dipakai di dalam AppProvider")
  return ctx
}
