import { Compass, Lock, User } from "lucide-react"
import { Logo360 } from "../ui/Logo360"
import { navigate } from "../../lib/navigation"
import { useApp } from "../../context/useApp"

/** Halaman pengunci untuk route privat (Studio / Dashboard). */
export function LoginRequired({ area }: { area: "Studio" | "Dashboard" }) {
  const { setAuthOpen } = useApp()

  return (
    <div className="grid h-full w-full place-items-center bg-zinc-950 px-5 text-zinc-50">
      <div className="w-full max-w-sm animate-fade-up rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center shadow-2xl">
        <div className="mx-auto w-fit">
          <Logo360 tone="pink" />
        </div>

        <div className="mx-auto mt-5 grid size-12 place-items-center rounded-full bg-amber-400/10 text-amber-400">
          <Lock size={20} />
        </div>

        <h1 className="mt-4 text-lg font-semibold text-white">{area} perlu login</h1>
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          Halaman ini khusus pemilik portofolio. Publik bisa menjelajahi karya tanpa
          login, tetapi untuk masuk ke {area} silakan gunakan akun Anda.
        </p>

        <button
          onClick={() => setAuthOpen(true)}
          className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white text-xs font-semibold text-black hover:bg-zinc-200"
        >
          <User size={14} /> Masuk sekarang
        </button>
        <button
          onClick={() => navigate("home")}
          className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-300 hover:bg-white/5"
        >
          <Compass size={14} /> Kembali ke publik
        </button>

        <p className="mt-4 text-[10px] text-zinc-600">
          Akun Anda tetap tersimpan di perangkat ini.
        </p>
      </div>
    </div>
  )
}
