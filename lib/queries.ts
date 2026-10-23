// Zapytania do Supabase współdzielone przez ekrany aplikacji. Schemat tabel:
// lib/budget.ts oraz supabase/schema.sql. Komponenty nie wołają Supabase same –
// wszystkie odczyty i zapisy są tutaj (zlecenia stałe: lib/recurring-queries.ts).
// Funkcje zapisu zwracają komunikat błędu dla użytkownika albo null.
import {
  monthRange,
  yearRange,
  type Category,
  type CategoryRef,
  type CategoryType,
  type Id,
  type Transaction,
} from "@/lib/budget";
import {
  DEFAULT_CATEGORIES,
  defaultValue,
  sameCategory,
  userValue,
} from "@/lib/categories";
import { errorMessage } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase";

const TRANSACTION_COLUMNS =
  "id, amount, date, description, category_id, created_at, recurring_rule_id";

export type Resolved =
  | { id: Id; error: null }
  | { id: null; error: string };

// Zwraca id kategorii z bazy; kategorię domyślną tworzy, jeśli jeszcze jej nie ma.
async function ensureCategory(
  userId: string,
  categories: Category[],
  target: CategoryRef
): Promise<Resolved> {
  const existing = categories.find((c) => sameCategory(c, target));
  if (existing) return { id: existing.id, error: null };

  const { data, error } = await getSupabase()
    .from("categories")
    .insert({ user_id: userId, name: target.name, type: target.type })
    .select("id")
    .single();

  if (error) return { id: null, error: errorMessage(error) };
  return { id: data.id as Id, error: null };
}

export async function resolveCategory(
  userId: string,
  categories: Category[],
  value: string
): Promise<Resolved> {
  const own = categories.find((c) => userValue(c) === value);
  if (own) return { id: own.id, error: null };

  const target = DEFAULT_CATEGORIES.find((c) => defaultValue(c) === value);
  if (!target) return { id: null, error: "Wybierz kategorię." };
  return ensureCategory(userId, categories, target);
}

export async function insertTransaction(
  userId: string,
  categoryId: Id,
  fields: { amount: number; date: string; description: string }
) {
  const { error } = await getSupabase()
    .from("transactions")
    .insert({
      user_id: userId,
      amount: fields.amount,
      date: fields.date,
      description: fields.description.trim() || null,
      category_id: categoryId,
    });
  return error ? errorMessage(error) : null;
}

export async function deleteTransaction(userId: string, id: Id) {
  const { data, error } = await getSupabase()
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) return errorMessage(error);
  // Przy braku uprawnień (RLS) Supabase nie zgłasza błędu, tylko usuwa 0 wierszy.
  if (!data?.length) {
    return "Nie usunięto wpisu – nie istnieje albo brak uprawnień do usuwania.";
  }
  return null;
}

export async function insertCategory(
  userId: string,
  fields: { name: string; type: CategoryType }
) {
  const trimmed = fields.name.trim();
  if (!trimmed) return "Podaj nazwę kategorii.";

  const { error } = await getSupabase()
    .from("categories")
    .insert({ user_id: userId, name: trimmed, type: fields.type });
  return error ? errorMessage(error) : null;
}

export async function updateCategory(
  userId: string,
  id: Id,
  fields: { name: string; type: CategoryType }
) {
  const trimmed = fields.name.trim();
  if (!trimmed) return "Podaj nazwę kategorii.";

  const { data, error } = await getSupabase()
    .from("categories")
    .update({ name: trimmed, type: fields.type })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) return errorMessage(error);
  // Przy braku uprawnień (RLS) Supabase nie zgłasza błędu, tylko aktualizuje 0 wierszy.
  if (!data?.length) {
    return "Nie zapisano zmian – kategoria nie istnieje albo brak uprawnień do edycji.";
  }
  return null;
}

export interface CategoryUsage {
  error: string | null;
  transactions: number;
  rules: number;
}

// Ile transakcji i zleceń stałych używa kategorii. Sprawdzane przed usunięciem,
// bo przy kluczu obcym z ON DELETE CASCADE baza usunęłaby kategorię razem z jej
// transakcjami. Zlecenia blokuje RESTRICT w bazie, ale bez tego sprawdzenia
// komunikat nie powiedziałby, co blokuje usunięcie.
export async function countCategoryUsage(
  userId: string,
  id: Id
): Promise<CategoryUsage> {
  const supabase = getSupabase();
  const [transactions, rules] = await Promise.all([
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("category_id", id),
    supabase
      .from("recurring_rules")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("category_id", id),
  ]);

  const error = transactions.error ?? rules.error;
  return {
    error: error ? errorMessage(error) : null,
    transactions: transactions.count ?? 0,
    rules: rules.count ?? 0,
  };
}

export interface DeleteCategoryResult {
  error: string | null;
  /** Kategoria jest używana (klucz obcy) – wpis lub zlecenie pojawiło się po sprawdzeniu. */
  inUse: boolean;
}

export async function deleteCategory(
  userId: string,
  id: Id
): Promise<DeleteCategoryResult> {
  const { data, error } = await getSupabase()
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error?.code === "23503") return { error: null, inUse: true };
  if (error) return { error: errorMessage(error), inUse: false };
  // Przy braku uprawnień (RLS) Supabase nie zgłasza błędu, tylko usuwa 0 wierszy.
  if (!data?.length) {
    return {
      error: "Nie usunięto kategorii – nie istnieje albo brak uprawnień do usuwania.",
      inUse: false,
    };
  }
  return { error: null, inUse: false };
}

export async function updateTransaction(
  userId: string,
  id: Id,
  fields: {
    amount: number;
    date: string;
    description: string;
    categoryId: Id;
  }
) {
  const { data, error } = await getSupabase()
    .from("transactions")
    .update({
      amount: fields.amount,
      date: fields.date,
      description: fields.description.trim() || null,
      category_id: fields.categoryId,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) return errorMessage(error);
  // Przy braku uprawnień (RLS) Supabase nie zgłasza błędu, tylko aktualizuje 0 wierszy.
  if (!data?.length) {
    return "Nie zapisano zmian – wpis nie istnieje albo brak uprawnień do edycji.";
  }
  return null;
}

export interface DashboardData {
  error: string | null;
  categories: Category[];
  monthTransactions: Transaction[];
}

// Jedyne zapytanie o transakcje: wyłącznie wybrany miesiąc. Z niego liczą się karty,
// wykres i drzewo raportów, pełna historia oraz „ostatnie transakcje” na kokpicie.
export async function fetchDashboardData(
  userId: string,
  year: number,
  month: number
): Promise<DashboardData> {
  const supabase = getSupabase();
  const { start, next } = monthRange(year, month);

  const [cats, monthly] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, type")
      .eq("user_id", userId)
      .order("name"),
    supabase
      .from("transactions")
      .select(TRANSACTION_COLUMNS)
      .eq("user_id", userId)
      .gte("date", start)
      .lt("date", next)
      // Najpierw najnowsza data, a w obrębie tego samego dnia – najświeżej zapisany
      // wpis; `id` na końcu tylko dopina pełną stabilność sortowania.
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }),
  ]);

  const error = cats.error ?? monthly.error;
  return {
    error: error ? errorMessage(error) : null,
    categories: (cats.data ?? []) as Category[],
    monthTransactions: (monthly.data ?? []) as Transaction[],
  };
}

export interface YearlyData {
  error: string | null;
  transactions: Transaction[];
}

// Rozmiar partii przy pobieraniu roku. Nie może przekraczać limitu PostgREST
// (`max_rows`, w Supabase domyślnie 1000) – niepełna partia oznacza koniec danych.
const YEAR_PAGE_SIZE = 1000;

// Wszystkie transakcje wybranego roku – dane dla podsumowania rocznego w Raportach.
// PostgREST zwraca najwyżej `max_rows` wierszy na zapytanie, więc rok pobieramy
// partiami; bez tego raport roczny po cichu gubiłby wpisy ponad limit.
export async function fetchYearlyTransactions(
  userId: string,
  year: number
): Promise<YearlyData> {
  const { start, next } = yearRange(year);
  const transactions: Transaction[] = [];

  for (let from = 0; ; from += YEAR_PAGE_SIZE) {
    const { data, error } = await getSupabase()
      .from("transactions")
      .select(TRANSACTION_COLUMNS)
      .eq("user_id", userId)
      .gte("date", start)
      .lt("date", next)
      // Ta sama kolejność co w `fetchDashboardData`; pełne sortowanie jest też
      // warunkiem stabilnego stronicowania przez `range`.
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + YEAR_PAGE_SIZE - 1);

    if (error) return { error: errorMessage(error), transactions: [] };

    const page = (data ?? []) as Transaction[];
    transactions.push(...page);
    if (page.length < YEAR_PAGE_SIZE) break;
  }

  return { error: null, transactions };
}
