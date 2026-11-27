import { createRoot } from "react-dom/client"
import Root from "./Root"
import { applyTheme, readTheme } from "./lib/theme"
import "./index.css"

applyTheme(readTheme())
createRoot(document.getElementById("root")!).render(<Root />)
