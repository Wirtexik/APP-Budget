"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { pluralEntries, type Category, type Id } from "@/lib/budget";
import {
  addDays,
  todayKey,
  type RecurringRule,
  type UpcomingOccurrence,
} from "@/lib/recurring";
import {
  fetchRecurringRules,
  fetchUpcoming,
  materializeRecurring,
  setRecurringRuleActive,
} from "@/lib/recurring-queries";

/** Ile dni do przodu pokazuje sekcja „Nadchodzące”. */
export const UPCOMING_DAYS = 30;

interface RecurringView {
  error: string | null;
  rules: RecurringRule[];
  upcoming: UpcomingOccurrence[];
}

async function fetchRecurringView(userId: string): Promise<RecurringView> {
  const [rules, upcoming] = await Promise.all([
    fetchRecurringRules(userId),
    fetchUpcoming(addDays(todayKey(), UPCOMING_DAYS)),
  ]);
  return {
    error: rules.error ?? upcoming.error,
    rules: rules.rules,
    upcoming: upcoming.occurrences,
  };
}

// Zakładka „Zlecenia”: lista zleceń, nadchodzące wykonania, dialogi dodawania,
// edycji i usuwania. Po każdej zmianie tworzy zaległe transakcje
// (`materializeRecurring`) i prosi dashboard o odświeżenie danych miesiąca.
export function RecurringTab({
  userId,
  categories,
  categoryById,
  onTransactionsChanged,
}: {
  userId: string;
  categories: Category[];
  categoryById: Map<string, Category>;
  onTransactionsChanged: () => Promise<void>;
}) {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Zlecenie, na którym trwa wstrzymanie / wznowienie (blokuje jego przyciski).
  const [busyId, setBusyId] = useState<Id | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecurringRule | null>(null);

  // `editing === null` w otwartym oknie oznacza nowe zlecenie.
  const [editing, setEditing] = useState<RecurringRule | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const requestSeq = useRef(0);

  const apply = useCallback((data: RecurringView) => {
    if (data.error) {
      setLoadError(data.error);
    } else {
      setLoadError(null);
      setRules(data.rules);
      setUpcoming(data.upcoming);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const id = ++requestSeq.current;
    fetchRecurringView(userId).then((data) => {
      if (id === requestSeq.current) apply(data);
    });
  }, [userId, apply]);

  // Po zmianie zlecenia: utwórz należne transakcje (np. zlecenie startujące dziś),
  // a potem odśwież zakładkę i dane miesiąca.
  const afterChange = useCallback(async () => {
    const { error, created } = await materializeRecurring();
    if (error) {
      toast.error("Nie udało się wykonać zleceń stałych", { description: error });
    } else if (created > 0) {
      toast.success(
        `Dodano ${created} ${pluralEntries(created)} ze zleceń stałych`
      );
    }

    const id = ++requestSeq.current;
    const [data] = await Promise.all([
      fetchRecurringView(userId),
      onTransactionsChanged(),
    ]);
    if (id === requestSeq.current) apply(data);
  }, [userId, apply, onTransactionsChanged]);

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
        userId={userId}
        categories={categories}
        categoryById={categoryById}
        onSaved={afterChange}
      />

      <DeleteRecurringDialog
        rule={pendingDelete}
        userId={userId}
        categoryById={categoryById}
        onClose={() => setPendingDelete(null)}
        onDeleted={afterChange}
      />
    </div>
  );
}
