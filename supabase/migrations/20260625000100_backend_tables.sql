create table if not exists public.tarot_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reading_type text not null default 'today',
  cards jsonb not null,
  result jsonb not null,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists tarot_readings_user_id_created_at_idx
  on public.tarot_readings (user_id, created_at desc);

alter table public.tarot_readings enable row level security;

drop policy if exists "Users can read their own tarot readings" on public.tarot_readings;
create policy "Users can read their own tarot readings"
  on public.tarot_readings
  for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.image_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists image_records_user_id_created_at_idx
  on public.image_records (user_id, created_at desc);

alter table public.image_records enable row level security;

drop policy if exists "Users can read their own image records" on public.image_records;
create policy "Users can read their own image records"
  on public.image_records
  for select
  to authenticated
  using (auth.uid() = user_id);
