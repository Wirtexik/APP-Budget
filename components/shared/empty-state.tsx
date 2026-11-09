import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

// Wspólny pusty stan list: wyśrodkowany tekst, a przy dłuższym komunikacie
// (z `description`) także ikona w kółku i pogrubiony tytuł. `children` to
// opcjonalna akcja, np. „Wyczyść filtry”.
export function EmptyState({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center",
        className
      )}
    >
      {Icon && (
        <span
          aria-hidden
          className="mb-2 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          <Icon className="size-6" />
        </span>
      )}
      <p className={description ? "font-semibold" : "text-sm text-muted-foreground"}>{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
