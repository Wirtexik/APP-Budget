import {
  DAY_MONTH,
  DAY_MONTH_YEAR,
  WEEKDAY,
  categoryOf,
  dateKey,
  parseDateKey,
  toGrosze,
  type Category,
  type Id,
  type Transaction,
} from "@/lib/budget";

export interface DayGroup {
  /** `RRRR-MM-DD`. */
  date: string;
  /** Suma dnia ze znakiem (przychody − wydatki), w groszach; wpisy bez kategorii pomijane. */
  total: number;
  items: Transaction[];
}

// Wpisy pogrupowane po dniach, w kolejności, w jakiej przyszły (z zapytania:
// data i `created_at` malejąco). Grupa powstaje przy pierwszym wpisie z danego dnia.
export function groupByDay(
  transactions: Transaction[],
  categoryById: Map<Id, Category>
): DayGroup[] {
  const groups: DayGroup[] = [];
  const byDate = new Map<string, DayGroup>();
  for (const t of transactions) {
    const date = t.date.slice(0, 10);
    let group = byDate.get(date);
    if (!group) {
      group = { date, total: 0, items: [] };
      byDate.set(date, group);
      groups.push(group);
    }
    group.items.push(t);
    const type = categoryOf(t, categoryById)?.type;
    if (type === "przychod") group.total += toGrosze(t.amount);
    else if (type === "wydatek") group.total -= toGrosze(t.amount);
  }
  return groups;
}

// Nagłówek dnia na liście: „Dziś, 24 października”, „Wczoraj, 23 października”,
// „Jutro, 25 października” (nadchodzące zlecenia), „środa, 21 października”;
// rok tylko spoza bieżącego roku.
export function dayLabel(date: string, today: Date) {
  const day = parseDateKey(date);
  const shifted = (days: number) =>
    dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days));
  const text = (day.getFullYear() === today.getFullYear() ? DAY_MONTH : DAY_MONTH_YEAR).format(
    day
  );
  if (date.slice(0, 10) === dateKey(today)) return `Dziś, ${text}`;
  if (date.slice(0, 10) === shifted(-1)) return `Wczoraj, ${text}`;
  if (date.slice(0, 10) === shifted(1)) return `Jutro, ${text}`;
  return `${WEEKDAY.format(day)}, ${text}`;
}
