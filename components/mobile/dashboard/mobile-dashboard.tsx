"use client";

import { useMemo } from "react";

import { BalanceCard } from "@/components/mobile/dashboard/balance-card";
import { BudgetBar } from "@/components/mobile/dashboard/budget-bar";
import { IncomeExpenseCards } from "@/components/mobile/dashboard/income-expense-cards";
import { balanceSeries } from "@/lib/balance-series";
import { computeTotals } from "@/lib/budget";
import { useBudgetData } from "@/lib/hooks/budget-data";

// Kokpit mobilny (ekran 1 wg styl-kokpit.jpg): saldo z wykresem, przychody
// i wydatki, pasek budżetu. Bez ostatnich transakcji i zleceń.
export function MobileDashboard() {
  const { period, monthTransactions, categoryById, loading } = useBudgetData();

  const totals = useMemo(
    () => computeTotals(monthTransactions, categoryById),
    [monthTransactions, categoryById]
  );
  const series = useMemo(
    () => balanceSeries(monthTransactions, categoryById, period, new Date()),
    [monthTransactions, categoryById, period]
  );

  return (
    <div className="flex flex-col gap-5 pt-1">
      <BalanceCard balance={totals.balance} series={series} loading={loading} />
      <IncomeExpenseCards income={totals.income} expenses={totals.expenses} loading={loading} />
      {!loading && <BudgetBar totals={totals} />}
    </div>
  );
}
