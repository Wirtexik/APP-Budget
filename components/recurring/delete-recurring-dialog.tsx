"use client";

import { useState } from "react";
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
import { currency, type Category } from "@/lib/budget";
import { describeSchedule, type RecurringRule } from "@/lib/recurring";
import { deleteRecurringRule } from "@/lib/recurring-queries";

// Potwierdzenie usunięcia zlecenia. `rule === null` oznacza „zamknięte”.
export function DeleteRecurringDialog({
  rule,
  userId,
  categoryById,
  onClose,
  onDeleted,
}: {
  rule: RecurringRule | null;
  userId: string;
  categoryById: Map<string, Category>;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setError(null);
    onClose();
  }

  async function confirm() {
    if (!rule) return;
    setDeleting(true);
    setError(null);

    const failure = await deleteRecurringRule(userId, rule.id);
    if (failure) {
      setDeleting(false);
      setError(failure);
      return;
    }

    await onDeleted();
    setDeleting(false);
    close();
  }

  const name = rule
    ? rule.description || categoryById.get(String(rule.category_id))?.name || "Zlecenie"
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
