-- Optymalizacja i uszczelnienie bazy (przegląd 2026-11-09).
-- Uruchom w panelu Supabase: SQL Editor -> New query -> Run.
-- Wymaga wcześniej uruchomionych: supabase/schema.sql i wszystkich wcześniejszych
-- migracji. Skrypt jest idempotentny (można go uruchomić ponownie bez szkody).
--
--   * RLS: `(select auth.uid())` zamiast `auth.uid()` – zalecenie Supabase
--     (Performance Advisor, auth_rls_initplan): funkcja liczy się raz na zapytanie,
--     a nie dla każdego wiersza. Warunki polityk bez zmian.
--   * Indeksy pod zapytania po kategorii: skarbonka (wpisy dwóch kategorii od
--     początku), sprawdzenie przed usunięciem kategorii i sprawdzanie kluczy
--     obcych przy usuwaniu kategorii (bez indeksu – pełny skan tabeli).
--   * recurring_rules.amount <= 99 999 999,99: kolumna ma numeric(12,2), a wykonanie
--     trafia do transactions.amount numeric(10,2). Za duża kwota przerwałaby
--     materialize_recurring() dla wszystkich zleceń. Jeśli w bazie jest już taki
--     wiersz, VALIDATE się nie powiedzie i cała migracja zostanie wycofana:
--       select * from public.recurring_rules where amount > 99999999.99;
--   * Transakcja może wskazywać tylko własną kategorię. Klucz obcy nie widzi RLS,
--     więc bez tego dało się podpiąć wpis pod cudzą kategorię (znając jej uuid).
--     recurring_rules ma takie sprawdzenie od początku (recurring_rules_before_write).
--     Istniejących wierszy trigger nie sprawdza. Ewentualne niezgodności pokaże:
--       select t.id from public.transactions t
--       join public.categories c on c.id = t.category_id
--       where c.user_id <> t.user_id;

begin;

-- ---------------------------------------------------------------------------
-- RLS: (select auth.uid())
-- ---------------------------------------------------------------------------

drop policy if exists "Users can manage their own categories" on public.categories;
create policy "Users can manage their own categories" on public.categories
  for all
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can manage their own transactions" on public.transactions;
create policy "Users can manage their own transactions" on public.transactions
  for all
  using ((select auth.uid()) = user_id);

drop policy if exists "recurring_rules: własne wiersze" on public.recurring_rules;
create policy "recurring_rules: własne wiersze" on public.recurring_rules
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Indeksy po kategorii
-- ---------------------------------------------------------------------------

create index if not exists transactions_user_category_idx
  on public.transactions (user_id, category_id);

create index if not exists recurring_rules_category_idx
  on public.recurring_rules (category_id);

-- ---------------------------------------------------------------------------
-- Limit kwoty zlecenia = limit kwoty transakcji
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.recurring_rules'::regclass
      and conname = 'recurring_rules_amount_max'
  ) then
    alter table public.recurring_rules
      add constraint recurring_rules_amount_max check (amount <= 99999999.99) not valid;
  end if;
end;
$$;

alter table public.recurring_rules validate constraint recurring_rules_amount_max;

-- ---------------------------------------------------------------------------
-- Transakcja tylko z własną kategorią
-- ---------------------------------------------------------------------------

-- SECURITY INVOKER: zalogowany użytkownik widzi przez RLS tylko swoje kategorie,
-- a pg_cron (materialize_recurring, rola postgres) – wszystkie, więc warunek
-- `c.user_id = new.user_id` sprawdza właściciela w obu przypadkach.
create or replace function public.transactions_check_category()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.category_id is not null and not exists (
    select 1 from public.categories c
    where c.id = new.category_id and c.user_id = new.user_id
  ) then
    raise exception 'Kategoria % nie należy do użytkownika', new.category_id
      using errcode = '23503';
  end if;
  return new;
end;
$$;

drop trigger if exists transactions_check_category on public.transactions;
create trigger transactions_check_category
  before insert or update of category_id, user_id on public.transactions
  for each row execute function public.transactions_check_category();

commit;
