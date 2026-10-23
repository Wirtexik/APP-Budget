import { describe, expect, it } from "vitest";
import { categoryUsageMessage, sameCategory } from "@/lib/categories";

describe("sameCategory", () => {
  it("porównuje bez wielkości liter i spacji na brzegach, po obu stronach", () => {
    expect(
      sameCategory({ name: " Jedzenie ", type: "wydatek" }, { name: "jedzenie", type: "wydatek" })
    ).toBe(true);
    expect(
      sameCategory({ name: "jedzenie", type: "wydatek" }, { name: " Jedzenie ", type: "wydatek" })
    ).toBe(true);
  });

  it("rozróżnia typ kategorii", () => {
    expect(
      sameCategory({ name: "Inne", type: "wydatek" }, { name: "Inne", type: "przychod" })
    ).toBe(false);
  });
});

describe("categoryUsageMessage", () => {
  it("null, gdy kategoria nie jest używana", () => {
    expect(categoryUsageMessage({ transactions: 0, rules: 0 })).toBeNull();
  });

  it("wymienia tylko to, co blokuje usunięcie", () => {
    expect(categoryUsageMessage({ transactions: 3, rules: 0 })).toBe(
      "Ma przypisane transakcje (3). Najpierw usuń transakcje lub przenieś je do innej kategorii."
    );
  });

  it("łączy transakcje i zlecenia", () => {
    expect(categoryUsageMessage({ transactions: 2, rules: 1 })).toBe(
      "Ma przypisane transakcje (2) i zlecenia stałe (1). Najpierw usuń transakcje lub przenieś je do innej kategorii, a usuń zlecenia lub zmień im kategorię w zakładce „Zlecenia”."
    );
  });
});
