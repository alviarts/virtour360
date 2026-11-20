-- Virtour360 — skema Supabase paling sederhana (1 tabel + 1 bucket).
-- Jalankan di Supabase Dashboard → SQL Editor, lalu klik Run.

-- 0. Tabel akun user (password di-hash di server, tidak disimpan plaintext)
create table if not exists public.virtour_users (
  email text primary key,
  name text not null,
  initials text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.virtour_users enable row level security;
drop policy if exists "virtour360 users service" on public.virtour_users;
create policy "virtour360 users service"
  on public.virtour_users
  for all
  using (true)
  with check (true);

-- 1. Tabel state privat per user / tamu, dan state publik (hasil publish)
create table if not exists public.virtour_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.virtour_state enable row level security;

-- Demo 2–5 orang: akses anon diperbolehkan.
-- Untuk produksi, ganti policy ini dengan auth.uid() / token sendiri.
drop policy if exists "virtour360 anon all" on public.virtour_state;
create policy "virtour360 anon all"
  on public.virtour_state
  for all
  using (true)
  with check (true);

-- 2. Bucket storage untuk file panorama 360°
insert into storage.buckets (id, name, public)
values ('panoramas', 'panoramas', true)
on conflict (id) do nothing;

drop policy if exists "virtour360 panoramas read" on storage.objects;
create policy "virtour360 panoramas read"
  on storage.objects for select
  using (bucket_id = 'panoramas');

drop policy if exists "virtour360 panoramas write" on storage.objects;
create policy "virtour360 panoramas write"
  on storage.objects for all
  using (bucket_id = 'panoramas')
  with check (bucket_id = 'panoramas');

-- Selesai. Isi env var VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY,
-- lalu build ulang / deploy ulang.
