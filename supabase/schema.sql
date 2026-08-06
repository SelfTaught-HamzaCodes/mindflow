-- Mindflow optional persistence schema (Milestone 6)
-- Run in Supabase SQL editor only if you want remote session notes / task sync.
-- The prototype works fully without Supabase using local JSON.

create table if not exists public.session_notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default 'demo-alex',
  note_type text not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key,
  title text not null,
  description text,
  priority text,
  status text,
  due_date date,
  today boolean default false,
  important boolean default false,
  category text,
  updated_at timestamptz not null default now()
);

-- Research prototype: permissive policies for the demo anon key.
-- Do NOT use these policies for a production deployment.
alter table public.session_notes enable row level security;
alter table public.tasks enable row level security;

create policy "Allow anon insert session notes"
  on public.session_notes for insert
  to anon
  with check (true);

create policy "Allow anon select session notes"
  on public.session_notes for select
  to anon
  using (true);

create policy "Allow anon upsert tasks"
  on public.tasks for all
  to anon
  using (true)
  with check (true);
