import { describe, expect, it } from "vitest";
import type { Transaction } from "@/lib/budget";
import { longDate, piggyBankMeta, summarizePiggyBank } from "@/lib/piggy-bank";

const DEPOSIT = "cat-in";
const BREAK = "cat-out";
const TODAY = "2026-10-31";

let seq = 0;
function entry(
  date: string,
  amount: number,
  category: string = DEPOSIT,
  createdAt = `${date}T12:00:00Z`
): Transaction {
  seq += 1;
  return {
    id: `t${String(seq).padStart(3, "0")}`,
    amount,
    date,
    description: null,
    category_id: category,
    created_at: createdAt,
    recurring_rule_id: null,
  };
}

describe("summarizePiggyBank", () => {
  it("pusta skarbonka bez wpisów", () => {
    expect(summarizePiggyBank([], BREAK, TODAY)).toEqual({
      current: { amount: 0, count: 0, since: null },
      history: [],
    });
  });

  it("sumuje wrzucenia w groszach, niezależnie od kolejności wejścia", () => {
    const { current } = summarizePiggyBank(
      [entry("2026-09-10", 0.2), entry("2026-08-04", 0.1), entry("2026-10-01", 100)],
      BREAK,
      TODAY
    );
    expect(current).toEqual({ amount: 100.3, count: 3, since: "2026-08-04" });
  });

  it("rozbicie zamyka skarbonkę; liczą się tylko wrzucenia po nim", () => {
    const { current, history } = summarizePiggyBank(
      [
        entry("2026-05-11", 400),
        entry("2026-06-01", 200),
        entry("2026-08-02", 600, BREAK),
        entry("2026-08-04", 50),
      ],
      BREAK,
      TODAY
    );
    expect(current).toEqual({ amount: 50, count: 1, since: "2026-08-04" });
    expect(history).toEqual([
      expect.objectContaining({ date: "2026-08-02", amount: 600, count: 2, since: "2026-05-11" }),
    ]);
  });

  it("historia od najnowszego rozbicia", () => {
    const { history } = summarizePiggyBank(
      [
        entry("2025-01-03", 10),
        entry("2025-04-30", 10, BREAK),
        entry("2025-05-11", 20),
        entry("2025-08-02", 20, BREAK),
      ],
      BREAK,
      TODAY
    );
    expect(history.map((h) => h.date)).toEqual(["2025-08-02", "2025-04-30"]);
  });

  it("remis dat rozstrzyga created_at", () => {
    const { current } = summarizePiggyBank(
      [
        entry(TODAY, 30, DEPOSIT, "2026-10-31T08:00:00Z"),
        entry(TODAY, 30, BREAK, "2026-10-31T09:00:00Z"),
        entry(TODAY, 5, DEPOSIT, "2026-10-31T10:00:00Z"),
      ],
      BREAK,
      TODAY
    );
    expect(current).toEqual({ amount: 5, count: 1, since: TODAY });
  });

  it("w historii kwota rozbicia, nawet gdy stare wrzucenie potem zmieniono", () => {
    const { current, history } = summarizePiggyBank(
      [entry("2026-03-01", 999), entry("2026-03-15", 100, BREAK)],
      BREAK,
      TODAY
    );
    expect(history[0].amount).toBe(100);
    expect(current.amount).toBe(0);
  });

  it("bez rozbicia (np. po jego usunięciu) obie skarbonki są jedną", () => {
    const { current, history } = summarizePiggyBank(
      [entry("2026-03-01", 100), entry("2026-04-01", 50)],
      BREAK,
      TODAY
    );
    expect(history).toEqual([]);
    expect(current).toEqual({ amount: 150, count: 2, since: "2026-03-01" });
  });

  it("wrzucenia z przyszłą datą czekają na następną skarbonkę", () => {
    const future = entry("2026-11-07", 70);
    const before = summarizePiggyBank([entry("2026-10-01", 30), future], BREAK, TODAY);
    expect(before.current).toEqual({ amount: 30, count: 1, since: "2026-10-01" });

    const after = summarizePiggyBank(
      [entry("2026-10-01", 30), entry(TODAY, 30, BREAK), future],
      BREAK,
      "2026-11-07"
    );
    expect(after.current).toEqual({ amount: 70, count: 1, since: "2026-11-07" });
  });

  it("bez kategorii rozbicia w bazie wszystko to wrzucenia", () => {
    const { current } = summarizePiggyBank([entry("2026-10-01", 30)], null, TODAY);
    expect(current.amount).toBe(30);
  });
});

describe("longDate i piggyBankMeta", () => {
  it("rok tylko spoza bieżącego roku albo na życzenie", () => {
    expect(longDate("2026-08-04", TODAY)).toBe("4 sierpnia");
    expect(longDate("2025-09-04", TODAY)).toBe("4 września 2025");
    expect(longDate("2026-03-15", TODAY, true)).toBe("15 marca 2026");
  });

  it("opis skarbonki z odmianą liczby wrzuceń", () => {
    expect(piggyBankMeta({ amount: 650, count: 3, since: "2026-08-04" }, TODAY)).toBe(
      "od 4 sierpnia · 3 wrzucenia"
    );
    expect(piggyBankMeta({ amount: 5, count: 1, since: TODAY }, TODAY)).toBe(
      "od 31 października · 1 wrzucenie"
    );
    expect(piggyBankMeta({ amount: 0, count: 0, since: null }, TODAY)).toBeNull();
  });
});
