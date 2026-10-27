"use client";

import { useState } from "react";
import { CalendarClock, Plus, Repeat } from "lucide-react";

import { DeleteRecurringDialog } from "@/components/desktop/recurring/delete-recurring-dialog";
import { RecurringRuleDialog } from "@/components/desktop/recurring/recurring-rule-dialog";
import { RecurringRulesList } from "@/components/desktop/recurring/recurring-rules-list";
import { UpcomingList } from "@/components/desktop/recurring/upcoming-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBudgetData, useRecurringData } from "@/lib/hooks/budget-data";
import { useToggleRecurring } from "@/lib/hooks/use-recurring-actions";
import { UPCOMING_DAYS, type RecurringRule } from "@/lib/recurring";

// Zakładka „Zlecenia”: lista zleceń, nadchodzące wykonania, dialogi dodawania,
// edycji i usuwania. Dane i odświeżanie po zmianach: useRecurringData.
export function RecurringTab() {
  const { categoryById } = useBudgetData();
  const { rules, upcoming, loading, error: loadError } = useRecurringData();

  const { busyId, toggleActive } = useToggleRecurring();
  const [pendingDelete, setPendingDelete] = useState<RecurringRule | null>(null);

  // `editing === null` w otwartym oknie oznacza nowe zlecenie.
  const [editing, setEditing] = useState<RecurringRule | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  function openForm(rule: RecurringRule | null) {
    setEditing(rule);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      {loadError && (
        <p role="alert" className="text-sm text-destructive">
          Nie udało się pobrać zleceń: {loadError}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="size-4 text-muted-foreground" />
            Zlecenia stałe
          </CardTitle>
          <CardDescription>
            Transakcje tworzone automatycznie według harmonogramu.
          </CardDescription>
          <CardAction>
            <Button size="sm" onClick={() => openForm(null)}>
              <Plus />
              Nowe zlecenie
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <RecurringRulesList
            rules={rules}
            categoryById={categoryById}
            loading={loading}
            busyId={busyId}
            onEdit={openForm}
            onToggleActive={toggleActive}
            onDelete={setPendingDelete}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-muted-foreground" />
            Nadchodzące
          </CardTitle>
          <CardDescription>
            Wykonania aktywnych zleceń w ciągu {UPCOMING_DAYS} dni.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpcomingList
            occurrences={upcoming}
            categoryById={categoryById}
            loading={loading}
          />
        </CardContent>
      </Card>

      <RecurringRuleDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        rule={editing}
      />

      <DeleteRecurringDialog
        rule={pendingDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
