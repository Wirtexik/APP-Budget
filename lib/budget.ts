// Typy modelu danych i helpery (daty, formatowanie, sumy) współdzielone
// przez cały interfejs.
//
// Schemat bazy używany przez aplikację (SQL: supabase/schema.sql):
//   categories(id, user_id, name, type)
//   transactions(id, user_id, amount, date, description, category_id)
// `amount` zawsze jest dodatnie; czy to wydatek, czy przychód, wynika z `categories.type`.

export type Id = string | number;
export type CategoryType = "wydatek" | "przychod";

export interface CategoryRef {
  name: string;
  type: CategoryType;
}

export interface Category extends CategoryRef {
  id: Id;
}

export interface Transaction {
  id: Id;
  amount: number;
  date: string;
  description: string | null;
  category_id: Id | null;
}

export const TYPE_LABEL: Record<CategoryType, string> = {
  wydatek: "Wydatek",
  przychod: "Przychód",
};

export const currency = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
});

export function formatDate(value: string) {
  const [y, m, d] = value.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

// Data w strefie lokalnej (toISOString przesunęłoby ją o strefę czasową).
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Zakres miesiąca (`month` liczony od 0): od pierwszego dnia włącznie do początku
// następnego miesiąca wyłącznie – to samo, co „do ostatniego dnia”, ale poprawne
// także wtedy, gdy kolumna `date` zawiera godzinę.
export function monthRange(year: number, month: number) {
  return {
    start: dateKey(new Date(year, month, 1)),
    next: dateKey(new Date(year, month + 1, 1)),
  };
}

export function parseAmount(raw: string) {
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function pluralEntries(n: number) {
  if (n === 1) return "wpis";
  const last = n % 10;
  const lastTwo = n % 100;
  return last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14)
    ? "wpisy"
    : "wpisów";
}

export const MONTH_NAMES = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

export const MONTH_ITEMS = MONTH_NAMES.map((label, i) => ({
  value: String(i),
  label,
}));

// Lata dostępne w selektorze: 5 wstecz, bieżący i następny.
export const YEAR_ITEMS = Array.from({ length: 7 }, (_, i) => {
  const year = new Date().getFullYear() - 5 + i;
  return { value: String(year), label: String(year) };
});

export const TYPE_ITEMS: { value: CategoryType; label: string }[] = [
  { value: "wydatek", label: "Wydatek" },
  { value: "przychod", label: "Przychód" },
];

export interface Totals {
  income: number;
  expenses: number;
  balance: number;
}

// Sumy przychodów i wydatków; typ wpisu wynika z kategorii (`categories.type`).
export function computeTotals(
  transactions: Transaction[],
  categoryById: Map<string, Category>
): Totals {
  let income = 0;
  let expenses = 0;
  for (const t of transactions) {
    const type = categoryById.get(String(t.category_id))?.type;
    if (type === "przychod") income += Number(t.amount);
    else if (type === "wydatek") expenses += Number(t.amount);
  }
  return { income, expenses, balance: income - expenses };
}
