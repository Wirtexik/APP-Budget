import { describe, expect, it } from "vitest";
import { parseThemePreference, resolveTheme, toggleThemePreference } from "@/lib/theme";

describe("motyw", () => {
  it("„light” i „dark” zapisane, wszystko inne to „Systemowy”", () => {
    expect(parseThemePreference(null)).toBe("system");
    expect(parseThemePreference("cokolwiek")).toBe("system");
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
  });

  it("„Systemowy” idzie za systemem, „Jasny” i „Ciemny” są wymuszone", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("przełącznik: systemowy → jasny → ciemny → systemowy", () => {
    expect(toggleThemePreference("system")).toBe("light");
    expect(toggleThemePreference("light")).toBe("dark");
    expect(toggleThemePreference("dark")).toBe("system");
  });
});
