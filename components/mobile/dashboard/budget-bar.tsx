import { budgetUsage, currency, type Totals } from "@/lib/budget";
import { cn } from "@/lib/utils";

// Pasek wykorzystania budżetu bezpośrednio na tle (bez karty). Zasady procentu
// i przekroczenia z `budgetUsage`, tak jak w `BudgetGauge` na desktopie.
export function BudgetBar({ totals }: { totals: Totals }) {
  const { percent, remaining, exceeded } = budgetUsage(totals);
  const empty = totals.income === 0 && totals.expenses === 0;
  const width = exceeded ? 100 : (percent ?? 0);

  let text;
  if (empty) {
    text = <>Brak transakcji w tym miesiącu</>;
  } else if (percent === null) {
    text = <>Brak przychodów · wydano {currency.format(totals.expenses)}</>;
  } else {
    text = (
      <>
        Wykorzystano <strong className="font-bold">{percent}%</strong> ·{" "}
        {remaining < 0
          ? `przekroczono o ${currency.format(-remaining)}`
          : `zostało ${currency.format(remaining)}`}
      </>
    );
  }

  return (
    <section aria-label="Budżet miesiąca" className="flex flex-col gap-2.5 px-1">
      <p className={cn("text-sm", exceeded ? "text-destructive" : "text-foreground/80")}>
        {text}
      </p>
      <div
        role="meter"
        aria-label="Wykorzystanie budżetu"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(width, 100)}
        className="h-3 overflow-hidden rounded-full bg-foreground/10"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            exceeded ? "bg-destructive" : "bg-(image:--gradient-primary)"
          )}
          style={{ width: `${Math.min(width, 100)}%` }}
        />
      </div>
    </section>
  );
}
