-- Zlecenia stałe (etap 3 z PLAN.md).
-- Uruchom w panelu Supabase: SQL Editor -> New query -> Run.
-- Wymaga wcześniej uruchomionego supabase/schema.sql. Skrypt jest idempotentny
-- (można go uruchomić ponownie bez szkody). Typy kluczy (uuid) zgodne z prawdziwą
-- bazą sprawdzoną 2026-10-18.
--
-- Model (wzorowany na zleceniach stałych w bankach):
--   * Harmonogram: frequency ('daily' | 'weekly' | 'monthly' | 'yearly') × interval_count.
--     Presety z interfejsu: co 2 tygodnie = weekly × 2, kwartalnie = monthly × 3.
--   * N-te wykonanie liczone jest zawsze od start_date (start_date + N × okres), więc
--     zlecenie na 31. dzień w lutym wypada 28/29., a w marcu wraca na 31. (bez dryfu).
--   * Koniec: brak, end_date (włącznie) albo max_occurrences.
--   * Wstrzymanie (is_active = false) pomija terminy z czasu przerwy – po wznowieniu
--     następne wykonanie to pierwszy termin >= dziś.
--   * Zmiana harmonogramu dotyczy tylko przyszłości: wykonane transakcje zostają,
--     zaległe terminy z nowego harmonogramu nie są nadrabiane.
--   * Nowe zlecenie z datą startu w przeszłości nadrabia zaległe terminy
--     (interfejs może tego zabronić, baza na to pozwala).
--   * Transakcje tworzy public.materialize_recurring() – aplikacja woła ją przy
--     otwarciu; opcjonalnie pg_cron (na końcu pliku).
--   * Unikalny indeks (recurring_rule_id, date) gwarantuje, że to samo wykonanie
--     nie powstanie dwa razy (np. dwie karty przeglądarki naraz).
--
-- Kolumny run_index, occurrences_count i next_run_date są wewnętrzne: zmienia je
-- tylko materialize_recurring(). Trigger nadpisuje wartości wysłane przez klienta.

begin;

-- ---------------------------------------------------------------------------
-- Funkcje pomocnicze
-- ---------------------------------------------------------------------------

-- "Dziś" w strefie użytkownika. current_date w Supabase to UTC, więc o 0:30
-- w Polsce byłby jeszcze wczorajszy dzień.
create or replace function public.budget_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Warsaw')::date
$$;

-- Data N-tego wykonania (N od 0). Dodawanie miesięcy/lat w PostgreSQL przycina
-- dzień do końca krótszego miesiąca: 2026-01-31 + 1 miesiąc = 2026-02-28.
create or replace function public.recurring_occurrence(
  p_start    date,
  p_frequency text,
  p_interval integer,
  p_index    integer
)
returns date
language sql
immutable
set search_path = ''
as $$
  select (p_start + case p_frequency
    when 'daily'   then make_interval(days   => p_interval * p_index)
    when 'weekly'  then make_interval(weeks  => p_interval * p_index)
    when 'monthly' then make_interval(months => p_interval * p_index)
    when 'yearly'  then make_interval(years  => p_interval * p_index)
  end)::date
$$;

-- Następny termin albo null, gdy zlecenie się zakończyło (limit wykonań lub end_date).
create or replace function public.recurring_next_date(
  p_start           date,
  p_frequency       text,
  p_interval        integer,
  p_index           integer,
  p_count           integer,
  p_max_occurrences integer,
  p_end_date        date
)
returns date
language sql
immutable
set search_path = ''
as $$
  select case
    when p_max_occurrences is not null and p_count >= p_max_occurrences then null
    when p_end_date is not null and o.d > p_end_date then null
    else o.d
  end
  from (select public.recurring_occurrence(p_start, p_frequency, p_interval, p_index) as d) as o
$$;

-- ---------------------------------------------------------------------------
-- Tabela zleceń stałych
-- ---------------------------------------------------------------------------

create table if not exists public.recurring_rules (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- restrict: kategorii używanej w zleceniu nie da się usunąć
  category_id       uuid not null references public.categories (id) on delete restrict,
  amount            numeric(12, 2) not null check (amount > 0),
  description       text,
  frequency         text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  interval_count    integer not null default 1 check (interval_count between 1 and 100),
  start_date        date not null,
  end_date          date,
  max_occurrences   integer check (max_occurrences > 0),
  is_active         boolean not null default true,
  -- wewnętrzne (patrz nagłówek)
  run_index         integer not null default 0,
  occurrences_count integer not null default 0,
  next_run_date     date,
  created_at        timestamptz not null default now(),
  constraint recurring_rules_end_after_start check (end_date is null or end_date >= start_date)
);

create index if not exists recurring_rules_user_idx
  on public.recurring_rules (user_id);

create index if not exists recurring_rules_due_idx
  on public.recurring_rules (next_run_date)
  where is_active and next_run_date is not null;

alter table public.recurring_rules enable row level security;

drop policy if exists "recurring_rules: własne wiersze" on public.recurring_rules;
create policy "recurring_rules: własne wiersze" on public.recurring_rules
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Powiązanie transakcji ze zleceniem
-- ---------------------------------------------------------------------------

-- set null: usunięcie zlecenia zostawia wykonane transakcje w historii
alter table public.transactions
  add column if not exists recurring_rule_id uuid
  references public.recurring_rules (id) on delete set null;

-- NULL-e nie kolidują ze sobą, więc zwykłe transakcje nie są ograniczone
create unique index if not exists transactions_recurring_rule_date_key
  on public.transactions (recurring_rule_id, date);

-- ---------------------------------------------------------------------------
-- Trigger: pilnuje kolumn wewnętrznych i przelicza next_run_date
-- ---------------------------------------------------------------------------

create or replace function public.recurring_rules_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_from date;
begin
  -- materialize_recurring() sama ustawia kolumny wewnętrzne
  if current_setting('budget.materializing', true) = 'on' then
    return new;
  end if;

  -- FK nie widzi RLS, więc bez tego dałoby się wskazać cudzą kategorię
  if not exists (
    select 1 from public.categories c
    where c.id = new.category_id and c.user_id = new.user_id
  ) then
    raise exception 'Kategoria % nie należy do użytkownika', new.category_id
      using errcode = '23503';
  end if;

  if tg_op = 'INSERT' then
    new.run_index := 0;
    new.occurrences_count := 0;
  else
    new.run_index := old.run_index;
    new.occurrences_count := old.occurrences_count;

    -- Zmiana harmonogramu: liczymy od nowa, ale bez nadrabiania przeszłości.
    if new.start_date     is distinct from old.start_date
    or new.frequency      is distinct from old.frequency
    or new.interval_count is distinct from old.interval_count then
      new.run_index := 0;
      v_from := public.budget_today();
    -- Wznowienie albo edycja zakończonego zlecenia (np. późniejszy end_date):
    -- pomijamy terminy z czasu przerwy.
    elsif (new.is_active and not old.is_active) or old.next_run_date is null then
      v_from := public.budget_today();
    end if;

    if v_from is not null then
      while public.recurring_occurrence(new.start_date, new.frequency, new.interval_count, new.run_index) < v_from loop
        new.run_index := new.run_index + 1;
      end loop;
    end if;
  end if;

  new.next_run_date := public.recurring_next_date(
    new.start_date, new.frequency, new.interval_count,
    new.run_index, new.occurrences_count, new.max_occurrences, new.end_date
  );
  return new;
end;
$$;

drop trigger if exists recurring_rules_before_write on public.recurring_rules;
create trigger recurring_rules_before_write
  before insert or update on public.recurring_rules
  for each row execute function public.recurring_rules_before_write();

-- ---------------------------------------------------------------------------
-- Wykonywanie zleceń
-- ---------------------------------------------------------------------------

-- Tworzy transakcje dla wszystkich terminów <= dziś i zwraca liczbę nowych.
-- SECURITY INVOKER: zalogowany użytkownik (RLS) przetwarza tylko swoje zlecenia,
-- pg_cron (rola postgres, bez RLS) – zlecenia wszystkich użytkowników.
create or replace function public.materialize_recurring()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  r         public.recurring_rules%rowtype;
  v_today   date := public.budget_today();
  v_date    date;
  v_created integer := 0;
  v_rows    integer;
  v_guard   integer;
begin
  perform set_config('budget.materializing', 'on', true);

  for r in
    select * from public.recurring_rules
    where is_active and next_run_date is not null and next_run_date <= v_today
    order by id
    -- równoległe wywołanie pomija zlecenia, które właśnie są przetwarzane
    for update skip locked
  loop
    v_date := r.next_run_date;
    v_guard := 0;

    -- limit 1000 na wywołanie chroni przed bardzo długą pętlą (np. codzienne od lat);
    -- reszta zostanie nadrobiona przy kolejnym wywołaniu
    while v_date is not null and v_date <= v_today and v_guard < 1000 loop
      insert into public.transactions (user_id, category_id, amount, date, description, recurring_rule_id)
      values (r.user_id, r.category_id, r.amount, v_date, r.description, r.id)
      on conflict (recurring_rule_id, date) do nothing;

      get diagnostics v_rows = row_count;
      v_created := v_created + v_rows;

      -- konflikt oznacza, że wykonanie już istnieje – też się liczy
      r.occurrences_count := r.occurrences_count + 1;
      r.run_index := r.run_index + 1;
      v_date := public.recurring_next_date(
        r.start_date, r.frequency, r.interval_count,
        r.run_index, r.occurrences_count, r.max_occurrences, r.end_date
      );
      v_guard := v_guard + 1;
    end loop;

    update public.recurring_rules
    set run_index = r.run_index,
        occurrences_count = r.occurrences_count,
        next_run_date = v_date
    where id = r.id;
  end loop;

  perform set_config('budget.materializing', 'off', true);
  return v_created;
end;
$$;

-- Nadchodzące wykonania aktywnych zleceń do p_until włącznie (widok „Nadchodzące”).
-- Niczego nie zapisuje. Zakłada, że wcześniej wywołano materialize_recurring().
create or replace function public.upcoming_recurring(p_until date)
returns table (
  rule_id     uuid,
  occurs_on   date,
  amount      numeric,
  category_id uuid,
  description text
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  r       public.recurring_rules%rowtype;
  v_index integer;
  v_count integer;
  v_date  date;
  v_guard integer;
begin
  for r in
    select * from public.recurring_rules
    where is_active and next_run_date is not null and next_run_date <= p_until
  loop
    v_index := r.run_index;
    v_count := r.occurrences_count;
    v_date := r.next_run_date;
    v_guard := 0;

    while v_date is not null and v_date <= p_until and v_guard < 500 loop
      rule_id := r.id;
      occurs_on := v_date;
      amount := r.amount;
      category_id := r.category_id;
      description := r.description;
      return next;

      v_index := v_index + 1;
      v_count := v_count + 1;
      v_date := public.recurring_next_date(
        r.start_date, r.frequency, r.interval_count,
        v_index, v_count, r.max_occurrences, r.end_date
      );
      v_guard := v_guard + 1;
    end loop;
  end loop;

  return;
end;
$$;

-- ---------------------------------------------------------------------------
-- Uprawnienia do funkcji (anon nie może ich wywołać przez API)
-- ---------------------------------------------------------------------------

revoke execute on function public.materialize_recurring()  from public, anon;
revoke execute on function public.upcoming_recurring(date) from public, anon;
grant  execute on function public.materialize_recurring()  to authenticated;
grant  execute on function public.upcoming_recurring(date) to authenticated;

commit;

-- ---------------------------------------------------------------------------
-- Opcjonalnie: automatyczne wykonywanie bez otwierania aplikacji (pg_cron).
-- Włącz rozszerzenie: Database -> Extensions -> pg_cron, potem uruchom osobno.
-- Co godzinę, bo cron działa w UTC, a funkcja jest idempotentna.
-- ---------------------------------------------------------------------------
-- select cron.schedule(
--   'materialize-recurring',
--   '5 * * * *',
--   $$select public.materialize_recurring()$$
-- );
