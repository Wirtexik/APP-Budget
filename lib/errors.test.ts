import { describe, expect, it } from "vitest";
import { errorMessage } from "@/lib/errors";

describe("errorMessage", () => {
  it("tłumaczy znane kody", () => {
    expect(errorMessage({ code: "23505", message: "duplicate key" })).toBe(
      "Taki wpis już istnieje."
    );
  });

  it("nadpisania mają pierwszeństwo przed domyślnym komunikatem", () => {
    expect(
      errorMessage({ code: "23514", message: "check" }, { "23514": "Zlecenie." })
    ).toBe("Zlecenie.");
  });

  it("rozpoznaje brak sieci", () => {
    expect(
      errorMessage({ code: "", message: "TypeError: Failed to fetch" })
    ).toMatch(/Brak połączenia/);
  });

  it("nieznany kod zostawia oryginalny komunikat", () => {
    expect(errorMessage({ code: "XX000", message: "internal" })).toBe("internal");
  });
});
