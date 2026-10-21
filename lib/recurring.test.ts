import { describe, expect, it } from "vitest";
import {
  addDays,
  describeEnd,
  describeFrequency,
  describeSchedule,
  endModeOf,
  inputFromRule,
  presetFor,
  ruleStatus,
  toRulePayload,
  validateRuleInput,
  type RecurringRule,
  type RecurringRuleInput,
} from "@/lib/recurring";

const TODAY = "2026-10-19";

const input = (over: Partial<RecurringRuleInput> = {}): RecurringRuleInput => ({
  amount: 100,
  description: "Czynsz",
  frequency: "monthly",
  intervalCount: 1,
  startDate: TODAY,
  endMode: "never",
  endDate: "",
  maxOccurrences: null,
  ...over,
});

const rule = (over: Partial<RecurringRule> = {}): RecurringRule => ({
  id: "r1",
  category_id: "c1",
  amount: 100,
  description: null,
  frequency: "monthly",
  interval_count: 1,
  start_date: "2026-01-31",
  end_date: null,
  max_occurrences: null,
  is_active: true,
  run_index: 0,
  occurrences_count: 0,
  next_run_date: "2026-11-30",
  created_at: "2026-01-01T00:00:00Z",
  ...over,
});

describe("presetFor", () => {
  it("rozpoznaje presety banków", () => {
    expect(presetFor("weekly", 2)).toBe("biweekly");
    expect(presetFor("monthly", 3)).toBe("quarterly");
    expect(presetFor("yearly", 1)).toBe("yearly");
  });

  it("zwraca null dla harmonogramu spoza presetów", () => {
    expect(presetFor("weekly", 5)).toBeNull();
  });
});

describe("describeFrequency", () => {
  it("używa etykiety presetu", () => {
    expect(describeFrequency("monthly", 3)).toBe("Co kwartał");
  });

  it("odmienia jednostki", () => {
    expect(describeFrequency("weekly", 3)).toBe("Co 3 tygodnie");
    expect(describeFrequency("weekly", 5)).toBe("Co 5 tygodni");
    expect(describeFrequency("monthly", 12)).toBe("Co 12 miesięcy");
    expect(describeFrequency("monthly", 22)).toBe("Co 22 miesiące");
    expect(describeFrequency("yearly", 2)).toBe("Co 2 lata");
    expect(describeFrequency("daily", 2)).toBe("Co 2 dni");
  });
});

describe("validateRuleInput", () => {
  it("przyjmuje poprawne dane", () => {
    expect(validateRuleInput(input(), TODAY)).toBeNull();
  });

  it("odrzuca brak lub zbyt dużą kwotę", () => {
    expect(validateRuleInput(input({ amount: null }), TODAY)).not.toBeNull();
    expect(validateRuleInput(input({ amount: 0 }), TODAY)).not.toBeNull();
    expect(validateRuleInput(input({ amount: 1e11 }), TODAY)).not.toBeNull();
  });

  it("odrzuca odstęp spoza 1–100 i niecałkowity", () => {
    expect(validateRuleInput(input({ intervalCount: 0 }), TODAY)).not.toBeNull();
    expect(validateRuleInput(input({ intervalCount: 101 }), TODAY)).not.toBeNull();
    expect(validateRuleInput(input({ intervalCount: 1.5 }), TODAY)).not.toBeNull();
  });

  it("blokuje datę startu w przeszłości dla nowego zlecenia", () => {
    expect(validateRuleInput(input({ startDate: "2026-10-18" }), TODAY)).toBe(
      "Data startu nie może być w przeszłości."
    );
  });

  it("przy edycji pozwala zostawić dawną datę startu, ale nie zmienić jej na przeszłą", () => {
    const original = { start_date: "2026-01-31", end_date: null };
    expect(
      validateRuleInput(input({ startDate: "2026-01-31" }), TODAY, original)
    ).toBeNull();
    expect(
      validateRuleInput(input({ startDate: "2026-02-01" }), TODAY, original)
    ).not.toBeNull();
  });

  it("sprawdza datę zakończenia", () => {
    expect(
      validateRuleInput(input({ endMode: "date", endDate: "" }), TODAY)
    ).not.toBeNull();
    expect(
      validateRuleInput(
        input({ startDate: "2026-12-01", endMode: "date", endDate: "2026-11-30" }),
        TODAY
      )
    ).not.toBeNull();
    expect(
      validateRuleInput(input({ endMode: "date", endDate: TODAY }), TODAY)
    ).toBeNull();
  });

  it("sprawdza liczbę wykonań tylko w trybie count", () => {
    expect(
      validateRuleInput(input({ endMode: "count", maxOccurrences: 0 }), TODAY)
    ).not.toBeNull();
    expect(
      validateRuleInput(input({ endMode: "count", maxOccurrences: 12 }), TODAY)
    ).toBeNull();
    expect(
      validateRuleInput(input({ endMode: "never", maxOccurrences: 0 }), TODAY)
    ).toBeNull();
  });
});

describe("toRulePayload", () => {
  it("wysyła tylko pole zakończenia z wybranego trybu", () => {
    const payload = toRulePayload(
      input({ endMode: "count", endDate: "2027-01-01", maxOccurrences: 6 })
    );
    expect(payload.end_date).toBeNull();
    expect(payload.max_occurrences).toBe(6);
  });

  it("pusty opis zamienia na null", () => {
    expect(toRulePayload(input({ description: "   " })).description).toBeNull();
  });
});

describe("endModeOf / inputFromRule", () => {
  it("odtwarza tryb zakończenia z wiersza", () => {
    expect(endModeOf(rule())).toBe("never");
    expect(endModeOf(rule({ end_date: "2027-01-01" }))).toBe("date");
    expect(endModeOf(rule({ max_occurrences: 3 }))).toBe("count");
  });

  it("wiersz → formularz → payload nie gubi danych", () => {
    const r = rule({ description: "Netflix", max_occurrences: 12 });
    const payload = toRulePayload(inputFromRule(r));
    expect(payload).toEqual({
      amount: 100,
      description: "Netflix",
      frequency: "monthly",
      interval_count: 1,
      start_date: "2026-01-31",
      end_date: null,
      max_occurrences: 12,
    });
  });
});

describe("ruleStatus", () => {
  it("rozróżnia aktywne, wstrzymane i zakończone", () => {
    expect(ruleStatus(rule())).toBe("active");
    expect(ruleStatus(rule({ is_active: false }))).toBe("paused");
    expect(ruleStatus(rule({ next_run_date: null }))).toBe("finished");
    expect(ruleStatus(rule({ is_active: false, next_run_date: null }))).toBe("finished");
  });
});

describe("describeEnd / describeSchedule", () => {
  it("opisuje zakończenie", () => {
    expect(describeEnd(rule())).toBe("bezterminowo");
    expect(describeEnd(rule({ end_date: "2026-12-31" }))).toBe("do 31.12.2026");
    expect(describeEnd(rule({ max_occurrences: 12, occurrences_count: 5 }))).toBe(
      "12 wykonań (zostało 7)"
    );
    expect(describeEnd(rule({ max_occurrences: 2, occurrences_count: 5 }))).toBe(
      "2 wykonania (zostało 0)"
    );
  });

  it("składa pełny opis", () => {
    expect(describeSchedule(rule({ frequency: "weekly", interval_count: 2 }))).toBe(
      "Co 2 tygodnie od 31.01.2026, bezterminowo"
    );
  });
});

describe("addDays", () => {
  it("przechodzi przez koniec miesiąca, roku i zmianę czasu", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});
