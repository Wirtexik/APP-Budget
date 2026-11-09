"use client";

import { useMemo } from "react";
import { Repeat } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/list-skeleton";
import { SignedAmount } from "@/components/shared/signed-amount";
import { WEEKDAY, formatDate, parseDateKey, type Category } from "@/lib/budget";
import {
  addDays,
  todayKey,
  type UpcomingOccurrence,
} from "@/lib/recurring";

// „dziś”, „jutro” albo nazwa dnia tygodnia.
function dayLabel(key: string, today: string) {
  if (key === today) return "dziś";
  if (key === addDays(today, 1)) return "jutro";
  return WEEKDAY.format(parseDateKey(key));
}

// Nadchodzące wykonania pogrupowane po dniu.
export function UpcomingList({
  occurrences,
  categoryById,
  loading,
}: {
  occurrences: UpcomingOccurrence[];
  categoryById: Map<string, Category>;
  loading: boolean;
}) {
  const groups = useMemo(() => {
    const byDay = new Map<string, UpcomingOccurrence[]>();
    for (const o of occurrences) {
      const day = o.occurs_on.slice(0, 10);
      const list = byDay.get(day);
      if (list) list.push(o);
      else byDay.set(day, [o]);
    }
    return [...byDay.entries()];
  }, [occurrences]);

  if (groups.length === 0) {
    if (loading) return <ListSkeleton rows={3} className="-mx-4" />;
    return <EmptyState className="py-8" title="Brak zaplanowanych wykonań w tym okresie." />;
  }

  const today = todayKey();

  return (
    <ol className="flex flex-col gap-4">
      {groups.map(([day, items]) => (
        <li key={day} className="flex flex-col gap-1.5">
          <h3 className="text-xs font-medium text-muted-foreground">
            {formatDate(day)} · {dayLabel(day, today)}
          </h3>
          <ul className="flex flex-col gap-1.5">
            {items.map((o) => {
              const category = categoryById.get(o.category_id);
              return (
                <li
                  key={`${o.rule_id}-${o.occurs_on}`}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2"
                >
                  <Repeat className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">
                      {o.description || category?.name || "Zlecenie"}
                    </span>
                    {o.description && category && (
                      <span className="text-xs text-muted-foreground">
                        {category.name}
                      </span>
                    )}
                  </div>
                  <SignedAmount amount={o.amount} category={category} />
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
