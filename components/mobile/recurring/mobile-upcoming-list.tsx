"use client";

import { Tag } from "lucide-react";

import { SignedAmount } from "@/components/shared/signed-amount";
import type { Category } from "@/lib/budget";
import { categoryStyle } from "@/lib/category-style";
import type { UpcomingOccurrence } from "@/lib/recurring";
import { dayLabel } from "@/lib/transaction-groups";

// „Nadchodzące (30 dni)” pod kartami zleceń: termin, nazwa i kwota. Tylko to,
// co zwraca `upcoming_recurring` (bez wstrzymanych).
export function MobileUpcomingList({
  occurrences,
  categoryById,
}: {
  occurrences: UpcomingOccurrence[];
  categoryById: Map<string, Category>;
}) {
  const today = new Date();

  if (occurrences.length === 0) {
    return (
      <p className="rounded-2xl bg-card px-4 py-6 text-center text-sm text-muted-foreground shadow-(--shadow-soft)">
        Brak zaplanowanych wykonań w tym okresie.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border/60 rounded-2xl bg-card shadow-(--shadow-soft)">
      {occurrences.map((o) => {
        const category = categoryById.get(o.category_id);
        const { icon: Icon, color } = category
          ? categoryStyle(category)
          : { icon: Tag, color: "#94A3B8" };
        return (
          <li key={`${o.rule_id}-${o.occurs_on}`} className="flex items-center gap-3 px-4 py-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${color}26`, color }}
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">
                {o.description || category?.name || "Zlecenie"}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {dayLabel(o.occurs_on, today)}
              </span>
            </span>
            <SignedAmount amount={o.amount} category={category} className="font-bold" />
          </li>
        );
      })}
    </ul>
  );
}
