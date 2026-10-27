"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { RecurringActionsDrawer } from "@/components/mobile/recurring/recurring-actions-drawer";
import { RecurringCard } from "@/components/mobile/recurring/recurring-card";
import { MobileUpcomingList } from "@/components/mobile/recurring/mobile-upcoming-list";
import { Button } from "@/components/ui/button";
import type { Id } from "@/lib/budget";
import { useBudgetData, useRecurringData } from "@/lib/hooks/budget-data";
import { useToggleRecurring } from "@/lib/hooks/use-recurring-actions";
import { UPCOMING_DAYS, type RecurringRule } from "@/lib/recurring";

const SECTION_TITLE = "mb-3 px-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase";

// Widok „Zlecenia” (ekran 9 makiety): „Dodaj zlecenie”, karty zleceń
// i nadchodzące wykonania. Formularz otwiera się przez URL (`onOpenForm`).
export function MobileRecurring({ onOpenForm }: { onOpenForm: (id: Id | null) => void }) {
  const { categoryById } = useBudgetData();
  const { rules, upcoming, loading, error } = useRecurringData();
  const { busyId, toggleActive } = useToggleRecurring();
  const [actionsFor, setActionsFor] = useState<RecurringRule | null>(null);

  return (
    <div className="flex flex-col gap-6 pt-1">
      <Button
        variant="secondary"
        onClick={() => onOpenForm(null)}
        className="h-12 rounded-2xl bg-accent text-base font-semibold text-accent-foreground"
      >
        <Plus />
        Dodaj zlecenie
      </Button>

      {error && (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Nie udało się pobrać zleceń: {error}
        </p>
      )}

      {rules.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {rules.map((rule) => (
            <RecurringCard
              key={rule.id}
              rule={rule}
              category={categoryById.get(rule.category_id)}
              busy={busyId === rule.id}
              onEdit={() => onOpenForm(rule.id)}
              onToggleActive={() => void toggleActive(rule)}
              onMore={() => setActionsFor(rule)}
            />
          ))}
        </ul>
      ) : (
        !loading &&
        !error && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nie masz jeszcze zleceń stałych. Dodaj pierwsze, np. czynsz albo wypłatę.
          </p>
        )
      )}

      {!loading && !error && (
        <section aria-labelledby="upcoming-title">
          <h3 id="upcoming-title" className={SECTION_TITLE}>
            Nadchodzące ({UPCOMING_DAYS} dni)
          </h3>
          <MobileUpcomingList occurrences={upcoming} categoryById={categoryById} />
        </section>
      )}

      <RecurringActionsDrawer
        rule={actionsFor}
        onClose={() => setActionsFor(null)}
        onEdit={(rule) => onOpenForm(rule.id)}
      />
    </div>
  );
}
