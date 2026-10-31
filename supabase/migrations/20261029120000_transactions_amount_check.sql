-- Uzupełnienie braków w transactions wykrytych przy weryfikacji schema.sql (2026-10-29).
-- Uruchom w panelu Supabase: SQL Editor -> New query -> Run.
-- Wymaga wcześniej uruchomionego supabase/schema.sql. Skrypt jest idempotentny
-- (można go uruchomić ponownie bez szkody).
--
--   * CHECK (amount > 0): kwota jest zawsze dodatnia (typ wynika z kategorii),
--     a dotąd pilnowała tego tylko aplikacja. recurring_rules ma ten CHECK od początku.
--     Jeśli w bazie jest już kwota <= 0, VALIDATE się nie powiedzie i cała migracja
--     zostanie wycofana. Takie wiersze pokaże:
--       select * from public.transactions where amount <= 0;
--   * Indeks (user_id, date) pod zapytania o miesiąc i zakres dat.

begin;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.transactions'::regclass
      and conname = 'transactions_amount_check'
  ) then
    alter table public.transactions
      add constraint transactions_amount_check check (amount > 0) not valid;
  end if;
end;
$$;

-- Sprawdza istniejące wiersze; na już zweryfikowanym ograniczeniu nic nie robi.
alter table public.transactions validate constraint transactions_amount_check;

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date);

commit;
