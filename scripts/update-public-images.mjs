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

async function main() {
  await c.connect()
  const r = await c.query("select data from public.virtour_state where id=$1", ["virtour:public"])
  const row = r.rows[0].data
  let json = JSON.stringify(row)
  json = json
    .replaceAll("key-biscayne-1", "entrance_hall")
    .replaceAll("key-biscayne-2", "art_studio")
    .replaceAll("key-biscayne-3", "hotel_room")
  await c.query("update public.virtour_state set data=$1::jsonb, updated_at=now() where id=$2", [json, "virtour:public"])
  console.log("UPDATED_PUBLIC_IMAGES", json.includes("entrance_hall"))
  await c.end()
}

main().catch(async (e) => {
  console.log("FAIL", e.message)
  await c.end().catch(() => undefined)
  process.exit(1)
})
