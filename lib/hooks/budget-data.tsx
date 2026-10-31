"use client";

// Warstwa danych aplikacji: jedno źródło danych dla wersji desktopowej i mobilnej.
// Provider trzyma oglądany okres, kategorie, transakcje miesiąca, zlecenia stałe,
// dane roku i skarbonkę; komponenty czytają je przez `useBudgetData`,
// `useRecurringData`, `useYearlyData` i `usePiggyBankData`, a zapisy idą przez
// lib/queries.ts i lib/recurring-queries.ts.
//
// Zlecenia, rok i skarbonka pobierają się leniwie – dopiero gdy pierwszy komponent wywoła
// swój hook – a potem zostają w providerze, więc powrót na zakładkę nie pobiera
// ich od nowa.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import {
  formatDate,
  monthRange,
  periodLabel,
  pluralEntries,
  samePeriod,
  type Category,
  type Id,
  type Period,
  type Transaction,
} from "@/lib/budget";
import { PIGGY_BREAK, PIGGY_DEPOSIT, sameCategory } from "@/lib/categories";
import { summarizePiggyBank, type PiggyBankSummary } from "@/lib/piggy-bank";
import {
  fetchDashboardData,
  fetchPiggyBankEntries,
  fetchYearlyTransactions,
} from "@/lib/queries";
import {
  UPCOMING_DAYS,
  addDays,
  todayKey,
  type RecurringRule,
  type UpcomingOccurrence,
} from "@/lib/recurring";
import {
  fetchRecurringRules,
  fetchUpcoming,
  materializeRecurring,
  type MaterializeResult,
} from "@/lib/recurring-queries";

export interface BudgetData {
  userId: string;
  period: Period;
  selectPeriod: (period: Period) => void;
  /** Np. „październik 2026”. */
  monthLabel: string;
  categories: Category[];
  categoryById: Map<Id, Category>;
  monthTransactions: Transaction[];
  loading: boolean;
  loadError: string | null;
  /** Ponownie pobiera kategorie i miesiąc (oraz rok, jeśli był już pobrany). */
  refresh: () => Promise<void>;
  /** `refresh` po zapisie transakcji; `date` – data zapisanego wpisu. */
  afterSave: (date?: string) => Promise<void>;
}

export interface RecurringData {
  rules: RecurringRule[];
  upcoming: UpcomingOccurrence[];
  loading: boolean;
  error: string | null;
  /** Po zmianie zlecenia: tworzy należne transakcje i odświeża zlecenia i miesiąc. */
  afterChange: () => Promise<void>;
}

export interface YearlyData {
  year: number;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

export interface PiggyBankData extends PiggyBankSummary {
  loading: boolean;
  error: string | null;
}

interface RecurringState {
  rules: RecurringRule[];
  upcoming: UpcomingOccurrence[];
  loading: boolean;
  error: string | null;
}

interface YearlyState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

interface PiggyBankState {
  entries: Transaction[];
  loading: boolean;
  error: string | null;
}

interface ContextValue {
  budget: BudgetData;
  recurring: RecurringData;
  yearly: YearlyData;
  piggy: PiggyBankState & { breakCategoryId: Id | null };
  requestRecurring: () => void;
  requestYearly: () => void;
  requestPiggy: () => void;
}

const BudgetDataContext = createContext<ContextValue | null>(null);

function useBudgetContext() {
  const value = useContext(BudgetDataContext);
  if (!value) {
    throw new Error("Hooki danych budżetu działają tylko wewnątrz <BudgetDataProvider>.");
  }
  return value;
}

export function useBudgetData(): BudgetData {
  return useBudgetContext().budget;
}

export function useRecurringData(): RecurringData {
  const { recurring, requestRecurring } = useBudgetContext();
  useEffect(requestRecurring, [requestRecurring]);
  return recurring;
}

export function useYearlyData(): YearlyData {
  const { yearly, requestYearly } = useBudgetContext();
  useEffect(requestYearly, [requestYearly]);
  return yearly;
}

export function usePiggyBankData(): PiggyBankData {
  const { piggy, requestPiggy } = useBudgetContext();
  useEffect(requestPiggy, [requestPiggy]);
  const { entries, breakCategoryId, loading, error } = piggy;
  const summary = useMemo(
    () => summarizePiggyBank(entries, breakCategoryId, todayKey()),
    [entries, breakCategoryId]
  );
  return { ...summary, loading, error };
}

function reportMaterialized({ error, created }: MaterializeResult) {
  if (error) {
    toast.error("Nie udało się wykonać zleceń stałych", { description: error });
  } else if (created > 0) {
    toast.success(`Dodano ${created} ${pluralEntries(created)} ze zleceń stałych`);
  }
}

async function fetchRecurringState(userId: string): Promise<RecurringState> {
  const [rules, upcoming] = await Promise.all([
    fetchRecurringRules(userId),
    fetchUpcoming(addDays(todayKey(), UPCOMING_DAYS)),
  ]);
  return {
    rules: rules.rules,
    upcoming: upcoming.occurrences,
    loading: false,
    error: rules.error ?? upcoming.error,
  };
}

const INITIAL_RECURRING: RecurringState = {
  rules: [],
  upcoming: [],
  loading: true,
  error: null,
};

const INITIAL_YEARLY: YearlyState = { transactions: [], loading: true, error: null };

const INITIAL_PIGGY: PiggyBankState = { entries: [], loading: true, error: null };

// Globalny filtr czasu (`period`) przychodzi z zewnątrz – w aplikacji z URL
// (lib/hooks/use-dashboard-url.ts) – a `onPeriodChange` go zmienia.
export function BudgetDataProvider({
  userId,
  period,
  onPeriodChange,
  children,
}: {
  userId: string;
  period: Period;
  onPeriodChange: (period: Period) => void;
  children: ReactNode;
}) {
  const { year, month } = period;

  const [categories, setCategories] = useState<Category[]>([]);
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Zlecenia, rok i skarbonka: `…Wanted` włącza się przy pierwszym użyciu hooka.
  const [recurringWanted, setRecurringWanted] = useState(false);
  const [recurringState, setRecurringState] = useState(INITIAL_RECURRING);
  const [yearlyWanted, setYearlyWanted] = useState(false);
  const [yearlyState, setYearlyState] = useState(INITIAL_YEARLY);
  const [piggyWanted, setPiggyWanted] = useState(false);
  const [piggyState, setPiggyState] = useState(INITIAL_PIGGY);

  // Nowy okres (z selektora albo z „Wstecz”) czyści stare dane od razu, inaczej
  // przez chwilę widać by było liczby z poprzedniego miesiąca (lub roku) pod
  // nową etykietą. Stan poprawiamy w trakcie renderu, nie w efekcie, żeby nie
  // było ani jednej klatki ze starymi danymi.
  const [shownPeriod, setShownPeriod] = useState(period);
  if (!samePeriod(shownPeriod, period)) {
    setShownPeriod(period);
    setLoading(true);
    setMonthTransactions([]);
    if (shownPeriod.year !== year) setYearlyState(INITIAL_YEARLY);
  }

  // Numery ostatnich żądań: spóźniona odpowiedź (dla poprzedniego okresu albo
  // sprzed zapisu) nie nadpisze nowszych danych.
  const monthSeq = useRef(0);
  const recurringSeq = useRef(0);
  const yearSeq = useRef(0);
  const piggySeq = useRef(0);

  // Zaległe wykonania zleceń stałych tworzymy raz, przy otwarciu aplikacji –
  // przed pierwszym pobraniem danych, żeby nowe wpisy od razu były widoczne.
  const materialized = useRef<Promise<void> | null>(null);
  const whenMaterialized = useCallback(() => {
    materialized.current ??= materializeRecurring().then(reportMaterialized);
    return materialized.current;
  }, []);

  // Łańcuch `.then` zamiast `await`: stan zmienia się dopiero po odpowiedzi,
  // co reguła react-hooks/set-state-in-effect rozpoznaje tylko w tej postaci.
  const loadMonth = useCallback(() => {
    const id = ++monthSeq.current;
    return whenMaterialized()
      .then(() => fetchDashboardData(userId, year, month))
      .then((data) => {
        if (id !== monthSeq.current) return;
        if (data.error) {
          setLoadError(data.error);
        } else {
          setLoadError(null);
          setCategories(data.categories);
          setMonthTransactions(data.monthTransactions);
        }
        setLoading(false);
      });
  }, [userId, year, month, whenMaterialized]);

  const loadYear = useCallback(() => {
    const id = ++yearSeq.current;
    return whenMaterialized()
      .then(() => fetchYearlyTransactions(userId, year))
      .then((data) => {
        if (id !== yearSeq.current) return;
        setYearlyState({
          transactions: data.transactions,
          loading: false,
          error: data.error,
        });
      });
  }, [userId, year, whenMaterialized]);

  // Skarbonka czyta wpisy swoich dwóch kategorii; dopóki żadnej nie ma w bazie
  // (powstają przy pierwszym użyciu), nie ma czego pobierać.
  const piggyDepositId = categories.find((c) => sameCategory(c, PIGGY_DEPOSIT))?.id ?? null;
  const piggyBreakId = categories.find((c) => sameCategory(c, PIGGY_BREAK))?.id ?? null;
  const hasPiggyCategories = piggyDepositId !== null || piggyBreakId !== null;

  const loadPiggy = useCallback(() => {
    const ids = [piggyDepositId, piggyBreakId].filter((id): id is Id => id !== null);
    if (!ids.length) return Promise.resolve();
    const id = ++piggySeq.current;
    return whenMaterialized()
      .then(() => fetchPiggyBankEntries(userId, ids))
      .then((data) => {
        if (id !== piggySeq.current) return;
        // Przy błędzie zostają poprzednie dane, jak w danych miesiąca.
        setPiggyState((prev) =>
          data.error
            ? { ...prev, loading: false, error: data.error }
            : { entries: data.transactions, loading: false, error: null }
        );
      });
  }, [userId, piggyDepositId, piggyBreakId, whenMaterialized]);

  const loadRecurring = useCallback(() => {
    const id = ++recurringSeq.current;
    return whenMaterialized()
      .then(() => fetchRecurringState(userId))
      .then((data) => {
        if (id !== recurringSeq.current) return;
        // Przy błędzie zostają poprzednie dane, jak w danych miesiąca.
        setRecurringState((prev) =>
          data.error ? { ...prev, loading: false, error: data.error } : data
        );
      });
  }, [userId, whenMaterialized]);

  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  useEffect(() => {
    if (yearlyWanted) void loadYear();
  }, [yearlyWanted, loadYear]);

  useEffect(() => {
    if (recurringWanted) void loadRecurring();
  }, [recurringWanted, loadRecurring]);

  // Także po zmianie id kategorii skarbonki (np. pierwsze rozbicie ją tworzy).
  useEffect(() => {
    if (piggyWanted) void loadPiggy();
  }, [piggyWanted, loadPiggy]);

  // Odświeża karty, tabele i raporty po każdej zmianie danych.
  const refresh = useCallback(async () => {
    await Promise.all([
      loadMonth(),
      yearlyWanted ? loadYear() : undefined,
      piggyWanted ? loadPiggy() : undefined,
    ]);
  }, [loadMonth, loadYear, yearlyWanted, loadPiggy, piggyWanted]);

  // Po zapisie: odśwież widok. Filtr miesiąca służy wyłącznie do wyświetlania –
  // zapis z dowolną datą jest zawsze dozwolony, a filtr zostaje bez zmian. Gdy
  // wpis wypada poza oglądany miesiąc, potwierdzamy zapis i wyjaśniamy, czemu
  // nie widać go na liście.
  const afterSave = useCallback(
    async (date?: string) => {
      await refresh();
      if (!date) return;
      const day = date.slice(0, 10);
      const { start, next } = monthRange(year, month);
      if (day < start || day >= next) {
        toast.success(`Zapisano wpis z datą ${formatDate(day)}`, {
          description: "Nie ma go na liście, bo przeglądasz inny miesiąc.",
          duration: 6000,
        });
      }
    },
    [refresh, year, month]
  );

  // Po zmianie zlecenia: utwórz należne transakcje (np. zlecenie startujące dziś),
  // a potem odśwież zlecenia i dane miesiąca.
  const afterChange = useCallback(async () => {
    reportMaterialized(await materializeRecurring());
    await Promise.all([loadRecurring(), refresh()]);
  }, [loadRecurring, refresh]);

  const requestRecurring = useCallback(() => setRecurringWanted(true), []);
  const requestYearly = useCallback(() => setYearlyWanted(true), []);
  const requestPiggy = useCallback(() => setPiggyWanted(true), []);

  // Bez kategorii skarbonki w bazie skarbonka jest pusta; do pierwszego
  // pobrania kategorii nie wiadomo jednak, czy istnieją – wtedy „ładowanie”.
  const piggy = useMemo(
    () =>
      hasPiggyCategories
        ? { ...piggyState, breakCategoryId: piggyBreakId }
        : { entries: [], loading, error: null, breakCategoryId: null },
    [hasPiggyCategories, piggyState, piggyBreakId, loading]
  );

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const value = useMemo<ContextValue>(
    () => ({
      budget: {
        userId,
        period,
        selectPeriod: onPeriodChange,
        monthLabel: periodLabel(period),
        categories,
        categoryById,
        monthTransactions,
        loading,
        loadError,
        refresh,
        afterSave,
      },
      recurring: { ...recurringState, afterChange },
      yearly: { year, ...yearlyState },
      piggy,
      requestRecurring,
      requestYearly,
      requestPiggy,
    }),
    [
      userId,
      period,
      onPeriodChange,
      categories,
      categoryById,
      monthTransactions,
      loading,
      loadError,
      refresh,
      afterSave,
      recurringState,
      afterChange,
      year,
      yearlyState,
      piggy,
      requestRecurring,
      requestYearly,
      requestPiggy,
    ]
  );

  return (
    <BudgetDataContext.Provider value={value}>{children}</BudgetDataContext.Provider>
  );
}
