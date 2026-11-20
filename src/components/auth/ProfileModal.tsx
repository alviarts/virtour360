import { useState } from "react"
import { Lock, User, X } from "lucide-react"
import { useApp } from "../../context/AppContext"

type Mode = "profile" | "password"

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, guestId, updateProfile, changePassword, setAuthOpen, notify } = useApp()
  const [mode, setMode] = useState<Mode>("profile")
  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setDone(null)
    if (mode === "profile") {
      const result = await updateProfile(name, email)
      if (result) return setError(result)
      setDone("Profil berhasil disimpan.")
      notify("Profil diperbarui.")
      return
    }
    if (next !== confirm) return setError("Konfirmasi password tidak cocok.")
    const result = await changePassword(current, next)
    if (result) return setError(result)
    setCurrent("")
    setNext("")
    setConfirm("")
    setDone("Password berhasil diubah.")
    notify("Password diperbarui.")
  }

  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm animate-fade-up rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Pengaturan akun</h2>
            <p className="mt-1 text-[11px] text-zinc-500">Perubahan disimpan di browser ini.</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200" aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        {!user ? (
          <div className="mt-5 flex flex-col items-center gap-3 py-6 text-center">
            <User size={24} className="text-zinc-600" />
            <p className="text-xs leading-relaxed text-zinc-400">
              Anda sedang dalam <span className="font-semibold text-zinc-200">mode tamu</span>.
              Semua fitur tetap bisa dipakai tanpa login — data tersimpan di browser ini.
            </p>
            <p className="max-w-full truncate rounded border border-zinc-800 px-2 py-1 font-mono text-[10px] text-zinc-600" title={guestId}>
              ID tamu: {guestId}
            </p>
            <div className="flex w-full gap-2">
              <button onClick={onClose} className="h-9 flex-1 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-300 hover:bg-white/5">
                Lanjut sebagai tamu
              </button>
              <button
                onClick={() => {
                  onClose()
                  setAuthOpen(true)
                }}
                className="h-9 flex-1 rounded-lg bg-white text-xs font-semibold text-black hover:bg-zinc-200"
              >
                Masuk (opsional)
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 flex rounded-lg border border-zinc-700 p-0.5">
              {([
                { id: "profile" as Mode, label: "Profil", icon: User },
                { id: "password" as Mode, label: "Password", icon: Lock },
              ]).map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMode(item.id)
                      setError(null)
                      setDone(null)
                    }}
                    className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors ${
                      mode === item.id ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Icon size={13} /> {item.label}
                  </button>
                )
              })}
            </div>

            <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
              {mode === "profile" ? (
                <>
                  <label className="flex flex-col gap-1.5 text-[11px] text-zinc-400">
                    Nama
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:border-zinc-500"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[11px] text-zinc-400">
                    Email
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:border-zinc-500"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="flex flex-col gap-1.5 text-[11px] text-zinc-400">
                    Password lama
                    <input
                      type="password"
                      value={current}
                      onChange={(e) => setCurrent(e.target.value)}
                      className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:border-zinc-500"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[11px] text-zinc-400">
                    Password baru
                    <input
                      type="password"
                      value={next}
                      onChange={(e) => setNext(e.target.value)}
                      className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:border-zinc-500"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[11px] text-zinc-400">
                    Ulangi password baru
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-xs text-zinc-100 outline-none focus:border-zinc-500"
                    />
                  </label>
                </>
              )}

              {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-[11px] text-red-400">{error}</p>}
              {done && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-400">{done}</p>}

              <button type="submit" className="mt-1 h-10 rounded-lg bg-white text-xs font-semibold text-black hover:bg-zinc-200">
                Simpan {mode === "profile" ? "profil" : "password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
