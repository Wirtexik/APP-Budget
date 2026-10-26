import { ArrowDown, ArrowUpRight } from "lucide-react";

import { currency } from "@/lib/budget";

// Karty przychodów (nasycona zieleń z poświatą) i wydatków (szare „szkło”).
export function IncomeExpenseCards({
  income,
  expenses,
  loading,
}: {
  income: number;
  expenses: number;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <section
        aria-label="Przychody"
        className="rounded-3xl bg-income p-4 text-income-foreground shadow-[0_14px_32px_-14px_var(--income)]"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-income-strong text-white">
          <ArrowUpRight className="size-5" />
        </span>
        <p className="mt-4 text-sm font-medium">Przychody</p>
        <p className="text-lg font-bold tabular-nums">
          {loading ? "…" : currency.format(income)}
        </p>
      </section>

      <section
        aria-label="Wydatki"
        className="rounded-3xl border border-glass-border bg-foreground/[0.06] p-4 shadow-(--shadow-soft) backdrop-blur-xl"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-(image:--gradient-primary) text-white">
          <ArrowDown className="size-5" />
        </span>
        <p className="mt-4 text-sm font-medium">Wydatki</p>
        <p className="text-lg font-bold tabular-nums">
          {loading ? "…" : currency.format(expenses)}
        </p>
      </section>
    </div>
  );
}
