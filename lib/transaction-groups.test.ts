import { describe, expect, it } from "vitest";

import type { Category, Transaction } from "@/lib/budget";
import { dayLabel, groupByDay } from "@/lib/transaction-groups";

const categories: Category[] = [
  { id: "food", name: "Jedzenie", type: "wydatek" },
  { id: "pay", name: "Wynagrodzenie", type: "przychod" },
];
const categoryById = new Map(categories.map((c) => [c.id, c]));

function tx(id: string, date: string, amount: number, categoryId: string | null): Transaction {
  return {
    id,
    amount,
    date,
    description: null,
    category_id: categoryId,
    created_at: `${date}T10:00:00Z`,
    recurring_rule_id: null,
  };
}

describe("groupByDay", () => {
  it("pusta lista daje brak grup", () => {
    expect(groupByDay([], categoryById)).toEqual([]);
  });

  it("grupuje po dniu z zachowaniem kolejności i sumą w groszach", () => {
    const groups = groupByDay(
      [
        tx("a", "2026-10-24", 45.99, "food"),
        tx("b", "2026-10-24", 0.1, "food"),
        tx("c", "2026-10-24", 50, null),
        tx("d", "2026-10-20", 8200, "pay"),
        tx("e", "2026-10-20", 0.2, "food"),
      ],
      categoryById
    );
    expect(groups.map((g) => [g.date, g.total, g.items.map((t) => t.id)])).toEqual([
      ["2026-10-24", -4609, ["a", "b", "c"]],
      ["2026-10-20", 819980, ["d", "e"]],
    ]);
  });
});

describe("dayLabel", () => {
  const today = new Date(2026, 9, 24);

  it("dziś i wczoraj", () => {
    expect(dayLabel("2026-10-24", today)).toBe("Dziś, 24 października");
    expect(dayLabel("2026-10-23", today)).toBe("Wczoraj, 23 października");
  });

  it("jutro, także przez granicę roku", () => {
    expect(dayLabel("2026-10-25", today)).toBe("Jutro, 25 października");
    expect(dayLabel("2027-01-01", new Date(2026, 11, 31))).toBe("Jutro, 1 stycznia 2027");
  });

  it("wczoraj przez granicę miesiąca", () => {
    expect(dayLabel("2026-09-30", new Date(2026, 9, 1))).toBe("Wczoraj, 30 września");
  });

  it("inne dni z nazwą dnia tygodnia, rok spoza bieżącego", () => {
    expect(dayLabel("2026-10-21", today)).toBe("środa, 21 października");
    expect(dayLabel("2025-12-31", today)).toBe("środa, 31 grudnia 2025");
  });
});
