// Typy modelu danych i helpery (daty, formatowanie, sumy) współdzielone
// przez cały interfejs.
//
// Schemat bazy używany przez aplikację (SQL: supabase/schema.sql):
//   categories(id, user_id, name, type)
//   transactions(id, user_id, amount, date, description, category_id, created_at,
//                recurring_rule_id)
//   recurring_rules – zlecenia stałe, patrz lib/recurring.ts
// `amount` zawsze jest dodatnie; czy to wydatek, czy przychód, wynika z `categories.type`.
// `created_at` musi być ustawiane automatycznie przez bazę (default now()) – aplikacja
// używa go jako drugiego kryterium sortowania przy równych datach.

// Wszystkie klucze w bazie to `uuid`, a supabase-js zwraca je jako tekst.
export type Id = string;
export type CategoryType = "wydatek" | "przychod";

export interface CategoryRef {
  name: string;
  type: CategoryType;
}

export interface Category extends CategoryRef {
  id: Id;
}

/** Globalny filtr czasu: oglądany miesiąc. */
export interface Period {
  year: number;
  /** Numer miesiąca liczony od 0 (styczeń = 0). */
  month: number;
}

export interface Transaction {
  id: Id;
  amount: number;
  date: string;
  description: string | null;
  category_id: Id | null;
  /** Znacznik czasu zapisu wiersza – drugie kryterium sortowania po `date`. */
  created_at: string;
  /** Zlecenie stałe, które utworzyło wpis (null dla wpisów ręcznych i po usunięciu zlecenia). */
  recurring_rule_id: Id | null;
}

// Kategoria wpisu; `undefined`, gdy wpis nie ma kategorii albo nie ma jej na liście.
export const categoryOf = (
  item: { category_id: Id | null },
  categoryById: Map<Id, Category>
) => (item.category_id ? categoryById.get(item.category_id) : undefined);

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

// Zakres całego roku, na tej samej zasadzie co `monthRange`.
export function yearRange(year: number) {
  return {
    start: dateKey(new Date(year, 0, 1)),
    next: dateKey(new Date(year + 1, 0, 1)),
  };
}

// Największa kwota, jaką przyjmuje `transactions.amount numeric(10,2)`. Ten sam
// limit obowiązuje zlecenia stałe – ich wykonania trafiają do `transactions`.
export const MAX_AMOUNT = 99_999_999.99;

// Komunikat formularzy, gdy `parseAmount` zwróci null.
export const AMOUNT_ERROR =
  "Podaj kwotę od 0,01 do 99 999 999,99 zł (najwyżej 2 miejsca po przecinku).";

// Cyfry, opcjonalnie przecinek lub kropka i najwyżej 2 miejsca po nim.
const AMOUNT_PATTERN = /^\d*[.,]?\d{0,2}$/;

// Kwota wpisana przez użytkownika („1 000,50”, „12.5”). Spacje (także twarde,
// np. z wklejonej kwoty) są pomijane. Zwraca null dla kwoty niepoprawnej,
// niedodatniej, z ponad 2 miejscami po przecinku albo większej niż MAX_AMOUNT.
export function parseAmount(raw: string) {
  const compact = raw.replace(/\s/g, "");
  if (!AMOUNT_PATTERN.test(compact)) return null;
  const value = Number(compact.replace(",", "."));
  return Number.isFinite(value) && value > 0 && value <= MAX_AMOUNT
    ? value
    : null;
}

// Sumy liczone w groszach (liczbach całkowitych), żeby nie zbierać błędów
// zmiennoprzecinkowych (0.1 + 0.2 !== 0.3) – inaczej saldo bliskie zeru
// mogłoby się wyświetlić jako „−0,00 zł”.
export const toGrosze = (amount: number | string) =>
  Math.round(Number(amount) * 100);

export const fromGrosze = (grosze: number) => grosze / 100;

// Polska odmiana po liczebniku: 1 wpis, 2–4 wpisy (bez 12–14), 5 wpisów.
export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const last = n % 10;
  const lastTwo = n % 100;
  return last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14) ? few : many;
}

export const pluralEntries = (n: number) => plural(n, "wpis", "wpisy", "wpisów");

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

// Bieżący miesiąc wg zegara urządzenia – domyślny okres aplikacji.
export function currentPeriod(): Period {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export const samePeriod = (a: Period, b: Period) =>
  a.year === b.year && a.month === b.month;

// Etykieta miesiąca do opisów kart, np. „październik 2026”.
export const periodLabel = ({ year, month }: Period) =>
  `${MONTH_NAMES[month].toLowerCase()} ${year}`;

export const MONTH_ITEMS = MONTH_NAMES.map((label, i) => ({
  value: String(i),
  label,
}));

// Lata dostępne w selektorze: 5 wstecz, bieżący i następny.
export const YEAR_ITEMS = Array.from({ length: 7 }, (_, i) => {
  const year = new Date().getFullYear() - 5 + i;
  return { value: String(year), label: String(year) };
});

// Okres przesunięty o `delta` miesięcy (przez granicę roku). `null`, gdy wynik
// wypada poza zakres lat selektora – strzałka w nagłówku wtedy gaśnie.
export function shiftPeriod({ year, month }: Period, delta: number): Period | null {
  const index = year * 12 + month + delta;
  const next = { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
  return YEAR_ITEMS.some((item) => item.value === String(next.year)) ? next : null;
}

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
    const type = categoryOf(t, categoryById)?.type;
    if (type === "przychod") income += toGrosze(t.amount);
    else if (type === "wydatek") expenses += toGrosze(t.amount);
  }
  return {
    income: fromGrosze(income),
    expenses: fromGrosze(expenses),
    balance: fromGrosze(income - expenses),
  };
}

export interface BudgetUsage {
  /** Zaokrąglony procent przychodów wydanych w okresie; `null`, gdy przychodów brak. */
  percent: number | null;
  /** Ile zostało (ujemne po przekroczeniu) – to samo co `balance`. */
  remaining: number;
  /** Budżet wyczerpany lub przekroczony (wydatki >= przychody); bez ruchu – `false`. */
  exceeded: boolean;
}

// Wykorzystanie budżetu – wspólne dla `BudgetGauge` (desktop) i paska w Kokpicie.
export function budgetUsage({ income, expenses, balance }: Totals): BudgetUsage {
  const hasActivity = income > 0 || expenses > 0;
  return {
    percent: income > 0 ? Math.round((toGrosze(expenses) / toGrosze(income)) * 100) : null,
    remaining: balance,
    exceeded: hasActivity && toGrosze(expenses) >= toGrosze(income),
  };
}
