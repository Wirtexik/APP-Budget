import { ArrowDown, ArrowUpRight, ChevronRight } from "lucide-react";

import { currency, type CategoryType } from "@/lib/budget";

// Karty przychodów (nasycona zieleń z poświatą) i wydatków (szare „szkło”).
// Dotknięcie karty otwiera listę wpisów miesiąca tego typu.
export function IncomeExpenseCards({
  income,
  expenses,
  loading,
  onOpen,
}: {
  income: number;
  expenses: number;
  loading: boolean;
  onOpen: (type: CategoryType) => void;
}) {
  const amount = (value: number) => (loading ? "…" : currency.format(value));

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        aria-label={`Przychody: ${amount(income)}. Pokaż listę`}
        onClick={() => onOpen("przychod")}
        className="rounded-3xl bg-income p-4 text-left text-income-foreground shadow-[0_14px_32px_-14px_var(--income)] outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98]"
      >
        <span className="flex items-center justify-between">
          <span className="flex size-10 items-center justify-center rounded-full bg-income-strong text-white">
            <ArrowUpRight className="size-5" />
          </span>
          <ChevronRight aria-hidden className="size-5 opacity-60" />
        </span>
        <span className="mt-4 block text-sm font-medium">Przychody</span>
        <span className="block text-lg font-bold tabular-nums">{amount(income)}</span>
      </button>

      <button
        type="button"
        aria-label={`Wydatki: ${amount(expenses)}. Pokaż listę`}
        onClick={() => onOpen("wydatek")}
        className="rounded-3xl border border-glass-border bg-foreground/[0.06] p-4 text-left shadow-(--shadow-soft) outline-none backdrop-blur-xl transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98]"
      >
        <span className="flex items-center justify-between">
          <span className="flex size-10 items-center justify-center rounded-full bg-(image:--gradient-primary) text-white">
            <ArrowDown className="size-5" />
          </span>
          <ChevronRight aria-hidden className="size-5 text-muted-foreground" />
        </span>
        <span className="mt-4 block text-sm font-medium">Wydatki</span>
        <span className="block text-lg font-bold tabular-nums">{amount(expenses)}</span>
      </button>
    </div>
  );
}
