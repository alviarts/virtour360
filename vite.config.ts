import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
  // Mesin 3D (three.js + Photo Sphere Viewer) secara wajar berukuran besar.
  build: { chunkSizeWarningLimit: 1200 },
})
