create table if not exists public.fortune_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('cookie', 'animal', 'star')),
  profile jsonb not null default '{}'::jsonb,
  result jsonb not null,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists fortune_readings_user_id_created_at_idx
  on public.fortune_readings (user_id, created_at desc);

alter table public.fortune_readings enable row level security;

drop policy if exists "Users can read their own fortune readings" on public.fortune_readings;
create policy "Users can read their own fortune readings"
  on public.fortune_readings
  for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.reading_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reading_kind text not null check (reading_kind in ('tarot', 'fortune', 'saju')),
  reading_id uuid,
  rating integer not null check (rating between 1 and 5),
  content text not null check (char_length(trim(content)) between 5 and 600),
  display_name text not null default '월연당 회원',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reading_reviews_created_at_idx
  on public.reading_reviews (created_at desc);

create index if not exists reading_reviews_user_id_created_at_idx
  on public.reading_reviews (user_id, created_at desc);

alter table public.reading_reviews enable row level security;

drop policy if exists "Anyone can read reading reviews" on public.reading_reviews;
create policy "Anyone can read reading reviews"
  on public.reading_reviews
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Users can create their own reading reviews" on public.reading_reviews;
create policy "Users can create their own reading reviews"
  on public.reading_reviews
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own reading reviews" on public.reading_reviews;
create policy "Users can update their own reading reviews"
  on public.reading_reviews
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists reading_reviews_set_updated_at on public.reading_reviews;
create trigger reading_reviews_set_updated_at
  before update on public.reading_reviews
  for each row execute function public.set_updated_at();
