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
import { currency, formatDate, type Transaction } from "@/lib/budget";
import { useDeleteTransaction } from "@/lib/hooks/use-delete-transaction";

// Okno potwierdzenia usunięcia. `transaction === null` oznacza „zamknięte”.
export function DeleteTransactionDialog({
  transaction,
  onClose,
}: {
  transaction: Transaction | null;
  onClose: () => void;
}) {
  const { deleting, error, clearError, confirm: remove } = useDeleteTransaction();

  function close() {
    clearError();
    onClose();
  }

  async function confirm() {
    if (transaction && (await remove(transaction))) close();
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
