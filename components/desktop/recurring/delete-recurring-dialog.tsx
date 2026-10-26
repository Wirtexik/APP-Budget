"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { currency } from "@/lib/budget";
import { useBudgetData } from "@/lib/hooks/budget-data";
import { useDeleteRecurring } from "@/lib/hooks/use-recurring-actions";
import { describeSchedule, type RecurringRule } from "@/lib/recurring";

// Potwierdzenie usunięcia zlecenia. `rule === null` oznacza „zamknięte”.
export function DeleteRecurringDialog({
  rule,
  onClose,
}: {
  rule: RecurringRule | null;
  onClose: () => void;
}) {
  const { categoryById } = useBudgetData();
  const { deleting, error, clearError, confirm: confirmDelete } = useDeleteRecurring();

  function close() {
    clearError();
    onClose();
  }

  async function confirm() {
    if (rule && (await confirmDelete(rule))) close();
  }

  const name = rule
    ? rule.description || categoryById.get(rule.category_id)?.name || "Zlecenie"
    : "";

  return (
    <Dialog
      open={rule !== null}
      onOpenChange={(open) => {
        if (!open && !deleting) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usunąć zlecenie stałe?</DialogTitle>
          <DialogDescription>
            {rule
              ? `${name} · ${currency.format(Number(rule.amount))} · ${describeSchedule(rule)}.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Nie powstaną już nowe transakcje. Transakcje wykonane dotąd zostaną
          w historii. Jeśli chcesz tylko zrobić przerwę, wstrzymaj zlecenie.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={deleting} onClick={close}>
            Anuluj
          </Button>
          <Button variant="destructive" disabled={deleting} onClick={confirm}>
            <Trash2 />
            {deleting ? "Usuwanie…" : "Usuń zlecenie"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
