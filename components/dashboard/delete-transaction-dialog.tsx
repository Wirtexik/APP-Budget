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
import { getSupabase } from "@/lib/supabase";

// Okno potwierdzenia usunięcia. `transaction === null` oznacza „zamknięte”.
export function DeleteTransactionDialog({
  transaction,
  userId,
  onClose,
  onDeleted,
}: {
  transaction: Transaction | null;
  userId: string;
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
    if (!transaction) return;
    setDeleting(true);
    setError(null);

    const { data, error: dbError } = await getSupabase()
      .from("transactions")
      .delete()
      .eq("id", transaction.id)
      .eq("user_id", userId)
      .select("id");

    if (dbError) {
      setDeleting(false);
      setError(dbError.message);
      return;
    }

    // Supabase przy braku uprawnień (RLS) nie zwraca błędu, tylko 0 usuniętych wierszy.
    const removed = (data?.length ?? 0) > 0;
    await onDeleted();
    setDeleting(false);

    if (removed) {
      close();
    } else {
      setError(
        "Nie usunięto wpisu – nie istnieje albo brak uprawnień do usuwania."
      );
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
