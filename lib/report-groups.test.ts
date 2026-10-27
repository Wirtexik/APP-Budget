import { describe, expect, it } from "vitest";

import type { Category, Transaction } from "@/lib/budget";
import { groupTransactions, share } from "@/lib/report-groups";

const categories: Category[] = [
  { id: "food", name: "Jedzenie", type: "wydatek" },
  { id: "bills", name: "Rachunki", type: "wydatek" },
  { id: "pay", name: "Wynagrodzenie", type: "przychod" },
];
const categoryById = new Map(categories.map((c) => [c.id, c]));

function tx(id: string, amount: number, categoryId: string | null): Transaction {
  return {
    id,
    amount,
    date: "2026-10-24",
    description: null,
    category_id: categoryId,
    created_at: "2026-10-24T10:00:00Z",
    recurring_rule_id: null,
  };
}

describe("groupTransactions", () => {
  it("pusty okres daje zerowe sumy i brak grup", () => {
    expect(groupTransactions([], categoryById)).toEqual({
      wydatek: { total: 0, groups: [] },
      przychod: { total: 0, groups: [] },
    });
  });

  it("rozdziela typy i sortuje kategorie od największej sumy", () => {
    const { wydatek, przychod } = groupTransactions(
      [tx("a", 20, "food"), tx("b", 300, "bills"), tx("c", 8200, "pay"), tx("d", 30, "food")],
      categoryById
    );
    expect(wydatek.groups.map((g) => [g.category.id, g.total])).toEqual([
      ["bills", 300],
      ["food", 50],
    ]);
    expect(wydatek.total).toBe(350);
    expect(przychod.groups.map((g) => g.category.id)).toEqual(["pay"]);
    expect(przychod.total).toBe(8200);
  });

  it("sumuje w groszach", () => {
    const { wydatek } = groupTransactions(
      [tx("a", 0.1, "food"), tx("b", 0.2, "food")],
      categoryById
    );
    expect(wydatek.groups[0].total).toBe(0.3);
    expect(wydatek.total).toBe(0.3);
  });

  it("zachowuje kolejność transakcji w grupie", () => {
    const { wydatek } = groupTransactions(
      [tx("a", 1, "food"), tx("b", 2, "bills"), tx("c", 3, "food")],
      categoryById
    );
    expect(wydatek.groups.find((g) => g.category.id === "food")?.transactions.map((t) => t.id)).toEqual(["a", "c"]);
  });

  it("pomija wpisy bez kategorii albo z nieznaną kategorią", () => {
    const { wydatek, przychod } = groupTransactions(
      [tx("a", 10, null), tx("b", 10, "deleted"), tx("c", 5, "food")],
      categoryById
    );
    expect(wydatek.total).toBe(5);
    expect(przychod.groups).toEqual([]);
  });
});

describe("share", () => {
  it("zaokrągla do pełnych procentów", () => {
    expect(share(1, 3)).toBe(33);
    expect(share(2, 3)).toBe(67);
    expect(share(50, 50)).toBe(100);
  });

  it("zwraca 0 przy zerowej całości", () => {
    expect(share(0, 0)).toBe(0);
  });
});
