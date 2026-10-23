// Zlecenia stałe – typy i czysta logika (bez Supabase). Zapytania: lib/recurring-queries.ts.
//
// Harmonogram, wykonywanie i liczenie terminów są w bazie (migracja
// supabase/migrations/20261018120000_recurring_rules.sql). Ten plik celowo nie
// powtarza algorytmu dat z SQL – kolejne terminy podaje RPC `upcoming_recurring`.

import { MAX_AMOUNT, dateKey, formatDate, type Id } from "@/lib/budget";

export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurringRule {
  id: Id;
  category_id: Id;
  amount: number;
  description: string | null;
  frequency: Frequency;
  interval_count: number;
  start_date: string;
  end_date: string | null;
  max_occurrences: number | null;
  is_active: boolean;
  /** Kolumny wewnętrzne – ustawia je wyłącznie baza (trigger i materialize_recurring). */
  run_index: number;
  occurrences_count: number;
  /** `null` = zlecenie zakończone (limit wykonań albo minął `end_date`). */
  next_run_date: string | null;
  created_at: string;
}

/** Wiersz zwracany przez RPC `upcoming_recurring(p_until)`. */
export interface UpcomingOccurrence {
  rule_id: Id;
  occurs_on: string;
  amount: number;
  category_id: Id;
  description: string | null;
}

// ---------------------------------------------------------------------------
// Presety harmonogramu (jak w bankach)
// ---------------------------------------------------------------------------

export type SchedulePreset =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export const SCHEDULE_PRESETS: Record<
  SchedulePreset,
  { label: string; frequency: Frequency; intervalCount: number }
> = {
  daily: { label: "Codziennie", frequency: "daily", intervalCount: 1 },
  weekly: { label: "Co tydzień", frequency: "weekly", intervalCount: 1 },
  biweekly: { label: "Co 2 tygodnie", frequency: "weekly", intervalCount: 2 },
  monthly: { label: "Co miesiąc", frequency: "monthly", intervalCount: 1 },
  quarterly: { label: "Co kwartał", frequency: "monthly", intervalCount: 3 },
  yearly: { label: "Co rok", frequency: "yearly", intervalCount: 1 },
};

const PRESET_KEYS = Object.keys(SCHEDULE_PRESETS) as SchedulePreset[];

export const SCHEDULE_ITEMS = PRESET_KEYS.map((value) => ({
  value,
  label: SCHEDULE_PRESETS[value].label,
}));

// Preset odpowiadający harmonogramowi albo null (np. „co 5 tygodni” ustawione ręcznie w bazie).
export function presetFor(
  frequency: Frequency,
  intervalCount: number
): SchedulePreset | null {
  return (
    PRESET_KEYS.find(
      (key) =>
        SCHEDULE_PRESETS[key].frequency === frequency &&
        SCHEDULE_PRESETS[key].intervalCount === intervalCount
    ) ?? null
  );
}

// ---------------------------------------------------------------------------
// Dane z formularza
// ---------------------------------------------------------------------------

export type EndMode = "never" | "date" | "count";

export interface RecurringRuleInput {
  /** Wynik `parseAmount` – null, gdy kwota jest niepoprawna. */
  amount: number | null;
  description: string;
  frequency: Frequency;
  intervalCount: number;
  startDate: string;
  endMode: EndMode;
  /** Brane pod uwagę tylko przy `endMode === "date"`. */
  endDate: string;
  /** Brane pod uwagę tylko przy `endMode === "count"`. */
  maxOccurrences: number | null;
}

/** Kolumny edytowalne przez użytkownika (bez `user_id`, `category_id` i kolumn wewnętrznych). */
export interface RecurringRulePayload {
  amount: number;
  description: string | null;
  frequency: Frequency;
  interval_count: number;
  start_date: string;
  end_date: string | null;
  max_occurrences: number | null;
}

/** Ile dni do przodu pokazuje sekcja „Nadchodzące”. */
export const UPCOMING_DAYS = 30;

export const MAX_INTERVAL = 100;
export const MAX_OCCURRENCES = 10000;
// Kwota: limit `MAX_AMOUNT` z lib/budget.ts. Kolumna `recurring_rules.amount`
// ma numeric(12, 2), ale wykonanie trafia do `transactions.amount numeric(10,2)`,
// więc obowiązuje węższy limit transakcji.

export function endModeOf(
  rule: Pick<RecurringRule, "end_date" | "max_occurrences">
): EndMode {
  if (rule.max_occurrences !== null) return "count";
  if (rule.end_date !== null) return "date";
  return "never";
}

// Stan początkowy formularza edycji.
export function inputFromRule(rule: RecurringRule): RecurringRuleInput {
  return {
    amount: Number(rule.amount),
    description: rule.description ?? "",
    frequency: rule.frequency,
    intervalCount: rule.interval_count,
    startDate: rule.start_date,
    endMode: endModeOf(rule),
    endDate: rule.end_date ?? "",
    maxOccurrences: rule.max_occurrences,
  };
}

const isDateKey = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

// Polski komunikat błędu albo null. Sprawdza to samo co CHECK-i w bazie, a do tego
// blokuje datę startu w przeszłości (baza by ją przyjęła i nadrobiła zaległe terminy).
// Przy edycji (`original`) niezmieniona data startu może być w przeszłości – zlecenie
// po prostu już działa.
export function validateRuleInput(
  input: RecurringRuleInput,
  today: string,
  original?: Pick<RecurringRule, "start_date" | "end_date">
): string | null {
  if (input.amount === null || !(input.amount > 0)) return "Podaj poprawną kwotę.";
  if (input.amount > MAX_AMOUNT) return "Kwota jest za duża.";

  if (
    !Number.isInteger(input.intervalCount) ||
    input.intervalCount < 1 ||
    input.intervalCount > MAX_INTERVAL
  ) {
    return `Odstęp musi być liczbą od 1 do ${MAX_INTERVAL}.`;
  }

  if (!isDateKey(input.startDate)) return "Podaj datę startu.";
  const startChanged = original?.start_date !== input.startDate;
  if (startChanged && input.startDate < today) {
    return "Data startu nie może być w przeszłości.";
  }

  if (input.endMode === "date") {
    if (!isDateKey(input.endDate)) return "Podaj datę zakończenia.";
    if (input.endDate < input.startDate) {
      return "Data zakończenia nie może być wcześniejsza niż data startu.";
    }
    const endChanged = original?.end_date !== input.endDate;
    if (endChanged && input.endDate < today) {
      return "Data zakończenia nie może być w przeszłości.";
    }
  }

  if (input.endMode === "count") {
    const n = input.maxOccurrences;
    if (n === null || !Number.isInteger(n) || n < 1 || n > MAX_OCCURRENCES) {
      return `Liczba wykonań musi być liczbą od 1 do ${MAX_OCCURRENCES}.`;
    }
  }

  return null;
}

// Zamienia poprawne dane formularza na kolumny tabeli. Zawsze wysyła oba pola
// zakończenia – nieużywane jako null, żeby edycja czyściła poprzedni tryb.
// Wywołuj po `validateRuleInput`.
export function toRulePayload(input: RecurringRuleInput): RecurringRulePayload {
  if (input.amount === null) throw new Error("Brak kwoty – najpierw validateRuleInput.");
  return {
    amount: input.amount,
    description: input.description.trim() || null,
    frequency: input.frequency,
    interval_count: input.intervalCount,
    start_date: input.startDate,
    end_date: input.endMode === "date" ? input.endDate : null,
    max_occurrences: input.endMode === "count" ? input.maxOccurrences : null,
  };
}

// ---------------------------------------------------------------------------
// Stan i opisy do wyświetlenia
// ---------------------------------------------------------------------------

export type RuleStatus = "active" | "paused" | "finished";

export const STATUS_LABEL: Record<RuleStatus, string> = {
  active: "Aktywne",
  paused: "Wstrzymane",
  finished: "Zakończone",
};

// Zakończone ma pierwszeństwo: wstrzymane zlecenie bez kolejnego terminu też się skończyło.
export function ruleStatus(
  rule: Pick<RecurringRule, "is_active" | "next_run_date">
): RuleStatus {
  if (rule.next_run_date === null) return "finished";
  return rule.is_active ? "active" : "paused";
}

function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  const last = n % 10;
  const lastTwo = n % 100;
  return last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14) ? few : many;
}

const UNIT: Record<Frequency, [string, string, string]> = {
  daily: ["dzień", "dni", "dni"],
  weekly: ["tydzień", "tygodnie", "tygodni"],
  monthly: ["miesiąc", "miesiące", "miesięcy"],
  yearly: ["rok", "lata", "lat"],
};

// „Co miesiąc”, „Co 2 tygodnie”, „Co 5 tygodni”…
export function describeFrequency(frequency: Frequency, intervalCount: number) {
  const preset = presetFor(frequency, intervalCount);
  if (preset) return SCHEDULE_PRESETS[preset].label;
  const [one, few, many] = UNIT[frequency];
  return `Co ${intervalCount} ${plural(intervalCount, one, few, many)}`;
}

export function pluralOccurrences(n: number) {
  return plural(n, "wykonanie", "wykonania", "wykonań");
}

// „bezterminowo”, „do 31.12.2026”, „12 wykonań (zostało 7)”.
export function describeEnd(
  rule: Pick<RecurringRule, "end_date" | "max_occurrences" | "occurrences_count">
) {
  if (rule.max_occurrences !== null) {
    const left = Math.max(rule.max_occurrences - rule.occurrences_count, 0);
    return `${rule.max_occurrences} ${pluralOccurrences(rule.max_occurrences)} (zostało ${left})`;
  }
  if (rule.end_date !== null) return `do ${formatDate(rule.end_date)}`;
  return "bezterminowo";
}

// „Co 2 tygodnie od 05.11.2026, bezterminowo”.
export function describeSchedule(rule: RecurringRule) {
  return `${describeFrequency(rule.frequency, rule.interval_count)} od ${formatDate(
    rule.start_date
  )}, ${describeEnd(rule)}`;
}

// ---------------------------------------------------------------------------
// Daty
// ---------------------------------------------------------------------------

// Dzisiejsza data w strefie przeglądarki (baza liczy „dziś” w Europe/Warsaw).
export function todayKey() {
  return dateKey(new Date());
}

// Przesuwa datę YYYY-MM-DD o `days` dni (kalendarzowo, bez wpływu zmiany czasu).
export function addDays(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d + days));
}
