// Stan widoku zapisany w URL (czysta logika, bez przeglądarki): aktywna zakładka,
// oglądany okres i filtry Historii. Dzięki temu odświeżenie strony niczego nie
// zeruje, a link prowadzi do tego samego ekranu.
//
// Przykład: `/?widok=historia&rok=2026&miesiac=9&q=kino&sort=amount_desc`.
// Wartości domyślne (Kokpit, bieżący miesiąc, brak filtrów) nie trafiają do URL.
import { YEAR_ITEMS, samePeriod, type Period } from "@/lib/budget";
import {
  filtersFromParams,
  writeFilterParams,
  type HistoryFilters,
} from "@/lib/filters";

export const VIEWS = ["kokpit", "historia", "zlecenia", "raporty"] as const;
export type View = (typeof VIEWS)[number];
export const DEFAULT_VIEW: View = "kokpit";

export const isView = (value: unknown): value is View =>
  VIEWS.some((view) => view === value);

export interface DashboardUrlState {
  view: View;
  period: Period;
  filters: HistoryFilters;
}

// Rok tylko z zakresu selektora (inaczej pole roku byłoby puste), miesiąc
// w URL liczony od 1. Każda część osobno wraca do bieżącej, gdy jest błędna.
function parsePeriod(params: URLSearchParams, today: Period): Period {
  const rok = params.get("rok");
  const miesiac = params.get("miesiac");
  return {
    year: YEAR_ITEMS.some((item) => item.value === rok) ? Number(rok) : today.year,
    month: miesiac && /^(?:[1-9]|1[0-2])$/.test(miesiac) ? Number(miesiac) - 1 : today.month,
  };
}

export function parseDashboardSearch(search: string, today: Period): DashboardUrlState {
  const params = new URLSearchParams(search);
  const view = params.get("widok");
  return {
    view: isView(view) ? view : DEFAULT_VIEW,
    period: parsePeriod(params, today),
    filters: filtersFromParams(params),
  };
}

/** Część URL od `?` (pusty napis, gdy wszystko domyślne). */
export function dashboardSearch(state: DashboardUrlState, today: Period): string {
  const params = new URLSearchParams();
  if (state.view !== DEFAULT_VIEW) params.set("widok", state.view);
  if (!samePeriod(state.period, today)) {
    params.set("rok", String(state.period.year));
    params.set("miesiac", String(state.period.month + 1));
  }
  writeFilterParams(state.filters, params);
  const search = params.toString();
  return search ? `?${search}` : "";
}
