import { describe, expect, it } from "vitest";
import {
  UI_CHOICES,
  choiceFromOverride,
  overrideFromChoice,
  parseUiVariant,
  resolveUiVariant,
} from "@/lib/ui-variant";

describe("wersja interfejsu", () => {
  it("czyta tylko znane wartości", () => {
    expect(parseUiVariant("mobile")).toBe("mobile");
    expect(parseUiVariant("desktop")).toBe("desktop");
    expect(parseUiVariant("tablet")).toBeNull();
    expect(parseUiVariant(null)).toBeNull();
  });

  it("bez ręcznego wyboru decyduje szerokość ekranu", () => {
    expect(resolveUiVariant(null, true)).toBe("mobile");
    expect(resolveUiVariant(null, false)).toBe("desktop");
  });

  it("ręczny wybór ma pierwszeństwo", () => {
    expect(resolveUiVariant("desktop", true)).toBe("desktop");
    expect(resolveUiVariant("mobile", false)).toBe("mobile");
  });

  it("„Automatycznie” to brak ręcznego wyboru", () => {
    expect(choiceFromOverride(null)).toBe("auto");
    expect(overrideFromChoice("auto")).toBeNull();
  });

  it("każda opcja przełącznika wraca do siebie", () => {
    for (const { value } of UI_CHOICES) {
      expect(choiceFromOverride(overrideFromChoice(value))).toBe(value);
    }
  });
});
