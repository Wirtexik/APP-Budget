import { describe, expect, it } from "vitest";
import { AMOUNT_ERROR } from "@/lib/budget";
import { validateTransactionInput } from "@/lib/transaction-input";

const valid = {
  amount: "12,50",
  date: "2026-10-23",
  categoryValue: "default:wydatek:Jedzenie",
};

describe("validateTransactionInput", () => {
  it("zwraca kwotę jako liczbę", () => {
    expect(validateTransactionInput(valid)).toEqual({
      ok: true,
      value: { ...valid, amount: 12.5 },
    });
  });

  it("odrzuca niepoprawną kwotę", () => {
    expect(validateTransactionInput({ ...valid, amount: "0" })).toEqual({
      ok: false,
      error: AMOUNT_ERROR,
    });
  });

  it("wymaga istniejącej daty", () => {
    for (const date of ["", "2026-02-30", "23.10.2026"]) {
      expect(validateTransactionInput({ ...valid, date })).toEqual({
        ok: false,
        error: "Podaj datę.",
      });
    }
  });

  it("wymaga kategorii", () => {
    expect(validateTransactionInput({ ...valid, categoryValue: null })).toEqual({
      ok: false,
      error: "Wybierz kategorię.",
    });
  });

  it("zgłasza najpierw błąd kwoty", () => {
    expect(
      validateTransactionInput({ amount: "", date: "", categoryValue: null })
    ).toEqual({ ok: false, error: AMOUNT_ERROR });
  });
});
