"use client";

import { useMemo, useState } from "react";

import { ReportStructure } from "@/components/mobile/reports/report-structure";
import { Segmented, type SegmentedOption } from "@/components/mobile/segmented";
import { BudgetGauge } from "@/components/shared/budget-gauge";
import { ErrorAlert } from "@/components/shared/error-alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useBudgetData, useYearlyData } from "@/lib/hooks/budget-data";
import { groupTransactions } from "@/lib/report-groups";

type Granularity = "miesiac" | "rok";

const GRANULARITY_OPTIONS: SegmentedOption<Granularity>[] = [
  { value: "miesiac", label: "Miesiąc" },
  { value: "rok", label: "Rok" },
];

// Raporty mobilne (ekran 11): Miesiąc/Rok, oponka budżetu i struktura transakcji.
// Rok bierze z wybranego okresu; dane roku pobierają się w tle, jak na desktopie.
export function MobileReports() {
  const { categoryById, monthTransactions, loading } = useBudgetData();
  const {
    year,
    transactions: yearTransactions,
    loading: yearLoading,
    error: yearError,
  } = useYearlyData();
  const [granularity, setGranularity] = useState<Granularity>("miesiac");

  const isYear = granularity === "rok";
  const transactions = isYear ? yearTransactions : monthTransactions;
  const activeLoading = isYear ? yearLoading : loading;
  const periodNoun = isYear ? "roku" : "miesiącu";

  const grouped = useMemo(
    () => groupTransactions(transactions, categoryById),
    [transactions, categoryById]
  );

  return (
    <div className="flex flex-col gap-5 pt-1">
      <Segmented
        label="Zakres raportu"
        options={GRANULARITY_OPTIONS}
        value={granularity}
        onChange={setGranularity}
        className="mx-auto w-64"
      />

      {isYear && yearError && (
        <ErrorAlert>Nie udało się pobrać danych roku {year}: {yearError}</ErrorAlert>
      )}

      {activeLoading ? (
        <div role="status" className="flex flex-col gap-4 text-muted-foreground">
          <span className="sr-only">Wczytywanie…</span>
          <div className="flex justify-center rounded-3xl border border-glass-border bg-glass px-6 py-8 shadow-(--shadow-soft) backdrop-blur-xl">
            <Skeleton className="size-48 rounded-full" />
          </div>
          <Skeleton className="h-40 rounded-3xl" />
        </div>
      ) : (
        <>
          <section
            aria-label={isYear ? `Budżet roku ${year}` : "Budżet miesiąca"}
            className="flex justify-center rounded-3xl border border-glass-border bg-glass px-6 py-5 shadow-(--shadow-soft) backdrop-blur-xl"
          >
            <BudgetGauge
              transactions={transactions}
              categoryById={categoryById}
              periodNoun={periodNoun}
              className="max-w-none"
            />
          </section>

          <ReportStructure grouped={grouped} periodNoun={periodNoun} />
        </>
      )}
    </div>
  );
}
