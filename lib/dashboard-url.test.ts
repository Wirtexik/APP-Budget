import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS } from "@/lib/filters";
import {
  dashboardSearch,
  mobileFormParam,
  parseDashboardSearch,
  parseMobileForm,
  type DashboardUrlState,
} from "@/lib/dashboard-url";

// Rok z zakresu selektora (5 lat wstecz … następny), zależnego od dzisiejszej daty.
const thisYear = new Date().getFullYear();
const today = { year: thisYear, month: 9 };

const state = (patch: Partial<DashboardUrlState> = {}): DashboardUrlState => ({
  view: "kokpit",
  period: today,
  filters: EMPTY_FILTERS,
  form: null,
  screen: null,
  ...patch,
});

describe("parseDashboardSearch", () => {
  it("pusty URL to Kokpit, bieżący miesiąc i brak filtrów", () => {
    expect(parseDashboardSearch("", today)).toEqual(state());
  });

  it("czyta zakładkę, okres (miesiąc od 1) i filtry", () => {
    expect(
      parseDashboardSearch(`?widok=historia&rok=${thisYear - 1}&miesiac=1&q=kino`, today)
    ).toEqual(
      state({
        view: "historia",
        period: { year: thisYear - 1, month: 0 },
        filters: { ...EMPTY_FILTERS, query: "kino" },
      })
    );
  });

  it("błędne wartości wracają do domyślnych, każda osobno", () => {
    expect(parseDashboardSearch("?widok=ustawienia&rok=1999&miesiac=13", today)).toEqual(state());
    expect(parseDashboardSearch("?miesiac=03", today).period).toEqual(today);
    expect(parseDashboardSearch("?miesiac=3", today).period).toEqual({ year: thisYear, month: 2 });
    expect(parseDashboardSearch(`?rok=${thisYear + 1}`, today).period).toEqual({
      year: thisYear + 1,
      month: 9,
    });
  });
});

describe("dashboardSearch", () => {
  it("wartości domyślne dają pusty napis", () => {
    expect(dashboardSearch(state(), today)).toBe("");
  });

  it("okres inny niż bieżący zapisuje rok i miesiąc", () => {
    expect(
      dashboardSearch(state({ view: "raporty", period: { year: thisYear, month: 0 } }), today)
    ).toBe(`?widok=raporty&rok=${thisYear}&miesiac=1`);
  });

  it("zapis i odczyt dają ten sam stan", () => {
    const s = state({
      view: "zlecenia",
      period: { year: thisYear - 2, month: 11 },
      filters: { ...EMPTY_FILTERS, type: "przychod", sort: "date_asc" },
    });
    expect(parseDashboardSearch(dashboardSearch(s, today), today)).toEqual(s);
  });
});

describe("formularz i ekran (wersja mobilna)", () => {
  const id = "3f2b8c1e-9a4d-4e6f-8b2a-1c5d7e9f0a12";

  it("czyta wszystkie rodzaje formularza", () => {
    expect(parseMobileForm("nowy")).toEqual({ kind: "transaction", id: null });
    expect(parseMobileForm(id)).toEqual({ kind: "transaction", id });
    expect(parseMobileForm("zlecenie")).toEqual({ kind: "recurring", id: null });
    expect(parseMobileForm(`zlecenie-${id}`)).toEqual({ kind: "recurring", id });
  });

  it("błędne wartości to brak formularza", () => {
    for (const value of [null, "", "nowa", "123", "zlecenie-", "zlecenie-123", `x-${id}`, `${id}x`]) {
      expect(parseMobileForm(value)).toBeNull();
    }
  });

  it("zapis formularza odwraca odczyt", () => {
    for (const value of ["nowy", id, "zlecenie", `zlecenie-${id}`]) {
      expect(mobileFormParam(parseMobileForm(value)!)).toBe(value);
    }
  });

  it("czyta ekran „Więcej”, inne wartości to brak", () => {
    expect(parseDashboardSearch("?ekran=wiecej", today).screen).toBe("wiecej");
    expect(parseDashboardSearch("?ekran=ustawienia", today).screen).toBeNull();
  });

  it("zapis i odczyt dają ten sam stan", () => {
    const s = state({ form: { kind: "recurring", id }, screen: "wiecej" });
    expect(dashboardSearch(s, today)).toBe(`?formularz=zlecenie-${id}&ekran=wiecej`);
    expect(parseDashboardSearch(dashboardSearch(s, today), today)).toEqual(s);
  });
});
