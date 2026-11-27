import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Logo360 } from "../components/ui/Logo360"
import { useApp } from "../context/useApp"
import { navigate, navigateHash } from "../lib/navigation"

const BTN = "flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#1b1b1c] text-[13px] text-[#e2e3e5] transition-colors hover:bg-[#23252a]"

export function LoginView({ mode }: { mode: "login" | "signup" }) {
  const { login, register, notify, setDemoMode } = useApp()
  const [stage, setStage] = useState<"choose" | "form">("choose")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const submit = async () => {
    setError("")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Masukkan email yang valid."); return }
    if (password.length < 6) { setError("Password minimal 6 karakter."); return }
    if (mode === "signup" && name.trim().length < 2) { setError("Nama minimal 2 karakter."); return }
    const result = mode === "signup"
      ? await register(name, email, password)
      : await login(email, password)
    if (result) { setError(result); return }
    notify(mode === "signup" ? "Akun dibuat. Selamat datang!" : "Selamat datang kembali!")
    navigate("dashboard")
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#09090a] px-6 text-[#e2e3e5]">
      <button
        onClick={() => navigate("home")}
        className="absolute left-6 top-6 flex items-center gap-1.5 text-[12px] text-[#8a8f98] hover:text-white"
      >
        <ArrowLeft size={14} /> Kembali
      </button>

      <div className="w-full max-w-[288px]">
        <div className="mb-8 flex justify-center"><Logo360 tone="white" size={30} /></div>
        <h1 className="text-[18px] font-medium text-white">
          {mode === "signup" ? "Buat akun Virtour360" : "Log in to Virtour360"}
        </h1>

        {stage === "choose" ? (
          <div className="mt-6 flex flex-col gap-2">
            <button onClick={() => { setDemoMode(true); navigate("studio") }} className={BTN + " bg-[#5e69d2] text-white hover:bg-[#6d78e0]"}>
              Coba demo studio
            </button>
            <button onClick={() => setStage("form")} className={BTN}>Continue with email</button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {mode === "signup" && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama" className="h-11 w-full rounded-lg border border-white/10 bg-[#1b1b1c] px-3 text-[13px] text-white outline-none placeholder:text-[#62666d]" />
            )}
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="h-11 w-full rounded-lg border border-white/10 bg-[#1b1b1c] px-3 text-[13px] text-white outline-none placeholder:text-[#62666d]" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="h-11 w-full rounded-lg border border-white/10 bg-[#1b1b1c] px-3 text-[13px] text-white outline-none placeholder:text-[#62666d]" />
            {error && <p className="text-[11px] text-[#eb5757]">{error}</p>}
            <button onClick={submit} className="h-11 rounded-full bg-[#5e69d2] text-[13px] font-medium text-white hover:bg-[#6d78e0]">
              {mode === "signup" ? "Buat akun" : "Masuk"}
            </button>
            <button onClick={() => setStage("choose")} className="text-[11px] text-[#8a8f98] hover:text-white">Kembali ke pilihan lain</button>
          </div>
        )}

        <p className="mt-8 text-[11px] text-[#8a8f98]">
          {mode === "signup" ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <button onClick={() => navigateHash(mode === "signup" ? "#/login" : "#/signup")} className="text-[#e2e3e5] underline underline-offset-2">
            {mode === "signup" ? "Log in" : "Sign up"}
          </button>
          {" "}atau{" "}
          <button onClick={() => navigate("home")} className="text-[#e2e3e5] underline underline-offset-2">pelajari lebih lanjut</button>
        </p>
      </div>
    </div>
  )
}
