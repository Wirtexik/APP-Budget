-- Przykładowy schemat bazy dla aplikacji Budżet (Supabase / PostgreSQL).
-- Uruchom w panelu Supabase: SQL Editor -> New query -> Run.
--
-- Aplikacja zakłada dokładnie takie nazwy tabel i kolumn:
--   categories(id, user_id, name, type)
--   transactions(id, user_id, amount, date, description, category_id, created_at)
-- `created_at` (ustawiane automatycznie przez `default now()`) jest wymagane –
-- aplikacja sortuje po nim wpisy z tego samego dnia.

create table if not exists public.categories (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  type       text not null check (type in ('wydatek', 'przychod')),
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- restrict: kategorii z transakcjami nie da się usunąć (aplikacja też to sprawdza)
  category_id bigint not null references public.categories (id) on delete restrict,
  amount      numeric(12, 2) not null check (amount > 0),
  date        date not null,
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date);

-- Row Level Security: każdy użytkownik widzi i zmienia wyłącznie własne wiersze.
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;

create policy "categories: własne wiersze" on public.categories
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions: własne wiersze" on public.transactions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
