# Cara Menjalankan & Verifikasi

## Jalankan lokal
```bash
cd C:\Users\visual works\Documents\rea\virtour360
npm install
npm run dev -- --port 5173
```
Buka `http://localhost:5173`.

Dev server memiliki proxy `/api` ke `https://virtour360real.vercel.app`, sehingga tour yang dipublish di produksi bisa dibuka juga dari localhost (mis. `#/p/4i105b1c2t`).

## Rute
| Rute | Fungsi |
|---|---|
| `#/home` | Landing + demo studio |
| `#/portfolio` | Portofolio kreator |
| `#/p/:uid` | Tour publik (viewer 360° penuh) |
| `#/dashboard` | Project gateway (butuh login, kecuali demo) |
| `#/studio` | Editor (butuh login, kecuali demo) |
| `#/login`, `#/signup` | Login/Sign up full-page |

## Perintah
```bash
npm run typecheck   # TypeScript
npm test            # Vitest — 46 test
npm run build       # produksi ke dist/
npm run preview     # serve dist/
```

## Testing
46 automated test: unit (publicStore, sceneGraph, effects, config), component (HotspotPopup, MiniMap, BottomToolbar, DesignModal, PublishModal, PublicPortfolioView gate), equivalence (slug, koordinat derajat, config). Happy path diverifikasi manual di browser.

## Deploy
`vercel.json`: framework `vite`, build `npm run build`, output `dist`, SPA rewrite, cache `/media`. Auto-deploy dari GitHub `alviarts/virtour360` (status commit bisa dicek dengan `gh api repos/alviarts/virtour360/commits/<sha>/status`).

User meminta **tidak ada push** untuk pekerjaan terakhir — jangan commit/push tanpa konfirmasi baru.

## Lokasi file kunci
- Landing: `src/views/PublicHomeView.tsx`
- Studio: `src/App.tsx`, `src/components/layout/*`, `src/components/viewer/*`
- Visual: `src/styles/theme.css`, `src/components/ui/{TourStage,FeatureVisual,SlackBox,AgentCard,Reveal,Logo360}.tsx`
- Login: `src/views/LoginView.tsx`
- Demo/state: `src/context/AppContext.tsx`, `src/Root.tsx`, `src/lib/navigation.ts`
- Dokumentasi ini: `docs/`
