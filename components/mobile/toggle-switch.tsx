"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// Przełącznik wł./wył. wersji mobilnej (`role="switch"`). Z `children` cały
// wiersz z napisem jest polem dotyku; bez – sam przełącznik z `aria-label`.
export function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
  children,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Nazwa dla czytnika ekranu, gdy nie ma widocznego napisu. */
  label?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex min-h-11 min-w-11 items-center justify-between gap-4 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
        className
      )}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-foreground/15"
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 size-5 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-5"
          )}
        />
      </span>
    </button>
  );
}
