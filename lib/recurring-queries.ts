// Zapytania do Supabase dla zleceń stałych. Typy i walidacja: lib/recurring.ts,
// schemat: supabase/migrations/20261018120000_recurring_rules.sql.
//
// Do tabeli wysyłane są tylko kolumny edytowalne – run_index, occurrences_count
// i next_run_date ustawia baza (trigger nadpisałby je i tak).
import type { PostgrestError } from "@supabase/supabase-js";
import type { Id } from "@/lib/budget";
import { errorMessage, type ErrorOverrides } from "@/lib/errors";
import type {
  RecurringRule,
  RecurringRulePayload,
  UpcomingOccurrence,
} from "@/lib/recurring";
import { getSupabase } from "@/lib/supabase";

// Jeden literał (bez „+”), żeby typy supabase-js mogły go sparsować.
const RULE_COLUMNS =
  "id, category_id, amount, description, frequency, interval_count, start_date, end_date, max_occurrences, is_active, run_index, occurrences_count, next_run_date, created_at";

const NOT_SAVED = "Nie zapisano zmian – zlecenie nie istnieje albo brak uprawnień do edycji.";

const NO_MIGRATION =
  "Baza nie obsługuje jeszcze zleceń stałych – uruchom migrację recurring_rules.";

// Komunikaty właściwe zleceniom; pozostałe kody tłumaczy lib/errors.ts.
const RECURRING_ERRORS: ErrorOverrides = {
  "23503": "Wybrana kategoria nie istnieje albo nie należy do Ciebie.",
  "23514": "Niepoprawne dane zlecenia (sprawdź kwotę, odstęp i daty).",
  "42883": NO_MIGRATION,
  PGRST202: NO_MIGRATION,
  "42P01": NO_MIGRATION,
  PGRST205: NO_MIGRATION,
};

const recurringError = (error: PostgrestError) =>
  errorMessage(error, RECURRING_ERRORS);

export interface RecurringRulesData {
  error: string | null;
  rules: RecurringRule[];
}

// Najpierw zlecenia z najbliższym terminem, zakończone (bez terminu) na końcu.
export async function fetchRecurringRules(userId: string): Promise<RecurringRulesData> {
  const { data, error } = await getSupabase()
    .from("recurring_rules")
    .select(RULE_COLUMNS)
    .eq("user_id", userId)
    .order("next_run_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return {
    error: error ? recurringError(error) : null,
    rules: (data ?? []) as RecurringRule[],
  };
}

export async function insertRecurringRule(
  userId: string,
  categoryId: Id,
  payload: RecurringRulePayload
) {
  const { error } = await getSupabase()
    .from("recurring_rules")
    .insert({ ...payload, user_id: userId, category_id: categoryId });
  return error ? recurringError(error) : null;
}

// Zmiana dotyczy tylko przyszłych wykonań – wykonane transakcje zostają bez zmian,
// a zmieniony harmonogram nie nadrabia przeszłości (trigger w bazie).
export async function updateRecurringRule(
  userId: string,
  id: Id,
  categoryId: Id,
  payload: RecurringRulePayload
) {
  const { data, error } = await getSupabase()
    .from("recurring_rules")
    .update({ ...payload, category_id: categoryId })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) return recurringError(error);
  // Przy braku uprawnień (RLS) Supabase nie zgłasza błędu, tylko aktualizuje 0 wierszy.
  if (!data?.length) return NOT_SAVED;
  return null;
}

// Wstrzymanie / wznowienie. Po wznowieniu terminy z czasu przerwy są pomijane.
export async function setRecurringRuleActive(userId: string, id: Id, active: boolean) {
  const { data, error } = await getSupabase()
    .from("recurring_rules")
    .update({ is_active: active })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) return recurringError(error);
  if (!data?.length) return NOT_SAVED;
  return null;
}

// Wykonane transakcje zostają w historii (recurring_rule_id → NULL).
export async function deleteRecurringRule(userId: string, id: Id) {
  const { data, error } = await getSupabase()
    .from("recurring_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) return recurringError(error);
  if (!data?.length) {
    return "Nie usunięto – zlecenie nie istnieje albo brak uprawnień.";
  }
  return null;
}

export interface MaterializeResult {
  error: string | null;
  /** Liczba nowo utworzonych transakcji. */
  created: number;
}

// Tworzy transakcje dla wszystkich zaległych terminów (idempotentne).
// Wołać przed pobraniem danych miesiąca, żeby nowe wpisy od razu były widoczne.
export async function materializeRecurring(): Promise<MaterializeResult> {
  const { data, error } = await getSupabase().rpc("materialize_recurring");
  if (error) return { error: recurringError(error), created: 0 };
  return { error: null, created: Number(data ?? 0) };
}

export interface UpcomingData {
  error: string | null;
  occurrences: UpcomingOccurrence[];
}

// Nadchodzące wykonania aktywnych zleceń do `until` (YYYY-MM-DD) włącznie.
export async function fetchUpcoming(until: string): Promise<UpcomingData> {
  const { data, error } = await getSupabase()
    .rpc("upcoming_recurring", { p_until: until })
    .order("occurs_on", { ascending: true });

  return {
    error: error ? recurringError(error) : null,
    occurrences: (data ?? []) as UpcomingOccurrence[],
  };
}
