# 04. Pola UX dan Interaksi

## Pola Inti Linear
| Pola | Bukti di situs | Mengapa efektif |
|---|---|---|
| **Kecepatan sebagai fitur** | "Designed for speed", "Reduces noise and restores momentum" | Doherty Threshold: respons di bawah ~400 ms menjaga alur kerja |
| **Opinionated by design** | Method: "Flexible software lets everyone invent their own workflows, which eventually creates chaos" | Mengurangi keputusan konfigurasi |
| **Simple first, then powerful** | Method: prinsip ke-7 | Progressive disclosure, pemula tidak kewalahan |
| **Keyboard-first** [verifikasi di app] | Citra produk: command-centric, `P` untuk play di halaman Quality | Efisiensi untuk power user (H7) |
| **Tindakan lewat bahasa natural** | `@Linear create issues and assign to me` | Interaksi percakapan menggantikan form panjang |
| **Delegasi ke agen** | `@Linear can you take a stab at this?` → draft PR | Manusia mengarahkan, agen mengeksekusi |
| **Triage otomatis** | "Triage Intelligence added the labels Performance and iOS" | Mengurangi "busy work" |
| **Aktivitas sebagai timeline tunggal** | Event sistem + komentar + aksi agen dalam satu aliran | Konteks tidak terpecah |
| **Undo yang terlihat** | Tombol "Revert" di panel aktivitas | User control (H3) |

## Status dan Feedback (H1)
- Status issue (Backlog → Todo → In Progress → In Review → Done) tampil sebagai **grup dengan jumlah** ("In Progress 3").
- Indikator **"Working…"** untuk agen yang aktif.
- Status project **On Track / At Risk / Off Track** disertai alasan satu kalimat dan tanggal.
- Penanda **"Draft PR awaiting your review"** memberi tahu langkah berikutnya, bukan hanya status.

## Pengurangan Beban Kognitif
- **Scope issue sekecil mungkin** → progres terlihat, rasa selesai sering (Peak-End/Zeigarnik).
- **Backlog dijaga ramping**: "Important ones will resurface".
- **Cycle otomatis memindahkan sisa kerja**: tidak ada tugas manual.
- **Satu owner per issue dan project**: tanggung jawab jelas.

## Integrasi sebagai UX
Pengguna tidak perlu pindah alat:
- Slack: issue dibuat dari percakapan; update project dikirim dua arah.
- GitHub: PR, status CI, stacked PR tampil di Linear.
- Agen pihak ketiga (Cursor, ChatPRD) dipanggil di dalam Linear.
- Mobile Diffs: review kode di iOS dan Android.

## Pola Halaman Marketing
- Interaksi demo di hero: counter "1 / 84" dan konten bergerak, memberi kesan "aplikasi hidup".
- Tab/tautan "Learn more →" konsisten di tiap section.
- Chip fitur dengan "+" mengundang ekspansi.
