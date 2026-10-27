"use client";

// Stan widoku w URL (lib/dashboard-url.ts) jako hook.
//
// Zmiana zakładki dodaje wpis w historii (`pushState`), więc „Wstecz” cofa do
// poprzedniej zakładki. Okres i filtry podmieniają bieżący wpis (`replaceState`),
// żeby przeglądanie miesięcy czy wpisywanie liter nie zaśmiecało historii.
//
// Nakładki wersji mobilnej (formularz, „Więcej”) też dodają wpis, ze znacznikiem
// w `history.state`. Zamknięcie cofa wtedy historię (`history.back()`), więc
// systemowe „Wstecz” i przycisk zamknięcia działają tak samo. Bez znacznika
// (np. odświeżona strona z `?formularz=nowy`) parametr znika przez `replaceState`.
//
// URL czytamy przez `useSyncExternalStore`, a nie `useSearchParams`: Next
// aktualizuje `useSearchParams` po `pushState` w `startTransition`, więc pole
// wyszukiwania sterowane z URL mogłoby gubić litery przy szybkim pisaniu.
// Przy okazji nie trzeba `<Suspense>`. Dashboard renderuje się dopiero po
// sprawdzeniu sesji w przeglądarce, więc `window` jest zawsze dostępne.

import { useCallback, useMemo, useSyncExternalStore } from "react";

import { currentPeriod, type Period } from "@/lib/budget";
import {
  dashboardSearch,
  parseDashboardSearch,
  type DashboardUrlState,
  type MobileForm,
  type Screen,
  type View,
} from "@/lib/dashboard-url";
import type { HistoryFilters } from "@/lib/filters";

// `pushState` / `replaceState` nie wysyłają zdarzeń, więc subskrybentów
// powiadamiamy sami; „Wstecz” i „Dalej” przychodzą jako `popstate`.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

const getSearch = () => window.location.search;
const getServerSearch = () => "";

const OVERLAY_STATE = { overlay: true } as const;

let closing = false;

const isOverlayEntry = () =>
  (window.history.state as { overlay?: unknown } | null)?.overlay === true;

function update(
  patch: Partial<DashboardUrlState>,
  mode: "push" | "replace" | "overlay"
) {
  // Bieżący stan bierzemy z URL, nie z renderu – kilka zmian pod rząd
  // (np. szybkie pisanie) nie nadpisze się starszymi wartościami.
  const today = currentPeriod();
  const current = parseDashboardSearch(window.location.search, today);
  const search = dashboardSearch({ ...current, ...patch }, today);
  if (search === window.location.search) return;

  const url = `${window.location.pathname}${search}${window.location.hash}`;
  // Przekazujemy tylko własny znacznik: Next sam dokleja swój stan, a gdyby
  // dostał go od nas (`__NA`), pominąłby aktualizację routera.
  if (mode === "replace") {
    window.history.replaceState(isOverlayEntry() ? OVERLAY_STATE : null, "", url);
  } else {
    window.history.pushState(mode === "overlay" ? OVERLAY_STATE : null, "", url);
  }
  listeners.forEach((listener) => listener());
}

export interface DashboardUrl extends DashboardUrlState {
  setView: (view: View) => void;
  selectPeriod: (period: Period) => void;
  setFilters: (filters: HistoryFilters) => void;
  openForm: (form: MobileForm) => void;
  openScreen: (screen: Screen) => void;
  /** Zamyka formularz i ekran „Więcej”. */
  closeOverlay: () => void;
}

export function useDashboardUrl(): DashboardUrl {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  const state = useMemo(() => parseDashboardSearch(search, currentPeriod()), [search]);

  const setView = useCallback((view: View) => update({ view }, "push"), []);
  const selectPeriod = useCallback(
    (period: Period) => update({ period }, "replace"),
    []
  );
  const setFilters = useCallback(
    (filters: HistoryFilters) => update({ filters }, "replace"),
    []
  );

  const openForm = useCallback(
    (form: MobileForm) => update({ form, screen: null }, "overlay"),
    []
  );
  const openScreen = useCallback(
    (screen: Screen) => update({ screen, form: null }, "overlay"),
    []
  );
  const closeOverlay = useCallback(() => {
    // `history.back()` działa asynchronicznie; drugie zamknięcie przed
    // `popstate` (np. wpis zniknął z listy i jednocześnie skończył się zapis)
    // cofnęłoby o jeden wpis za dużo.
    if (closing) return;
    if (isOverlayEntry()) {
      closing = true;
      window.addEventListener("popstate", () => (closing = false), { once: true });
      window.history.back();
    } else {
      update({ form: null, screen: null }, "replace");
    }
  }, []);

  return {
    ...state,
    setView,
    selectPeriod,
    setFilters,
    openForm,
    openScreen,
    closeOverlay,
  };
}
