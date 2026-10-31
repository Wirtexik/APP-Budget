"use client";

import { useMemo } from "react";

import { FullScreen } from "@/components/mobile/full-screen";
import { MobileTransactionList } from "@/components/mobile/transactions/mobile-transaction-list";
import {
  computeTotals,
  currency,
  periodLabel,
  type CategoryType,
  type Id,
} from "@/lib/budget";
import { EMPTY_FILTERS, filterTransactions } from "@/lib/filters";
import { useBudgetData } from "@/lib/hooks/budget-data";

const TEXTS: Record<CategoryType, { title: string; empty: string }> = {
  przychod: { title: "Przychody", empty: "Brak przychodów w tym miesiącu." },
  wydatek: { title: "Wydatki", empty: "Brak wydatków w tym miesiącu." },
};

// Przychody albo wydatki oglądanego miesiąca (z kart Kokpitu): suma u góry
// i lista jak w Historii, pogrupowana po dniach. Dane z pobranego miesiąca.
export function TypeListScreen({
  type,
  onEdit,
  onClose,
}: {
  type: CategoryType;
  onEdit: (id: Id) => void;
  onClose: () => void;
}) {
  const { period, monthTransactions, categoryById, loading } = useBudgetData();
  const visible = useMemo(
    () => filterTransactions(monthTransactions, categoryById, { ...EMPTY_FILTERS, type }),
    [monthTransactions, categoryById, type]
  );
  const totals = computeTotals(visible, categoryById);
  const total = type === "przychod" ? totals.income : totals.expenses;
  const { title, empty } = TEXTS[type];

  return (
    <FullScreen title={title} onClose={onClose}>
      <div className="flex flex-1 flex-col gap-5 pt-2">
        <section
          aria-label="Suma"
          className="rounded-3xl bg-card p-5 text-center shadow-(--shadow-soft)"
        >
          <p className="text-sm text-muted-foreground">Suma · {periodLabel(period)}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
            {loading ? "…" : currency.format(total)}
          </p>
        </section>

        {visible.length > 0 ? (
          <MobileTransactionList transactions={visible} onEdit={onEdit} />
        ) : (
          !loading && (
            <p className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
              {empty}
            </p>
          )
        )}
      </div>
    </FullScreen>
  );
}
