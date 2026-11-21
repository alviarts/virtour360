import { Client } from "pg"

const c = new Client({
  host: "aws-0-ap-southeast-2.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.zhkswftjzddnmlqdiupp",
  password: process.env.SEED_DB_PASSWORD || "",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
})

const NAMES = [
  ["creator-1", "Alvi Arts", "AA", "bg-amber-100 text-amber-700", "Atrium — The Gallery", "alvi@example.com", "12 post", "alma"],
  ["creator-2", "Atrium Studio", "AS", "bg-sky-100 text-sky-700", "Studio — Creative Room", "atrium@example.com", "8 post", "bma-1"],
  ["creator-3", "Ruang Kreatif", "RK", "bg-rose-100 text-rose-700", "Terrace — Sunset View", "ruang@example.com", "21 post", "cerro-toco-0"],
  ["creator-4", "Sunset Living", "SL", "bg-emerald-100 text-emerald-700", "Living Room 360", "sunset@example.com", "5 post", "from-tree"],
  ["creator-5", "Harbor 360", "H3", "bg-cyan-100 text-cyan-700", "Sunset Harbor", "harbor@example.com", "9 post", "jfk"],
]

async function main() {
  await c.connect()
  const r = await c.query("select data from public.virtour_state where id=$1", ["virtour:public"])
  const row = r.rows[0].data
  // Data bisa berbentuk payload langsung (seed lama) atau { payload, updated_at } (publish baru).
  const payload = row.payload ?? row
  if (!payload.creators?.length) {
    payload.creators = NAMES.map(([id, name, initials, color, title, email, views, file], i) => {
      const url = `https://pannellum.org/images/${file}.jpg`
      return {
        id, name, initials, color, email,
        posts: [{ id: `post-${i + 1}`, title, image: url, panorama: url, category: "360°", views }],
      }
    })
    await c.query("update public.virtour_state set data=$1, updated_at=now() where id=$2", [
      JSON.stringify(row.payload ? { ...row, payload } : payload),
      "virtour:public",
    ])
    console.log("CREATORS_RESTORED", payload.creators.length)
  } else {
    console.log("CREATORS_OK", payload.creators.length)
  }
  await c.end()
}

main().catch(async (e) => {
  console.log("FAIL", e.message)
  await c.end().catch(() => undefined)
  process.exit(1)
})
