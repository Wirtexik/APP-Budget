-- Schemat bazy dla aplikacji Budżet (Supabase / PostgreSQL).
-- Uruchom w panelu Supabase: SQL Editor -> New query -> Run.
--
-- Odtworzony 2026-10-18 z prawdziwej bazy (information_schema.columns + pg_policies).
-- Zweryfikowane: nazwy i typy kolumn, wartości domyślne, NULL/NOT NULL, polityki RLS.
-- NIEzweryfikowane (oznaczone "niezweryfikowane"): klucze obce i ich ON DELETE,
-- ograniczenia CHECK, precyzja `amount`, indeksy, role w politykach.
--
-- Uwagi dla kodu aplikacji:
--   * `id` to uuid (gen_random_uuid()), nie liczba.
--   * `user_id` nie ma wartości domyślnej – aplikacja musi go wysyłać przy insercie.
--   * `transactions.category_id` i `created_at` dopuszczają NULL.
--   * `created_at` służy do sortowania wpisów z tego samego dnia.
--
-- Po tym pliku uruchom po kolei migracje z supabase/migrations/:
--   20261018120000_recurring_rules.sql – zlecenia stałe (recurring_rules,
--   transactions.recurring_rule_id, funkcje materialize_recurring / upcoming_recurring)

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  -- niezweryfikowane: FK do auth.users
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  -- niezweryfikowane: CHECK
  type       text not null check (type in ('wydatek', 'przychod')),
  created_at timestamptz default now()
);

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  -- niezweryfikowane: FK do auth.users
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- niezweryfikowane: FK i jego ON DELETE (aplikacja i tak blokuje usunięcie
  -- kategorii z transakcjami)
  category_id uuid references public.categories (id),
  -- niezweryfikowane: precyzja i CHECK (amount > 0)
  amount      numeric not null,
  description text,
  date        date not null,
  created_at  timestamptz default now()
);

-- niezweryfikowane: istnienie indeksu w prawdziwej bazie
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date);

-- Row Level Security: każdy użytkownik widzi i zmienia wyłącznie własne wiersze.
-- with_check jest pusty, więc przy zapisie PostgreSQL używa warunku z USING.
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "Users can manage their own categories" on public.categories;
create policy "Users can manage their own categories" on public.categories
  for all
  using (auth.uid() = user_id);

drop policy if exists "Users can manage their own transactions" on public.transactions;
create policy "Users can manage their own transactions" on public.transactions
  for all
  using (auth.uid() = user_id);
