"use client";

import { useMemo } from "react";
import { Repeat } from "lucide-react";

import { SignedAmount } from "@/components/shared/signed-amount";
import { formatDate, type Category } from "@/lib/budget";
import {
  addDays,
  todayKey,
  type UpcomingOccurrence,
} from "@/lib/recurring";

const weekday = new Intl.DateTimeFormat("pl-PL", { weekday: "long" });

// „dziś”, „jutro” albo nazwa dnia tygodnia.
function dayLabel(key: string, today: string) {
  if (key === today) return "dziś";
  if (key === addDays(today, 1)) return "jutro";
  const [y, m, d] = key.split("-").map(Number);
  return weekday.format(new Date(y, m - 1, d));
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
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {loading ? "Ładowanie…" : "Brak zaplanowanych wykonań w tym okresie."}
      </p>
    );
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
