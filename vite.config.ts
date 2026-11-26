import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Dev lokal bisa membuka tour yang sudah dipublish di produksi.
    proxy: {
      "/api": {
        target: "https://virtour360real.vercel.app",
        changeOrigin: true,
      },
    },
  },
  // Mesin 3D (three.js + Photo Sphere Viewer) secara wajar berukuran besar.
  build: { chunkSizeWarningLimit: 1200 },
})
