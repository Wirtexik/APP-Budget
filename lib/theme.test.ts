import { describe, expect, it } from "vitest";
import { parseThemePreference, resolveTheme, toggleThemePreference } from "@/lib/theme";

describe("motyw", () => {
  it("wszystko poza „light” to „Systemowy”", () => {
    expect(parseThemePreference(null)).toBe("system");
    expect(parseThemePreference("dark")).toBe("system");
    expect(parseThemePreference("light")).toBe("light");
  });

  it("„Systemowy” idzie za systemem, „Jasny” zawsze jasny", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("przełącznik: systemowy ↔ jasny", () => {
    expect(toggleThemePreference("system")).toBe("light");
    expect(toggleThemePreference("light")).toBe("system");
  });
});
