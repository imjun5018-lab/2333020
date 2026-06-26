alter table public.profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin'));

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id text not null unique,
  payment_key text unique,
  order_name text not null,
  product_kind text not null check (product_kind in ('tarot', 'fortune', 'saju')),
  amount integer not null check (amount > 0),
  currency text not null default 'KRW',
  status text not null default 'requested',
  method text,
  approved_at timestamptz,
  canceled_at timestamptz,
  cancel_reason text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_user_id_created_at_idx
  on public.payments (user_id, created_at desc);

create index if not exists payments_status_created_at_idx
  on public.payments (status, created_at desc);

alter table public.payments enable row level security;

drop policy if exists "Users can read their own payments" on public.payments;
create policy "Users can read their own payments"
  on public.payments
  for select
  to authenticated
  using (auth.uid() = user_id);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();
