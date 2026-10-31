// Skarbonka (czysta logika, baza bez zmian). Wrzucenie to zwykły wydatek
// „Skarbonka”, rozbicie – przychód „Ze skarbonki” na całą zawartość, z datą
// rozbicia. Stan skarbonki to suma wrzuceń zapisanych po ostatnim rozbiciu
// (nie „wrzucenia minus rozbicia”), więc późniejsza edycja starych wrzuceń nie
// psuje bieżącego stanu, a usunięcie wpisu rozbicia samo skleja dwie skarbonki.

import { fromGrosze, plural, toGrosze, type Id, type Transaction } from "@/lib/budget";

export interface PiggyBank {
  amount: number;
  /** Liczba wrzuceń. */
  count: number;
  /** Data pierwszego wrzucenia; null dla pustej skarbonki. */
  since: string | null;
}

export interface BrokenPiggyBank extends PiggyBank {
  /** Id wpisu rozbicia. */
  id: Id;
  /** Data rozbicia. */
  date: string;
}

export interface PiggyBankSummary {
  current: PiggyBank;
  /** Rozbite skarbonki, od najnowszej. */
  history: BrokenPiggyBank[];
}

const day = (t: Transaction) => t.date.slice(0, 10);

// Kolejność zapisu: data, przy remisie `created_at`, na końcu `id` dla stabilności.
function chronological(a: Transaction, b: Transaction) {
  return (
    day(a).localeCompare(day(b)) ||
    a.created_at.localeCompare(b.created_at) ||
    a.id.localeCompare(b.id)
  );
}

// `entries` – wpisy obu kategorii skarbonki; rozbicia to te z `breakCategoryId`,
// reszta to wrzucenia. Wrzucenia z datą po `today` nie wchodzą jeszcze do
// bieżącej skarbonki: rozbicie (z dzisiejszą datą) i tak posortuje je za sobą,
// więc trafią do następnej – bez liczenia ich dwa razy.
export function summarizePiggyBank(
  entries: Transaction[],
  breakCategoryId: Id | null,
  today: string
): PiggyBankSummary {
  const history: BrokenPiggyBank[] = [];
  let deposits: Transaction[] = [];

  for (const entry of [...entries].sort(chronological)) {
    if (entry.category_id !== null && entry.category_id === breakCategoryId) {
      history.push({
        ...summarize(deposits),
        id: entry.id,
        date: day(entry),
        // Kwota rozbicia, czyli tyle, ile faktycznie wróciło do budżetu.
        amount: Number(entry.amount),
      });
      deposits = [];
    } else {
      deposits.push(entry);
    }
  }

  return {
    current: summarize(deposits.filter((t) => day(t) <= today)),
    history: history.reverse(),
  };
}

function summarize(deposits: Transaction[]): PiggyBank {
  return {
    amount: fromGrosze(deposits.reduce((sum, t) => sum + toGrosze(t.amount), 0)),
    count: deposits.length,
    since: deposits.length ? day(deposits[0]) : null,
  };
}

export const pluralDeposits = (n: number) =>
  plural(n, "wrzucenie", "wrzucenia", "wrzuceń");

const dayMonth = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" });
const dayMonthYear = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// „4 sierpnia”, a z rokiem („4 sierpnia 2025”), gdy `withYear` albo data
// jest spoza bieżącego roku.
export function longDate(date: string, today: string, withYear = false) {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  const sameYear = date.slice(0, 4) === today.slice(0, 4);
  return (withYear || !sameYear ? dayMonthYear : dayMonth).format(new Date(y, m - 1, d));
}

// Druga linia skarbonki: „od 4 sierpnia · 3 wrzucenia”; null dla pustej.
export function piggyBankMeta(piggy: PiggyBank, today: string, withYear = false) {
  if (!piggy.since) return null;
  return `od ${longDate(piggy.since, today, withYear)} · ${piggy.count} ${pluralDeposits(piggy.count)}`;
}
