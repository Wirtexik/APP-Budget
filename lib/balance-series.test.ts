import { describe, expect, it } from "vitest";

import { balanceSeries } from "@/lib/balance-series";
import type { Category, Transaction } from "@/lib/budget";

const categories: Category[] = [
  { id: "food", name: "Jedzenie", type: "wydatek" },
  { id: "pay", name: "Wynagrodzenie", type: "przychod" },
];
const categoryById = new Map(categories.map((c) => [c.id, c]));

let nextId = 0;
function tx(date: string, amount: number, categoryId: string | null): Transaction {
  nextId += 1;
  return {
    id: String(nextId),
    amount,
    date,
    description: null,
    category_id: categoryId,
    created_at: `${date}T10:00:00Z`,
    recurring_rule_id: null,
  };
}

const october = { year: 2026, month: 9 };
const today = new Date(2026, 9, 24);

describe("balanceSeries", () => {
  it("pusty bieżący miesiąc: zera do dziś", () => {
    const series = balanceSeries([], categoryById, october, today);
    expect(series).toHaveLength(24);
    expect(series[0]).toEqual({ day: 1, balance: 0 });
    expect(series.at(-1)).toEqual({ day: 24, balance: 0 });
  });

  it("przyszły miesiąc nie ma punktów", () => {
    expect(balanceSeries([], categoryById, { year: 2026, month: 10 }, today)).toEqual([]);
    expect(balanceSeries([], categoryById, { year: 2027, month: 0 }, today)).toEqual([]);
  });

  it("miniony miesiąc sięga ostatniego dnia", () => {
    expect(balanceSeries([], categoryById, { year: 2026, month: 8 }, today)).toHaveLength(30);
    expect(balanceSeries([], categoryById, { year: 2024, month: 1 }, today)).toHaveLength(29);
  });

  it("liczy narastająco w groszach, wpisy z jednego dnia w jednym punkcie", () => {
    const series = balanceSeries(
      [
        tx("2026-10-03", 0.1, "food"),
        tx("2026-10-03", 0.2, "food"),
        tx("2026-10-01", 1000, "pay"),
        tx("2026-10-05", 45.99, "food"),
      ],
      categoryById,
      october,
      today
    );
    expect(series[0]).toEqual({ day: 1, balance: 100000 });
    expect(series[1]).toEqual({ day: 2, balance: 100000 });
    expect(series[2]).toEqual({ day: 3, balance: 99970 });
    expect(series[4]).toEqual({ day: 5, balance: 95371 });
    expect(series.at(-1)).toEqual({ day: 24, balance: 95371 });
  });

  it("pomija wpisy bez kategorii, spoza miesiąca i po dziś", () => {
    const series = balanceSeries(
      [
        tx("2026-10-02", 50, null),
        tx("2026-09-30", 50, "pay"),
        tx("2026-10-25", 50, "pay"),
        tx("2026-10-10", 20, "pay"),
      ],
      categoryById,
      october,
      today
    );
    expect(series.at(-1)).toEqual({ day: 24, balance: 2000 });
  });
});
