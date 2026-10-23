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
import { currency, formatDate, type Transaction } from "@/lib/budget";
import { useBudgetData } from "@/lib/hooks/budget-data";
import { deleteTransaction } from "@/lib/queries";

// Okno potwierdzenia usunięcia. `transaction === null` oznacza „zamknięte”.
export function DeleteTransactionDialog({
  transaction,
  onClose,
}: {
  transaction: Transaction | null;
  onClose: () => void;
}) {
  const { userId, refresh } = useBudgetData();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setError(null);
    onClose();
  }

  async function confirm() {
    if (!transaction) return;
    setDeleting(true);
    setError(null);

    const failure = await deleteTransaction(userId, transaction.id);
    await refresh();
    setDeleting(false);

    if (failure) {
      setError(failure);
    } else {
      close();
    }
  }

  return (
    <Dialog
      open={transaction !== null}
      onOpenChange={(open) => {
        if (!open && !deleting) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usunąć transakcję?</DialogTitle>
          <DialogDescription>
            {transaction
              ? `${transaction.description || "Bez opisu"} · ${formatDate(
                  transaction.date
                )} · ${currency.format(Number(transaction.amount))}. Tej operacji nie można cofnąć.`
              : ""}
          </DialogDescription>
        </DialogHeader>
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
            {deleting ? "Usuwanie…" : "Usuń"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
