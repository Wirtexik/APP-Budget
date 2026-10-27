"use client";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T> {
  value: T;
  label: string;
}

// Przełącznik segmentowy wersji mobilnej (Typ i Sortuj w filtrach, Miesiąc/Rok
// w Raportach). `value === null` – żaden segment nie jest aktywny.
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  /** Nazwa grupy dla czytnika ekranu. */
  label: string;
  options: SegmentedOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex rounded-xl bg-muted p-1", className)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-10 flex-1 rounded-lg px-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
            value === option.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
