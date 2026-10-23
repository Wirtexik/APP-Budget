"use client";

import { useState } from "react";
import { CalendarClock, Plus, Repeat } from "lucide-react";
import { toast } from "sonner";

import { DeleteRecurringDialog } from "@/components/recurring/delete-recurring-dialog";
import { RecurringRuleDialog } from "@/components/recurring/recurring-rule-dialog";
import { RecurringRulesList } from "@/components/recurring/recurring-rules-list";
import { UpcomingList } from "@/components/recurring/upcoming-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Id } from "@/lib/budget";
import { useBudgetData, useRecurringData } from "@/lib/hooks/budget-data";
import { UPCOMING_DAYS, type RecurringRule } from "@/lib/recurring";
import { setRecurringRuleActive } from "@/lib/recurring-queries";

// Zakładka „Zlecenia”: lista zleceń, nadchodzące wykonania, dialogi dodawania,
// edycji i usuwania. Dane i odświeżanie po zmianach: useRecurringData.
export function RecurringTab() {
  const { userId, categoryById } = useBudgetData();
  const {
    rules,
    upcoming,
    loading,
    error: loadError,
    afterChange,
  } = useRecurringData();

  // Zlecenie, na którym trwa wstrzymanie / wznowienie (blokuje jego przyciski).
  const [busyId, setBusyId] = useState<Id | null>(null);
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

  async function toggleActive(rule: RecurringRule) {
    setBusyId(rule.id);
    const failure = await setRecurringRuleActive(userId, rule.id, !rule.is_active);
    if (failure) {
      toast.error(failure);
    } else {
      toast.success(rule.is_active ? "Wstrzymano zlecenie" : "Wznowiono zlecenie", {
        description: rule.is_active
          ? "Do czasu wznowienia nie powstaną nowe transakcje."
          : "Terminy z czasu przerwy zostały pominięte.",
      });
      await afterChange();
    }
    setBusyId(null);
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
