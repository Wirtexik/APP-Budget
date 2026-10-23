import { describe, expect, it } from "vitest";
import { parseUiVariant, resolveUiVariant } from "@/lib/ui-variant";

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
});
