import {
  categoryOf,
  toGrosze,
  type Category,
  type Id,
  type Period,
  type Transaction,
} from "@/lib/budget";

export interface BalancePoint {
  /** Dzień miesiąca (od 1). */
  day: number;
  /** Saldo narastająco od 1. dnia miesiąca do końca tego dnia, w groszach. */
  balance: number;
}

// Ostatni dzień wykresu: w bieżącym miesiącu dziś, w minionych ostatni dzień
// miesiąca, w przyszłych 0 (brak punktów).
function lastDay({ year, month }: Period, today: Date) {
  const viewed = year * 12 + month;
  const current = today.getFullYear() * 12 + today.getMonth();
  if (viewed > current) return 0;
  if (viewed === current) return today.getDate();
  return new Date(year, month + 1, 0).getDate();
}

// Saldo dzień po dniu dla wykresu w Kokpicie, z pobranych już wpisów miesiąca.
// Typ wpisu wynika z kategorii (jak w `computeTotals`); wpisy bez kategorii, spoza
// okresu i z datą po ostatnim dniu wykresu są pomijane.
export function balanceSeries(
  transactions: Transaction[],
  categoryById: Map<Id, Category>,
  period: Period,
  today: Date
): BalancePoint[] {
  const days = lastDay(period, today);
  if (days === 0) return [];

  const prefix = `${period.year}-${String(period.month + 1).padStart(2, "0")}-`;
  const deltas = new Array<number>(days + 1).fill(0);
  for (const t of transactions) {
    if (!t.date.startsWith(prefix)) continue;
    const day = Number(t.date.slice(8, 10));
    if (day < 1 || day > days) continue;
    const type = categoryOf(t, categoryById)?.type;
    if (type === "przychod") deltas[day] += toGrosze(t.amount);
    else if (type === "wydatek") deltas[day] -= toGrosze(t.amount);
  }

  const points: BalancePoint[] = [];
  let balance = 0;
  for (let day = 1; day <= days; day++) {
    balance += deltas[day];
    points.push({ day, balance });
  }
  return points;
}
