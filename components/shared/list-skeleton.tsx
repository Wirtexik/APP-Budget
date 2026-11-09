import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Zastępczy kształt listy wpisów w trakcie wczytywania: wiersze z ikoną, dwiema
// liniami tekstu i kwotą. `className` nadaje wygląd kontenera (np. karta w mobile).
export function ListSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div role="status" className={cn("text-muted-foreground", className)}>
      <span className="sr-only">Wczytywanie…</span>
      <ul aria-hidden className="divide-y divide-border/60">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <span className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </span>
            <Skeleton className="h-4 w-16" />
          </li>
        ))}
      </ul>
    </div>
  );
}
