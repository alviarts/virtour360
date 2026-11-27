import { lazy, Suspense, useEffect, useState } from "react"
import App from "./App"
import { AuthModal } from "./components/auth/AuthModal"
import { LoginRequired } from "./components/auth/LoginRequired"
import { UploadModal } from "./components/auth/UploadModal"
import { AppProvider } from "./context/AppContext"
import { useApp } from "./context/useApp"
import { currentView, type View } from "./lib/navigation"
import { publicUidFromHash } from "./lib/publicStore"

const DashboardView = lazy(() =>
  import("./views/DashboardView").then((m) => ({ default: m.DashboardView })),
)
const PublicPortfolioView = lazy(() =>
  import("./views/PublicPortfolioView").then((m) => ({ default: m.PublicPortfolioView })),
)
const PublicTourView = lazy(() =>
  import("./views/PublicTourView").then((m) => ({ default: m.PublicTourView })),
)
const PublicHomeView = lazy(() =>
  import("./views/PublicHomeView").then((m) => ({ default: m.PublicHomeView })),
)
const LoginView = lazy(() =>
  import("./views/LoginView").then((m) => ({ default: m.LoginView })),
)
const ProductView = lazy(() => import("./views/MarketingViews").then((m) => ({ default: m.ProductView })))
const PricingView = lazy(() => import("./views/MarketingViews").then((m) => ({ default: m.PricingView })))
const CustomersView = lazy(() => import("./views/MarketingViews").then((m) => ({ default: m.CustomersView })))
const ResourcesView = lazy(() => import("./views/MarketingViews").then((m) => ({ default: m.ResourcesView })))
const ContactView = lazy(() => import("./views/MarketingViews").then((m) => ({ default: m.ContactView })))

function Loader() {
  return (
    <div className="grid h-full w-full place-items-center bg-zinc-950 text-xs text-zinc-500">
      Memuat⬦
    </div>
  )
}

function Shell() {
  const [view, setView] = useState<View>(currentView())
  const [hashKey, setHashKey] = useState(() => window.location.hash)
  const [leaving, setLeaving] = useState(false)
  const { toast, user, demoMode } = useApp()
  const isPrivate = (view === "studio" || view === "dashboard") && !demoMode
  const isPublishedTour = view === "portfolio" && !!publicUidFromHash()

  useEffect(() => {
    let timer: number | undefined
    const onHash = () => {
      const next = currentView()
      const nextHash = window.location.hash
      if (next === view && nextHash === hashKey) return
      setLeaving(true)
      timer = window.setTimeout(() => {
        setView(next)
        setHashKey(nextHash)
        setLeaving(false)
      }, 160)
    }
    window.addEventListener("hashchange", onHash)
    return () => {
      window.removeEventListener("hashchange", onHash)
      if (timer) window.clearTimeout(timer)
    }
  }, [view, hashKey])

  return (
    <>
      <div key={hashKey} className={`page-fade h-full w-full ${leaving ? "is-leaving" : ""}`}>
      {isPrivate && !user ? (
        <LoginRequired area={view === "studio" ? "Studio" : "Dashboard"} />
      ) : view === "studio" ? (
        <App />
      ) : (
        <Suspense fallback={<Loader />}>
          {view === "dashboard" ? (
            <DashboardView />
          ) : isPublishedTour ? (
            <PublicTourView />
          ) : view === "login" || view === "signup" ? (
            <LoginView mode={view} />
          ) : view === "product" ? (
            <ProductView />
          ) : view === "pricing" ? (
            <PricingView />
          ) : view === "customers" ? (
            <CustomersView />
          ) : view === "resources" ? (
            <ResourcesView />
          ) : view === "contact" ? (
            <ContactView />
          ) : view === "portfolio" || view === "profile" ? (
            <PublicPortfolioView />
          ) : (
            <PublicHomeView />
          )}
        </Suspense>
      )}
      </div>
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
