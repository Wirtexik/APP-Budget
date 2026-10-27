import { describe, expect, it } from "vitest";

import { sanitizeAmountInput } from "@/lib/amount-input";

describe("sanitizeAmountInput", () => {
  it("zostawia poprawną kwotę bez zmian", () => {
    for (const value of ["", "0", "12", "12,", "12,5", "12,50", "0,99"]) {
      expect(sanitizeAmountInput(value)).toBe(value);
    }
  });

  it("zamienia kropkę na przecinek", () => {
    expect(sanitizeAmountInput("12.5")).toBe("12,5");
  });

  it("odrzuca znaki spoza cyfr i przecinka", () => {
    expect(sanitizeAmountInput("-12 a")).toBe("12");
    expect(sanitizeAmountInput("1 234,567 zł")).toBe("1234,56");
  });

  it("zostawia tylko pierwszy przecinek", () => {
    expect(sanitizeAmountInput("1,2,3")).toBe("1,23");
    expect(sanitizeAmountInput("1.000,50")).toBe("1,00");
  });

  it("najwyżej 2 miejsca po przecinku", () => {
    expect(sanitizeAmountInput("12,345")).toBe("12,34");
  });

  it("najwyżej 8 cyfr przed przecinkiem", () => {
    expect(sanitizeAmountInput("1234567890")).toBe("12345678");
    expect(sanitizeAmountInput("123456789,5")).toBe("12345678,5");
  });

  it("przecinek na początku dostaje zero", () => {
    expect(sanitizeAmountInput(",")).toBe("0,");
    expect(sanitizeAmountInput(".5")).toBe("0,5");
  });

  it("skraca zera wiodące", () => {
    expect(sanitizeAmountInput("007")).toBe("7");
    expect(sanitizeAmountInput("00,5")).toBe("0,5");
    expect(sanitizeAmountInput("00")).toBe("0");
  });
});
