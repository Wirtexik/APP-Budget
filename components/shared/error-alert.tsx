import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Wspólny komunikat błędu wczytywania dla obu wersji: czerwone tło, `role="alert"`
// i opcjonalny przycisk ponowienia. Treść w formie „Nie udało się …: powód”.
export function ErrorAlert({
  children,
  onRetry,
  className,
}: {
  children: ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-red-700 dark:text-destructive",
        className
      )}
    >
      <p className="flex-1">{children}</p>
      {onRetry && (
        <Button variant="destructive" className="min-h-11 shrink-0" onClick={onRetry}>
          <RefreshCw />
          Spróbuj ponownie
        </Button>
      )}
    </div>
  );
}
