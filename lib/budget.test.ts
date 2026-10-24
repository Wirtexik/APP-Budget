import { describe, expect, it } from "vitest";
import {
  MAX_AMOUNT,
  computeTotals,
  fromGrosze,
  monthRange,
  parseAmount,
  pluralEntries,
  shiftPeriod,
  toGrosze,
  yearRange,
  type Category,
  type Transaction,
} from "@/lib/budget";

const categories: Category[] = [
  { id: "food", name: "Jedzenie", type: "wydatek" },
  { id: "pay", name: "Wynagrodzenie", type: "przychod" },
];
const categoryById = new Map(categories.map((c) => [c.id, c]));

let nextId = 0;
function tx(amount: number, categoryId: string | null): Transaction {
  nextId += 1;
  return {
    id: String(nextId),
    amount,
    date: "2026-10-01",
    description: null,
    category_id: categoryId,
    created_at: "2026-10-01T10:00:00Z",
    recurring_rule_id: null,
  };
}

describe("parseAmount", () => {
  it("przyjmuje przecinek i kropkę", () => {
    expect(parseAmount("12,5")).toBe(12.5);
    expect(parseAmount("12.50")).toBe(12.5);
    expect(parseAmount("7")).toBe(7);
    expect(parseAmount(",5")).toBe(0.5);
  });

  it("pomija spacje, także twarde", () => {
    expect(parseAmount("1 000,50")).toBe(1000.5);
    expect(parseAmount("1 000")).toBe(1000);
    expect(parseAmount(" 25 ")).toBe(25);
  });

  it("odrzuca kwoty niedodatnie i puste", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("0,00")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount(",")).toBeNull();
  });

  it("odrzuca ponad 2 miejsca po przecinku", () => {
    expect(parseAmount("0.001")).toBeNull();
    expect(parseAmount("10,505")).toBeNull();
  });

  it("odrzuca tekst, notację wykładniczą i separatory tysięcy", () => {
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("1e3")).toBeNull();
    expect(parseAmount("1.000,50")).toBeNull();
    expect(parseAmount("1,2,3")).toBeNull();
  });

  it("pilnuje limitu numeric(10,2)", () => {
    expect(parseAmount("99999999,99")).toBe(MAX_AMOUNT);
    expect(parseAmount("100000000")).toBeNull();
  });
});

describe("grosze", () => {
  it("zaokrągla do pełnych groszy", () => {
    expect(toGrosze(0.1)).toBe(10);
    expect(toGrosze("19.99")).toBe(1999);
    expect(toGrosze(1.005)).toBe(100);
    expect(fromGrosze(1999)).toBe(19.99);
  });
});

describe("computeTotals", () => {
  it("sumuje przychody i wydatki wg typu kategorii", () => {
    const totals = computeTotals(
      [tx(100, "pay"), tx(30, "food"), tx(20.5, "food")],
      categoryById
    );
    expect(totals).toEqual({ income: 100, expenses: 50.5, balance: 49.5 });
  });

  it("nie gubi groszy przy liczbach zmiennoprzecinkowych", () => {
    const totals = computeTotals(
      [tx(0.1, "pay"), tx(0.2, "pay"), tx(0.3, "food")],
      categoryById
    );
    expect(totals.income).toBe(0.3);
    expect(totals.balance).toBe(0);
    expect(Object.is(totals.balance, -0)).toBe(false);
  });

  it("pomija transakcje bez znanej kategorii", () => {
    const totals = computeTotals(
      [tx(10, null), tx(5, "missing"), tx(1, "food")],
      categoryById
    );
    expect(totals).toEqual({ income: 0, expenses: 1, balance: -1 });
  });

  it("zwraca zera dla pustej listy", () => {
    expect(computeTotals([], categoryById)).toEqual({
      income: 0,
      expenses: 0,
      balance: 0,
    });
  });
});

describe("zakresy dat", () => {
  it("monthRange: od pierwszego dnia do początku następnego miesiąca", () => {
    expect(monthRange(2026, 9)).toEqual({ start: "2026-10-01", next: "2026-11-01" });
    expect(monthRange(2026, 1)).toEqual({ start: "2026-02-01", next: "2026-03-01" });
  });

  it("monthRange: grudzień przechodzi na styczeń kolejnego roku", () => {
    expect(monthRange(2026, 11)).toEqual({ start: "2026-12-01", next: "2027-01-01" });
  });

  it("monthRange: zmiana czasu nie przesuwa dat", () => {
    // Marzec i październik mają w Polsce zmianę czasu.
    expect(monthRange(2026, 2)).toEqual({ start: "2026-03-01", next: "2026-04-01" });
    expect(monthRange(2026, 9).next).toBe("2026-11-01");
  });

  it("yearRange: cały rok", () => {
    expect(yearRange(2026)).toEqual({ start: "2026-01-01", next: "2027-01-01" });
  });
});

describe("pluralEntries", () => {
  it("odmienia „wpis” po polsku", () => {
    expect(pluralEntries(1)).toBe("wpis");
    expect(pluralEntries(2)).toBe("wpisy");
    expect(pluralEntries(4)).toBe("wpisy");
    expect(pluralEntries(5)).toBe("wpisów");
    expect(pluralEntries(12)).toBe("wpisów");
    expect(pluralEntries(14)).toBe("wpisów");
    expect(pluralEntries(22)).toBe("wpisy");
    expect(pluralEntries(0)).toBe("wpisów");
  });
});

describe("shiftPeriod", () => {
  // Zakres lat selektora zależy od dzisiejszej daty: 5 wstecz … następny.
  const thisYear = new Date().getFullYear();

  it("przesuwa w obrębie roku", () => {
    expect(shiftPeriod({ year: thisYear, month: 5 }, 1)).toEqual({ year: thisYear, month: 6 });
    expect(shiftPeriod({ year: thisYear, month: 5 }, -1)).toEqual({ year: thisYear, month: 4 });
  });

  it("przechodzi przez granicę roku", () => {
    expect(shiftPeriod({ year: thisYear, month: 11 }, 1)).toEqual({ year: thisYear + 1, month: 0 });
    expect(shiftPeriod({ year: thisYear, month: 0 }, -1)).toEqual({ year: thisYear - 1, month: 11 });
  });

  it("poza zakresem lat zwraca null", () => {
    expect(shiftPeriod({ year: thisYear + 1, month: 11 }, 1)).toBeNull();
    expect(shiftPeriod({ year: thisYear - 5, month: 0 }, -1)).toBeNull();
    expect(shiftPeriod({ year: thisYear - 5, month: 0 }, 1)).toEqual({ year: thisYear - 5, month: 1 });
  });
});
