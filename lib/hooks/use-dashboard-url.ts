"use client";

// Stan widoku w URL (lib/dashboard-url.ts) jako hook.
//
// Zmiana zakładki dodaje wpis w historii (`pushState`), więc „Wstecz” cofa do
// poprzedniej zakładki. Okres i filtry podmieniają bieżący wpis (`replaceState`),
// żeby przeglądanie miesięcy czy wpisywanie liter nie zaśmiecało historii.
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

function update(patch: Partial<DashboardUrlState>, mode: "push" | "replace") {
  // Bieżący stan bierzemy z URL, nie z renderu – kilka zmian pod rząd
  // (np. szybkie pisanie) nie nadpisze się starszymi wartościami.
  const today = currentPeriod();
  const current = parseDashboardSearch(window.location.search, today);
  const search = dashboardSearch({ ...current, ...patch }, today);
  if (search === window.location.search) return;

  const url = `${window.location.pathname}${search}${window.location.hash}`;
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
  listeners.forEach((listener) => listener());
}

export interface DashboardUrl extends DashboardUrlState {
  setView: (view: View) => void;
  selectPeriod: (period: Period) => void;
  setFilters: (filters: HistoryFilters) => void;
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

  return { ...state, setView, selectPeriod, setFilters };
}
