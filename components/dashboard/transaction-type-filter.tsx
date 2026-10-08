"use client";

import { CircleArrowDown, CircleArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CategoryType } from "@/lib/budget";

const OPTIONS: {
  value: CategoryType;
  label: string;
  Icon: typeof CircleArrowUp;
  active: string;
}[] = [
  {
    value: "przychod",
    label: "Uznania",
    Icon: CircleArrowUp,
    active:
      "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300",
  },
  {
    value: "wydatek",
    label: "Obciążenia",
    Icon: CircleArrowDown,
    active:
      "border-orange-500/50 bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 dark:text-orange-300",
  },
];

// Dwa przełączniki w stylu wyciągu bankowego. Kliknięcie aktywnego przełącznika
// wyłącza go – `value === null` pokazuje wtedy znów wszystkie transakcje.
export function TransactionTypeFilter({
  value,
  onChange,
}: {
  value: CategoryType | null;
  onChange: (value: CategoryType | null) => void;
}) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <Button
            key={opt.value}
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={active}
            className={active ? opt.active : "text-muted-foreground"}
            onClick={() => onChange(active ? null : opt.value)}
          >
            <opt.Icon />
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
