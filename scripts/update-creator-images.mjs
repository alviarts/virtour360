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

const FILES = ["entrance_hall", "art_studio", "hotel_room", "artist_workshop", "ballroom"]

async function main() {
  await c.connect()
  const r = await c.query("select data from public.virtour_state where id=$1", ["virtour:public"])
  const row = r.rows[0].data
  const payload = row.payload ?? row

  payload.creators = (payload.creators ?? []).map((creator, i) => {
    const file = FILES[i % FILES.length]
    return {
      ...creator,
      posts: (creator.posts ?? []).map((post, j) => ({
        ...post,
        image: `/media/thumbnails/${file}.jpg`,
        panorama: `/media/panoramas/${file}.jpg`,
      })),
    }
  })

  await c.query("update public.virtour_state set data=$1, updated_at=now() where id=$2", [
    JSON.stringify(row.payload ? { ...row, payload } : payload),
    "virtour:public",
  ])
  console.log("UPDATED_CREATORS", payload.creators.length)
  await c.end()
}

main().catch(async (e) => {
  console.log("FAIL", e.message)
  await c.end().catch(() => undefined)
  process.exit(1)
})
