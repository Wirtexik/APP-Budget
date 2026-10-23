import { describe, expect, it } from "vitest";
import type { Category, Transaction } from "@/lib/budget";
import {
  EMPTY_FILTERS,
  categoryGroups,
  filterTransactions,
  hasActiveFilters,
  matchesQuery,
  menuFilterCount,
  normalizeText,
  sortTransactions,
  toggleCategory,
  withType,
} from "@/lib/filters";

const categories: Category[] = [
  { id: "fun", name: "Rozrywka", type: "wydatek" },
  { id: "food", name: "Jedzenie", type: "wydatek" },
  { id: "pay", name: "Wynagrodzenie", type: "przychod" },
];
const categoryById = new Map(categories.map((c) => [String(c.id), c]));

const tx = (
  id: string,
  category_id: string | null,
  description: string | null,
  amount = 10,
  recurring_rule_id: string | null = null
): Transaction => ({
  id,
  amount,
  date: "2026-10-01",
  description,
  category_id,
  created_at: "2026-10-01T10:00:00Z",
  recurring_rule_id,
});

// Kolejność jak z bazy: od najnowszych.
const transactions = [
  tx("1", "food", "Biedronka zakupy", 50),
  tx("2", "food", "Żabka", 20),
  tx("3", "fun", "Kino", 30),
  tx("4", "pay", "Pensja październik", 5000, "rule-pay"),
  tx("5", "fun", null, 20, "rule-fun"),
];

const ids = (list: Transaction[]) => list.map((t) => t.id);

describe("normalizeText", () => {
  it("ignoruje wielkość liter i polskie znaki", () => {
    expect(normalizeText("  Żółć Łódź ")).toBe("zolc lodz");
  });
});

describe("matchesQuery", () => {
  it("dopasowuje tylko początek wyrazu", () => {
    expect(matchesQuery("Biedronka zakupy", "b")).toBe(true);
    expect(matchesQuery("Biedronka zakupy", "za")).toBe(true);
    expect(matchesQuery("Biedronka zakupy", "k")).toBe(false);
    expect(matchesQuery("Biedronka zakupy", "ronka")).toBe(false);
  });

  it("każdy szukany wyraz musi pasować do początku któregoś wyrazu", () => {
    expect(matchesQuery("Biedronka zakupy", "zak bie")).toBe(true);
    expect(matchesQuery("Biedronka zakupy", "zak kino")).toBe(false);
  });

  it("dzieli wyrazy także po znakach przestankowych", () => {
    expect(matchesQuery("Prąd/gaz-woda", "woda")).toBe(true);
  });

  it("pusty tekst szukania pasuje do wszystkiego", () => {
    expect(matchesQuery("cokolwiek", "  ")).toBe(true);
  });
});

describe("filterTransactions", () => {
  it("bez filtrów zwraca wszystko w kolejności domyślnej", () => {
    expect(ids(filterTransactions(transactions, categoryById, EMPTY_FILTERS))).toEqual(
      ["1", "2", "3", "4", "5"]
    );
  });

  it("szuka od jednej litery w opisie i nazwie kategorii", () => {
    const result = filterTransactions(transactions, categoryById, {
      ...EMPTY_FILTERS,
      query: "k",
    });
    // „Kino” – opis; „Biedronka zakupy” ma „k” tylko w środku wyrazów.
    expect(ids(result)).toEqual(["3"]);
  });

  it("szuka bez polskich znaków i wielkości liter", () => {
    const result = filterTransactions(transactions, categoryById, {
      ...EMPTY_FILTERS,
      query: "ZAB",
    });
    expect(ids(result)).toEqual(["2"]);
  });

  it("dopasowuje nazwę kategorii, gdy opisu brak", () => {
    const result = filterTransactions(transactions, categoryById, {
      ...EMPTY_FILTERS,
      query: "rozr",
    });
    expect(ids(result)).toEqual(["3", "5"]);
  });

  it("łączy typ, kategorie, wyszukiwanie i sortowanie", () => {
    const result = filterTransactions(transactions, categoryById, {
      type: "wydatek",
      recurring: false,
      categoryIds: ["food", "fun"],
      query: "",
      sort: "amount_asc",
    });
    expect(ids(result)).toEqual(["2", "5", "3", "1"]);
  });

  it("filtruje zlecenia stałe, także razem z typem", () => {
    const only = { ...EMPTY_FILTERS, recurring: true };
    expect(ids(filterTransactions(transactions, categoryById, only))).toEqual([
      "4",
      "5",
    ]);
    expect(
      ids(filterTransactions(transactions, categoryById, { ...only, type: "wydatek" }))
    ).toEqual(["5"]);
  });
});

describe("sortTransactions", () => {
  it("null zostawia kolejność domyślną", () => {
    expect(sortTransactions(transactions, null)).toBe(transactions);
  });

  it("sortuje po dacie rosnąco (odwrócona kolejność z bazy)", () => {
    expect(ids(sortTransactions(transactions, "date_asc"))).toEqual(
      ["5", "4", "3", "2", "1"]
    );
  });

  it("sortuje po kwocie stabilnie i nie zmienia wejścia", () => {
    expect(ids(sortTransactions(transactions, "amount_desc"))).toEqual(
      ["4", "1", "3", "2", "5"]
    );
    expect(ids(sortTransactions(transactions, "amount_asc"))).toEqual(
      ["2", "5", "3", "1", "4"]
    );
    expect(ids(transactions)).toEqual(["1", "2", "3", "4", "5"]);
  });
});

describe("categoryGroups", () => {
  it("grupuje po typie i sortuje po nazwie", () => {
    const groups = categoryGroups(categories, null);
    expect(groups.map((g) => g.type)).toEqual(["wydatek", "przychod"]);
    expect(groups[0].categories.map((c) => c.id)).toEqual(["food", "fun"]);
  });

  it("przy wybranym typie zwraca tylko jego grupę", () => {
    expect(categoryGroups(categories, "przychod").map((g) => g.type)).toEqual([
      "przychod",
    ]);
  });
});

describe("withType / toggleCategory / liczniki", () => {
  it("zmiana typu odznacza kategorie drugiego typu", () => {
    const next = withType(
      { ...EMPTY_FILTERS, categoryIds: ["food", "pay"] },
      "przychod",
      categoryById
    );
    expect(next.categoryIds).toEqual(["pay"]);
    expect(withType(next, null, categoryById).categoryIds).toEqual(["pay"]);
  });

  it("dodaje i usuwa kategorię", () => {
    expect(toggleCategory([], "food")).toEqual(["food"]);
    expect(toggleCategory(["food", "fun"], "food")).toEqual(["fun"]);
  });

  it("liczy filtry z menu i rozpoznaje aktywne filtry", () => {
    expect(menuFilterCount({ ...EMPTY_FILTERS, type: "wydatek", recurring: true, categoryIds: ["food"] })).toBe(3);
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, query: "  " })).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, query: "a" })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, sort: "date_asc" })).toBe(true);
  });
});
