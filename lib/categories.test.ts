import { describe, expect, it } from "vitest";
import type { Category } from "@/lib/budget";
import {
  buildCategoryOptions,
  categoryUsageMessage,
  existingCategoryValue,
  reservedCategoryMessage,
  sameCategory,
} from "@/lib/categories";

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

describe("existingCategoryValue", () => {
  const own: Category = { id: "c1", name: "Kot", type: "wydatek" };

  it("rozpoznaje kategorię domyślną bez wielkości liter i spacji", () => {
    expect(existingCategoryValue([], { name: " jedzenie ", type: "wydatek" })).toBe(
      "default:wydatek:Jedzenie"
    );
  });

  it("rozpoznaje własną kategorię", () => {
    expect(existingCategoryValue([own], { name: "KOT", type: "wydatek" })).toBe("user:c1");
  });

  it("null dla nowej nazwy albo innego typu", () => {
    expect(existingCategoryValue([own], { name: "Pies", type: "wydatek" })).toBeNull();
    expect(existingCategoryValue([own], { name: "Kot", type: "przychod" })).toBeNull();
  });
});

describe("skarbonka w kategoriach", () => {
  it("„Skarbonka” jest w wydatkach, „Ze skarbonki” nie ma w przychodach", () => {
    const labels = (type: "wydatek" | "przychod") =>
      buildCategoryOptions([], type).defaults.map((o) => o.label);
    expect(labels("wydatek")).toContain("Skarbonka");
    expect(labels("przychod")).not.toContain("Ze skarbonki");
  });

  it("nie da się ręcznie utworzyć ani wybrać przychodu „Ze skarbonki”", () => {
    const target = { name: " ze skarbonki ", type: "przychod" } as const;
    expect(existingCategoryValue([], target)).toBeNull();
    expect(reservedCategoryMessage(target)).not.toBeNull();
    expect(reservedCategoryMessage({ name: "Ze skarbonki", type: "wydatek" })).toBeNull();
  });
});
