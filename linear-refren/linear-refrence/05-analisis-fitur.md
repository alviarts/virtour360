# 05. Analisis Fitur dan UI per Area

## A. Intake and integrations
**Tujuan**: percakapan dan feedback otomatis menjadi issue yang ter-route, berlabel, dan berprioritas.
- **UI**: papan/daftar dikelompokkan per status; tiap baris = ID, judul terpotong, label berwarna, avatar assignee, tanggal.
- **Pendamping**: thread Slack di samping yang menunjukkan sumber masalah → issue.
- **Fitur**: Linear Agent, Customer Requests, Triage, Linear Asks.
- **Pelajaran**: sumber asli (Slack) ditampilkan bersama hasilnya (issue), sehingga alur sebab-akibat langsung terbaca.

## B. Planning and monitoring
**Tujuan**: menyelaraskan tim dari ide sampai peluncuran.

| Sub-fitur | UI | Catatan |
|---|---|---|
| **Projects** | Tab Overview/Activity/Customers/Issues | Spec, dokumen, issue, feedback dalam satu tempat |
| **Milestones & dependencies** | Garis waktu + penanda tanggal | Jalur kritis antar project |
| **Predict outcomes** | Grafik scope vs velocity | Estimasi selesai berbasis data |
| **Project updates** | Status berwarna + satu kalimat + tanggal | Bisa diposting ke Slack, thread sinkron dua arah |
| **Documents** | Editor multiplayer, komentar inline, perintah "text-to-issue" | Daftar poin → issue satu klik |
| **Initiatives** | Daftar strategis dengan progres | "Canonical entry point" |
| **Visual planning** | Timeline Mar–Sep, bar dengan fase Alpha/Beta/GA | Quarterly planning, product pipeline, resource allocation |
| **Pulse** | Feed dengan tab For me / Popular / Recent | Ringkasan AI sebagai teks atau audio ke Inbox |
| **Insights** | Grafik cycle time, dashboard modular | Ekspor ke Google Sheets, Fivetran, Airbyte |

## C. AI and automations
- **Agen sebagai rekan setim**: muncul di daftar assignee dan thread seperti manusia, dengan avatar dan nama.
- **Transparansi proses**: "Worked for 8 sec" / "Worked for 1 min", "added to context", hasil berupa daftar issue ber-ID.
- **Hasil dapat ditelusuri**: setiap output memuat ID yang bisa diklik (ENG-2298, dst.).
- **Pilihan model**: label model terlihat ("Opus 5.5"); BYOK (bring your own key) di changelog 12 Nov 2026.
- **Loops**: otomasi yang merespons perubahan di Linear/Slack/GitHub, dapat dibagikan sebagai template dan diatur tingkat penalarannya.
- **Pelajaran UX**: AI tidak diberi panel terpisah yang asing, melainkan dipakai di tempat kerja yang sama dengan pola yang sama (mention, assign, komentar).

## D. Build, review, and ship
- **Daftar PR berstatus**: In Review / In Progress / Todo, tiap baris memuat ID issue, nomor PR (#54910), label, avatar, tanggal, dan indikator "Working…".
- **Diffs**: tampilan perbandingan kode dengan nama file di atas (`kinetic-ios/src/screens/Home/HomeScreen.tsx`); sorotan perubahan merah/hijau.
- **Stacked PRs**: grup yang bisa dilipat, status review/CI/merge sekilas.
- **Guided reviews**, **Git automations**, **Cycles**, **Releases**.
- **Mobile Diffs** (4 Nov 2026): review kode bisa di ponsel.
- Slogan di kode demo: `Slow, Fragmented, HumanOnly` → `Frictionless, Integrated, AgentReady`. Humor teknis kecil yang menyampaikan nilai jual.

## Linear Method (kutipan inti, ringkas)
Delapan prinsip: build for the creators; purpose-built; create momentum, don't sprint; meaningful direction; aim for clarity; say no to busy work; simple first, then powerful; decide and move on.
