-- Schemat bazy dla aplikacji Budżet (Supabase / PostgreSQL).
-- Uruchom w panelu Supabase: SQL Editor -> New query -> Run.
--
-- Odtworzony 2026-10-18 z prawdziwej bazy (information_schema.columns + pg_policies):
-- nazwy i typy kolumn, wartości domyślne, NULL/NOT NULL, polityki RLS. Precyzja
-- `transactions.amount` sprawdzona 2026-10-23. Klucze obce, CHECK, indeksy i role
-- w politykach sprawdzone 2026-10-29 (pg_constraint, pg_indexes, pg_policies).
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
--   20261023120000_recurring_cron.sql – pg_cron: materialize_recurring() codziennie
--   o 23:05 UTC (sama włącza rozszerzenie pg_cron)
--   20261029120000_transactions_amount_check.sql – CHECK (amount > 0) i indeks
--   (user_id, date) w transactions

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  -- bez ON DELETE: usunięcie użytkownika z danymi w auth.users się nie powiedzie
  user_id    uuid not null references auth.users (id),
  name       text not null,
  type       text not null check (type in ('wydatek', 'przychod')),
  created_at timestamptz default now()
);

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  -- bez ON DELETE (jak w categories)
  user_id     uuid not null references auth.users (id),
  -- bez ON DELETE, czyli NO ACTION: kategorii z transakcjami nie da się usunąć
  category_id uuid references public.categories (id),
  -- numeric(10,2): maks. 99 999 999,99. W bazie nie ma CHECK (amount > 0),
  -- dodatnią kwotę pilnuje tylko aplikacja.
  amount      numeric(10, 2) not null,
  description text,
  date        date not null,
  created_at  timestamptz default now()
);

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
