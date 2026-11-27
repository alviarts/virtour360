# 07. Evaluasi Heuristik (halaman publik + cuplikan UI)

Evaluasi dibatasi pada yang bisa diamati di situs publik. Skala keparahan 0–4.

## Kekuatan
| Heuristik / Hukum | Temuan |
|---|---|
| **H1 Visibilitas status** | Status issue, health project, "Working…", durasi kerja agen, penanda draft PR |
| **H2 Sesuai dunia nyata** | Istilah standar (Project, Issue, Cycle); tidak mengarang kosakata |
| **H3 Kontrol pengguna** | Tombol Revert di aktivitas agen |
| **H4 Konsistensi** | ID issue, label, avatar, pola baris sama di semua demo |
| **H6 Recognition** | Sidebar menampilkan Favorites; properti selalu di panel kanan |
| **H7 Fleksibilitas** | Bahasa natural, mention, template Loops, integrasi |
| **H8 Minimalis** | Warna hanya untuk status, banyak ruang kosong |
| **Law of Common Region** | Grup status ("In Progress 3") membatasi kelompok |
| **Law of Proximity** | Metadata di kanan, narasi di kiri |
| **Hick's Law** | Fitur disembunyikan di chip "+" dan "More" |
| **Jakob's Law** | Header dan footer SaaS konvensional |

## Celah dan Risiko
| # | Temuan | Heuristik | Sev. | Saran |
|---|---|---|---|---|
| 1 | Teks UI di demo sangat kecil dan kontras abu-abu pada hitam | Aksesibilitas (WCAG kontras) | 2 | Ukur kontras sebenarnya di DevTools [verifikasi] |
| 2 | Informasi padat di panel issue, bisa membebani pemula | Miller / H8 | 1–2 | Linear mengatasi dengan "simple first"; tetap uji dengan pemula |
| 3 | Banyak konsep baru bersamaan (Initiatives, Projects, Cycles, Pulse, Loops, Asks) | H2 / beban kognitif | 2 | Onboarding bertahap |
| 4 | Dark-only di marketing; tidak terlihat opsi tema terang | Fleksibilitas | 1 | Cek pengaturan tema di app [verifikasi] |
| 5 | Section demo bergantung pada gerakan/video | Aksesibilitas (reduced motion) | 2 | Cek dukungan `prefers-reduced-motion` [verifikasi] |
| 6 | Ketergantungan pada AI membuat batas tanggung jawab agen vs manusia perlu jelas | H1/H5 | 2 | Linear menampilkan "Draft PR awaiting your review" sebagai pagar pengaman |

## Kesimpulan
Kualitas Linear berasal dari **konsistensi dan disiplin**, bukan dari efek visual besar: satu sistem status, satu pola baris, satu bahasa, diulang di mana-mana.
