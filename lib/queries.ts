// Zapytania do Supabase współdzielone przez ekrany aplikacji. Schemat tabel:
// lib/budget.ts oraz supabase/schema.sql. Jednorazowe operacje (dodawanie
// i usuwanie kategorii, usuwanie transakcji) są w swoich komponentach.
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
import { getSupabase } from "@/lib/supabase";

export interface Resolved {
  id: Id | null;
  error: string | null;
}

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

  if (error) return { id: null, error: error.message };
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
  return error?.message ?? null;
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

  if (error) return error.message;
  // Przy braku uprawnień (RLS) Supabase nie zgłasza błędu, tylko aktualizuje 0 wierszy.
  if (!data?.length) {
    return "Nie zapisano zmian – kategoria nie istnieje albo brak uprawnień do edycji.";
  }
  return null;
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

  if (error) return error.message;
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
      .select("id, amount, date, description, category_id, created_at")
      .eq("user_id", userId)
      .gte("date", start)
      .lt("date", next)
      // Najpierw najnowsza data, a w obrębie tego samego dnia – najświeżej zapisany
      // wpis; `id` na końcu tylko dopina pełną stabilność sortowania.
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }),
  ]);

  return {
    error: (cats.error ?? monthly.error)?.message ?? null,
    categories: (cats.data ?? []) as Category[],
    monthTransactions: (monthly.data ?? []) as Transaction[],
  };
}

export interface YearlyData {
  error: string | null;
  transactions: Transaction[];
}

// Wszystkie transakcje wybranego roku – dane dla podsumowania rocznego w Raportach.
export async function fetchYearlyTransactions(
  userId: string,
  year: number
): Promise<YearlyData> {
  const { start, next } = yearRange(year);

  const { data, error } = await getSupabase()
    .from("transactions")
    .select("id, amount, date, description, category_id, created_at")
    .eq("user_id", userId)
    .gte("date", start)
    .lt("date", next)
    .order("date", { ascending: false });

  return {
    error: error?.message ?? null,
    transactions: (data ?? []) as Transaction[],
  };
}
