// Stan widoku zapisany w URL (czysta logika, bez przeglądarki): aktywna zakładka,
// oglądany okres i filtry Historii. Dzięki temu odświeżenie strony niczego nie
// zeruje, a link prowadzi do tego samego ekranu.
//
// Przykład: `/?widok=historia&rok=2026&miesiac=9&q=kino&sort=amount_desc`.
// Wartości domyślne (Kokpit, bieżący miesiąc, brak filtrów) nie trafiają do URL.
//
// Tylko wersja mobilna: otwarty formularz (`formularz`) i ekran „Więcej”
// (`ekran=wiecej`). Desktop je ignoruje i czyści.
import { YEAR_ITEMS, samePeriod, type Id, type Period } from "@/lib/budget";
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

/**
 * Formularz na pełnym ekranie; `id: null` = dodawanie.
 * W URL: `nowy`, `<uuid>` (transakcja), `zlecenie`, `zlecenie-<uuid>`.
 */
export interface MobileForm {
  kind: "transaction" | "recurring";
  id: Id | null;
}

export const SCREENS = ["wiecej"] as const;
export type Screen = (typeof SCREENS)[number];

export interface DashboardUrlState {
  view: View;
  period: Period;
  filters: HistoryFilters;
  form: MobileForm | null;
  screen: Screen | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RECURRING_PREFIX = "zlecenie";

export function parseMobileForm(value: string | null): MobileForm | null {
  if (value === null) return null;
  if (value === "nowy") return { kind: "transaction", id: null };
  if (value === RECURRING_PREFIX) return { kind: "recurring", id: null };
  if (UUID.test(value)) return { kind: "transaction", id: value };
  const id = value.slice(RECURRING_PREFIX.length + 1);
  return value.startsWith(`${RECURRING_PREFIX}-`) && UUID.test(id)
    ? { kind: "recurring", id }
    : null;
}

export function mobileFormParam({ kind, id }: MobileForm): string {
  if (kind === "transaction") return id ?? "nowy";
  return id ? `${RECURRING_PREFIX}-${id}` : RECURRING_PREFIX;
}

const parseScreen = (value: string | null): Screen | null =>
  SCREENS.find((screen) => screen === value) ?? null;

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
    form: parseMobileForm(params.get("formularz")),
    screen: parseScreen(params.get("ekran")),
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
  if (state.form) params.set("formularz", mobileFormParam(state.form));
  if (state.screen) params.set("ekran", state.screen);
  const search = params.toString();
  return search ? `?${search}` : "";
}
