import { lazy, Suspense, useEffect, useState } from "react"
import App from "./App"
import { AuthModal } from "./components/auth/AuthModal"
import { LoginRequired } from "./components/auth/LoginRequired"
import { UploadModal } from "./components/auth/UploadModal"
import { AppProvider } from "./context/AppContext"
import { useApp } from "./context/useApp"
import { currentView, type View } from "./lib/navigation"

const DashboardView = lazy(() =>
  import("./views/DashboardView").then((m) => ({ default: m.DashboardView })),
)
const PublicPortfolioView = lazy(() =>
  import("./views/PublicPortfolioView").then((m) => ({ default: m.PublicPortfolioView })),
)
const PublicHomeView = lazy(() =>
  import("./views/PublicHomeView").then((m) => ({ default: m.PublicHomeView })),
)

function Loader() {
  return (
    <div className="grid h-full w-full place-items-center bg-zinc-950 text-xs text-zinc-500">
      Memuat⬦
    </div>
  )
}

function Shell() {
  const [view, setView] = useState<View>(currentView())
  const { toast, user } = useApp()
  const isPrivate = view === "studio" || view === "dashboard"

  useEffect(() => {
    const onHash = () => setView(currentView())
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  return (
    <>
      {isPrivate && !user ? (
        <LoginRequired area={view === "studio" ? "Studio" : "Dashboard"} />
      ) : view === "studio" ? (
        <App />
      ) : (
        <Suspense fallback={<Loader />}>
          {view === "dashboard" ? (
            <DashboardView />
          ) : view === "portfolio" ? (
            <PublicPortfolioView />
          ) : (
            <PublicHomeView />
          )}
        </Suspense>
      )}
      <AuthModal />
      <UploadModal />
      {toast && (
        <div className="pointer-events-none fixed bottom-20 left-1/2 z-[120] -translate-x-1/2 animate-fade-up rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs text-zinc-100 shadow-xl">
          {toast}
        </div>
      )}
    </>
  )
}

export default function Root() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
