import { describe, expect, it } from "vitest";
import { errorMessage, thrownMessage } from "@/lib/errors";

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

describe("thrownMessage", () => {
  it("rozpoznaje brak sieci", () => {
    expect(thrownMessage(new TypeError("Failed to fetch"))).toMatch(/Brak połączenia/);
  });

  it("inne wyjątki zamienia na ogólny komunikat", () => {
    expect(thrownMessage(new Error("boom"))).toBe("Coś poszło nie tak – spróbuj ponownie.");
    expect(thrownMessage("x")).toBe("Coś poszło nie tak – spróbuj ponownie.");
  });
});
