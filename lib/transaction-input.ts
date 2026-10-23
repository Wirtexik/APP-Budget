// Walidacja formularza transakcji (czysta logika, bez Supabase). Wspólna dla
// formularza wydatku, okna przychodu, edycji i przyszłego formularza mobilnego.
import { AMOUNT_ERROR, parseAmount } from "@/lib/budget";

/** Surowe wartości pól formularza. */
export interface TransactionInput {
  amount: string;
  date: string;
  /** Wartość selecta kategorii (`default:…` albo `user:…`), patrz lib/categories.ts. */
  categoryValue: string | null;
}

export interface ValidTransactionInput {
  amount: number;
  date: string;
  categoryValue: string;
}

export type TransactionValidation =
  | { ok: true; value: ValidTransactionInput }
  | { ok: false; error: string };

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// Data `YYYY-MM-DD`, która naprawdę istnieje (bez 2026-02-30).
function isValidDate(value: string) {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
  );
}

// Błędy w kolejności pól formularza: kwota, data, kategoria.
export function validateTransactionInput(
  input: TransactionInput
): TransactionValidation {
  const amount = parseAmount(input.amount);
  if (amount === null) return { ok: false, error: AMOUNT_ERROR };
  if (!isValidDate(input.date)) return { ok: false, error: "Podaj datę." };
  if (!input.categoryValue) return { ok: false, error: "Wybierz kategorię." };
  return {
    ok: true,
    value: { amount, date: input.date, categoryValue: input.categoryValue },
  };
}
