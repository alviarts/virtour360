# Indeks Dokumentasi — Virtour360

Semua dokumentasi project ada di folder `virtour360/docs/`. File di `FEATURE_DOCS/` (workspace `rea`) adalah salinan lama hasil riset awal; versi terbaru ada di sini.

## Status saat ini
- Visual mengikuti referensi **Linear** (`linear.app`): token asli, font asli, struktur landing, animasi scroll/dot-grid/marquee.
- Sistem/fitur tetap **Virtour360** (turunan Panoee): Studio, 9 tipe hotspot, publish, groups, weblog, viewer 360°.
- Supabase sudah terhubung di `.env` lokal (publishable key): state bersama, publish `virtour:pub:*`, dan feed Customers realtime/fallback. Langkah SQL bucket + publication ada di [19-koneksi-supabase.md](19-koneksi-supabase.md).
- Perubahan terbaru sudah di-commit dan di-push ke `origin/main` (commit terakhir ada di `git log`).

## A. Riset fitur & sistem
| Dokumen | Isi |
|---|---|
| [00-DOKUMENTASI-FITUR-LENGKAP.md](00-DOKUMENTASI-FITUR-LENGKAP.md) | Ringkasan seluruh fitur + indeks |
| [01-routing-navigasi.md](01-routing-navigasi.md) | 7 rute hash, navigasi, fallback |
| [02-halaman-publik.md](02-halaman-publik.md) | Profil, statistik, folder, posts/tours, CTA |
| [03-viewer-360.md](03-viewer-360.md) | PSV5, plugin, hotspot, hotkey, minimap |
| [04-studio-editor.md](04-studio-editor.md) | Scene, inspector, autosave, undo |
| [05-auth-profil.md](05-auth-profil.md) | scrypt, token HMAC, profil |
| [06-upload-publish-embed.md](06-upload-publish-embed.md) | Upload, publish, QR, embed |
| [07-model-data.md](07-model-data.md) | Data dictionary + Supabase |
| [08-tema-styling.md](08-tema-styling.md) | Tema lama (Panoee) — lihat DESIGN.md untuk arah baru |
| [09-audit-backend-docs.md](09-audit-backend-docs.md) | Arsitektur, bug, inkonsistensi |
| [10-panoee-asli-komparasi.md](10-panoee-asli-komparasi.md) | Perbandingan 68 baris dengan Panoee |
| [11-panoee-paths.md](11-panoee-paths.md) | Semua path Panoee asli |

## B. Perencanaan & QA (project)
| Dokumen | Isi |
|---|---|
| [PLAN.md](PLAN.md) | Rencana awal tiga tampilan |
| [RESEARCH.md](RESEARCH.md) | Reverse engineering Panoee |
| [ASSETS.md](ASSETS.md) | Panduan panorama equirectangular |
| [QA.md](QA.md) | QA bertahap |
| [QA-FULL.md](QA-FULL.md) | Happy path + component + equivalence testing |
| [VALIDATION.md](VALIDATION.md) | Validasi fitur |
| [CHANGELOG.md](CHANGELOG.md) | Riwayat perubahan |

## C. Visual & referensi
| Dokumen | Isi |
|---|---|
| [DESIGN.md](DESIGN.md) | Arah visual + token + keputusan desain |
| [LINEAR-REFERENCE.md](LINEAR-REFERENCE.md) | Token persis linear.app hasil curl CSS/JS |
| [12-visual-linear.md](12-visual-linear.md) | Implementasi visual Linear di Home & Studio |
| [15-penerapan-linear-refren.md](15-penerapan-linear-refren.md) | Penerapan 12 dokumen `linear-refren` (status, chips, ⌘K, skip-link) |
| [16-perbaikan-portfolio-dashboard-studio.md](16-perbaikan-portfolio-dashboard-studio.md) | Perbaikan logo, username/URL, CTA, status project, slug, responsivitas |
| [17-halaman-marketing.md](17-halaman-marketing.md) | Rute Product, Pricing, Customers, Resources, Contact; dropdown & feed |
| [18-qa-workflow-lanjutan.md](18-qa-workflow-lanjutan.md) | QA satu per satu: nav, docs, feed publish, collapse, clipboard, logout, blob URL |

## D.状态 terakhir & operasional
| Dokumen | Isi |
|---|---|
| [13-demo-login-state.md](13-demo-login-state.md) | Mode demo per session, login full-page, state lokal |
| [14-cara-menjalankan.md](14-cara-menjalankan.md) | Cara run, test, route, env, catatan deploy |
| [19-koneksi-supabase.md](19-koneksi-supabase.md) | Kredensial publishable, state/publish remote, SQL bucket & realtime, QA koneksi |

## Ringkasan fitur saat ini
Home (landingLinear + stage Studio + demo session) · Marketing (`#/product`, `#/pricing`, `#/customers`, `#/resources` + 9 subpath, `#/contact`) · Public portfolio (`#/portfolio`, `#/u/:slug`) · Tour publik (`#/p/:uid`) · Dashboard project gateway (`#/dashboard`) · Studio (`#/studio`) · Login/Sign up full-page (`#/login`, `#/signup`).

Studio: scene CRUD, grup + rename/delete + weblog, 9 tipe hotspot, Design modal, inspector efek, mini-map, HUD klik-kanan, upload, publish (slug/password/QR/embed), autosave + undo.

Testing: 46/46 automated test lolos, typecheck & build hijau.
