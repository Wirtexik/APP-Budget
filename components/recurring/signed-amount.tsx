import { currency, type Category } from "@/lib/budget";
import { cn } from "@/lib/utils";

// Kwota ze znakiem wynikającym z typu kategorii (jak w tabeli transakcji).
export function SignedAmount({
  amount,
  category,
  className,
}: {
  amount: number;
  category: Category | undefined;
  className?: string;
}) {
  const isIncome = category?.type === "przychod";
  const value = currency.format(Number(amount));
  return (
    <span
      className={cn(
        "tabular-nums whitespace-nowrap",
        isIncome && "text-emerald-600",
        className
      )}
    >
      {category ? `${isIncome ? "+" : "−"}${value}` : value}
    </span>
  );
}
