import { describe, expect, it } from "vitest";
import { Tag } from "lucide-react";

import { CATEGORY_PALETTE, categoryStyle } from "@/lib/category-style";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

describe("categoryStyle", () => {
  it("kategorie domyślne mają własną ikonę i kolor", () => {
    for (const category of DEFAULT_CATEGORIES) {
      const style = categoryStyle(category);
      expect(style.icon).not.toBe(Tag);
      expect(style.color).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it("rozpoznaje kategorię domyślną bez wielkości liter i spacji", () => {
    expect(categoryStyle({ name: "  jedzenie ", type: "wydatek" })).toEqual(
      categoryStyle({ name: "Jedzenie", type: "wydatek" })
    );
  });

  it("nazwa domyślnej przy innym typie to kategoria własna", () => {
    expect(categoryStyle({ name: "Jedzenie", type: "przychod" }).icon).toBe(Tag);
  });

  it("własne dostają ikonę ogólną i kolor z palety", () => {
    for (const name of ["Kot", "Prezenty", "Wakacje 2026", "Ż", ""]) {
      const style = categoryStyle({ name, type: "wydatek" });
      expect(style.icon).toBe(Tag);
      expect(CATEGORY_PALETTE).toContain(style.color);
    }
  });

  it("ta sama nazwa ma zawsze ten sam kolor, bez względu na wielkość liter i spacje", () => {
    const base = categoryStyle({ name: "Wakacje", type: "wydatek" }).color;
    expect(categoryStyle({ name: "wakacje", type: "wydatek" }).color).toBe(base);
    expect(categoryStyle({ name: "  WAKACJE  ", type: "przychod" }).color).toBe(base);
  });

  it("różne nazwy rozkładają się na więcej niż jeden kolor", () => {
    const colors = new Set(
      ["Kot", "Pies", "Wakacje", "Prezenty", "Książki", "Siłownia"].map(
        (name) => categoryStyle({ name, type: "wydatek" }).color
      )
    );
    expect(colors.size).toBeGreaterThan(1);
  });
});
