/**
 * Seed Supabase dengan 5 user dummy + panorama 360° gratis.
 *
 * Jalankan:
 *   node scripts/seed-supabase.mjs
 *
 * Environment (atau isi langsung di bawah untuk lokal):
 *   SEED_DATABASE_URL  — postgres://... (opsional)
 *   SEED_DB_HOST       — default pooler ap-southeast-2
 *   SEED_DB_PASSWORD   — password database
 *
 * Kredensial TIDAK disimpan di file ini. Jangan commit password Anda.
 */
import { Client } from "pg"
import { scryptSync, randomBytes } from "node:crypto"

const HOST = process.env.SEED_DB_HOST || "aws-0-ap-southeast-2.pooler.supabase.com"
const PORT = Number(process.env.SEED_DB_PORT || 6543)
const PASSWORD = process.env.SEED_DB_PASSWORD || ""
const USER = process.env.SEED_DB_USER || "postgres.zhkswftjzddnmlqdiupp"

if (!PASSWORD) {
  console.error("Isi SEED_DB_PASSWORD atau SEED_DATABASE_URL dulu.")
  process.exit(1)
}

const client = new Client({
  host: HOST,
  port: PORT,
  database: "postgres",
  user: USER,
  password: PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
})

const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex")
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`
}

/** 5 user bohongan dengan panorama 360° gratis (Pannellum demo images). */
const DUMMY_USERS = [
  {
    email: "alvi@example.com",
    name: "Alvi Arts",
    initials: "AA",
    color: "bg-amber-100 text-amber-700",
    title: "Atrium — The Gallery",
    panorama: "https://pannellum.org/images/alma.jpg",
    category: "Interior",
    posts: 12,
  },
  {
    email: "atrium@example.com",
    name: "Atrium Studio",
    initials: "AS",
    color: "bg-sky-100 text-sky-700",
    title: "Studio — Creative Room",
    panorama: "https://pannellum.org/images/bma-1.jpg",
    category: "Interior",
    posts: 8,
  },
  {
    email: "ruang@example.com",
    name: "Ruang Kreatif",
    initials: "RK",
    color: "bg-rose-100 text-rose-700",
    title: "Terrace — Sunset View",
    panorama: "https://pannellum.org/images/cerro-toco-0.jpg",
    category: "Outdoor",
    posts: 21,
  },
  {
    email: "sunset@example.com",
    name: "Sunset Living",
    initials: "SL",
    color: "bg-emerald-100 text-emerald-700",
    title: "Living Room 360",
    panorama: "https://pannellum.org/images/from-tree.jpg",
    category: "Interior",
    posts: 5,
  },
  {
    email: "harbor@example.com",
    name: "Harbor 360",
    initials: "H3",
    color: "bg-cyan-100 text-cyan-700",
    title: "Sunset Harbor",
    panorama: "https://pannellum.org/images/jfk.jpg",
    category: "Travel",
    posts: 9,
  },
]

const SCHEMA = [
  `create table if not exists public.virtour_users (
     email text primary key,
     name text not null,
     initials text not null,
     password_hash text not null,
     created_at timestamptz not null default now()
   )`,
  `alter table public.virtour_users enable row level security`,
  `drop policy if exists "virtour360 users service" on public.virtour_users`,
  `create policy "virtour360 users service" on public.virtour_users for all using (true) with check (true)`,
  `create table if not exists public.virtour_state (
     id text primary key,
     data jsonb not null default '{}'::jsonb,
     updated_at timestamptz not null default now()
   )`,
  `alter table public.virtour_state enable row level security`,
  `drop policy if exists "virtour360 anon all" on public.virtour_state`,
  `create policy "virtour360 anon all" on public.virtour_state for all using (true) with check (true)`,
]

async function main() {
  await client.connect()
  console.log("Terhubung ke Supabase.")

  for (const statement of SCHEMA) await client.query(statement)
  console.log("Schema siap.")

  for (const user of DUMMY_USERS) {
    await client.query(
      `insert into public.virtour_users (email, name, initials, password_hash)
       values ($1,$2,$3,$4)
       on conflict (email) do update set name=excluded.name, initials=excluded.initials`,
      [user.email, user.name, user.initials, hashPassword("demo1234")],
    )
  }
  console.log(`Seed ${DUMMY_USERS.length} user dummy selesai (password: demo1234).`)

  const creators = DUMMY_USERS.map((user, index) => ({
    id: `creator-${index + 1}`,
    name: user.name,
    initials: user.initials,
    color: user.color,
    email: user.email,
    posts: [
      {
        id: `post-${index + 1}`,
        title: user.title,
        image: user.panorama,
        panorama: user.panorama,
        category: user.category,
        views: `${user.posts} post`,
      },
    ],
  }))

  const payload = {
    profile: {
      name: DUMMY_USERS[0].name,
      initials: DUMMY_USERS[0].initials,
      location: "Jakarta, Indonesia",
      email: DUMMY_USERS[0].email,
      website: "https://virtour360.app",
      bio: "Demo creator",
    },
    scenes: [],
    folders: [],
    creators,
    updatedAt: new Date().toISOString(),
  }

  await client.query(
    `insert into public.virtour_state (id, data, updated_at)
     values ('virtour:public', $1::jsonb, now())
     on conflict (id) do update set data=excluded.data, updated_at=now()`,
    [JSON.stringify(payload)],
  )
  console.log("Public payload dengan 5 kreator tersimpan di virtour:public.")

  const check = await client.query("select email, name from public.virtour_users order by email")
  console.table(check.rows)
  await client.end()
}

main().catch(async (error) => {
  console.error("SEED_FAIL", error.message)
  await client.end().catch(() => undefined)
  process.exit(1)
})
