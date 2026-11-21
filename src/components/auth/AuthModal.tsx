import { useState } from "react"
import { X } from "lucide-react"
import { useApp } from "../../context/AppContext"
import { navigate } from "../../lib/navigation"

export function AuthModal() {
  const { authOpen, setAuthOpen, login, register, notify } = useApp()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)

  if (!authOpen) return null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Format email tidak valid.")
      return
    }
    if (mode === "register") {
      if (name.trim().length < 2) {
        setError("Nama minimal 2 karakter.")
        return
      }
      if (password !== confirm) {
        setError("Konfirmasi password tidak cocok.")
        return
      }
    }
    const result = await (mode === "login" ? login(email, password) : register(name, email, password))
    if (result) {
      setError(result)
      return
    }
    setAuthOpen(false)
    setPassword("")
    setConfirm("")
    notify(
      mode === "login"
        ? "Selamat datang kembali! Studio siap digunakan."
        : "Akun berhasil dibuat. Selamat datang di Studio!",
    )
    navigate("studio")
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-fade-up rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              {mode === "login" ? "Masuk ke Virtour360" : "Buat akun baru"}
            </h2>
            <p className="mt-1 text-[11px] text-zinc-500">
              {mode === "login" ? "Kelola panorama dan proyek 360° Anda." : "Mulai unggah panorama 360° pertama Anda."}
            </p>
          </div>
          <button onClick={() => setAuthOpen(false)} className="text-zinc-500 hover:text-zinc-200" aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 flex rounded-lg border border-zinc-700 p-0.5">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              className={`h-8 flex-1 rounded-md text-xs font-medium capitalize transition-colors ${
                mode === m ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
              }`}
              onClick={() => { setMode(m); setError(null); setConfirm("") }}
            >
              {m === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          {mode === "register" && (
            <label className="flex flex-col gap-1.5 text-[11px] text-zinc-400">
              Nama
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda"
                required
                className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-[11px] text-zinc-400">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:border-zinc-500"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[11px] text-zinc-400">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:border-zinc-500"
            />
          </label>

          {mode === "register" && (
            <label className="flex flex-col gap-1.5 text-[11px] text-zinc-400">
              Ulangi password
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Ulangi password"
                required
                className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:border-zinc-500"
              />
            </label>
          )}

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-[11px] text-red-400">{error}</p>}

          <button type="submit" className="mt-1 h-10 rounded-lg bg-white text-xs font-semibold text-black hover:bg-zinc-200">
            {mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setAuthOpen(false)}
          className="mt-2 h-9 w-full rounded-lg border border-zinc-700 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
        >
          Kembali ke publik
        </button>

        <p className="mt-3 text-center text-[10px] leading-relaxed text-zinc-600">
          Publik bisa melihat karya tanpa login. Masuk diperlukan untuk menyimpan &amp; mengunggah 360°.
        </p>
      </div>
    </div>
  )
}
