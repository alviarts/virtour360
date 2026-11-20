import { lazy, Suspense, useEffect, useState } from "react"
import App from "./App"
import { currentView, type View } from "./lib/navigation"

const DashboardView = lazy(() =>
  import("./views/DashboardView").then((m) => ({ default: m.DashboardView })),
)
const PublicPortfolioView = lazy(() =>
  import("./views/PublicPortfolioView").then((m) => ({ default: m.PublicPortfolioView })),
)

function Loader() {
  return (
    <div className="grid h-full w-full place-items-center bg-zinc-950 text-xs text-zinc-500">
      Memuat…
    </div>
  )
}

export default function Root() {
  const [view, setView] = useState<View>(currentView())

  useEffect(() => {
    const onHash = () => setView(currentView())
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  if (view === "studio") return <App />

  return (
    <Suspense fallback={<Loader />}>
      {view === "dashboard" ? <DashboardView /> : <PublicPortfolioView />}
    </Suspense>
  )
}
