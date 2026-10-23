-- Automatyczne wykonywanie zleceń stałych (etap 3 z PLAN.md) przez pg_cron.
-- Uruchom w panelu Supabase: SQL Editor -> New query -> Run.
-- Wymaga wcześniej uruchomionej migracji 20261018120000_recurring_rules.sql.
-- Skrypt jest idempotentny (można go uruchomić ponownie bez szkody).
--
--   * Raz dziennie o 23:05 UTC, czyli zawsze po północy w Polsce
--     (00:05 czasu zimowego, 01:05 letniego). cron w Supabase działa w UTC.
--   * Zadanie działa jako rola, która je zaplanowała (w SQL Editorze: postgres,
--     bez RLS), więc materialize_recurring() przetwarza zlecenia wszystkich
--     użytkowników.
--   * Wywołanie przy otwarciu aplikacji zostaje jako zabezpieczenie. Funkcja jest
--     idempotentna, więc oba sposoby nie utworzą dwa razy tej samej transakcji.
--
-- Podgląd zadania:   select * from cron.job where jobname = 'materialize-recurring';
-- Historia wykonań:  select * from cron.job_run_details order by start_time desc limit 20;
-- Wyłączenie:        select cron.unschedule('materialize-recurring');

create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;

-- Usuwamy poprzednią wersję zadania, żeby ponowne uruchomienie nie zostawiło
-- starego harmonogramu.
select cron.unschedule(jobid)
from cron.job
where jobname = 'materialize-recurring';

select cron.schedule(
  'materialize-recurring',
  '5 23 * * *',
  $$select public.materialize_recurring()$$
);
