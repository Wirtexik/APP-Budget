"use client";

import { Tag } from "lucide-react";

import { SignedAmount } from "@/components/shared/signed-amount";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { categoryOf, formatDate, type Transaction } from "@/lib/budget";
import { categoryStyle } from "@/lib/category-style";
import { useBudgetData } from "@/lib/hooks/budget-data";
import { useDeleteTransaction } from "@/lib/hooks/use-delete-transaction";

// Potwierdzenie usunięcia w panelu z dołu (ekran 8 makiety).
// `transaction === null` oznacza „zamknięte”.
export function DeleteTransactionDrawer({
  transaction,
  onClose,
  onDeleted,
}: {
  transaction: Transaction | null;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const { categoryById } = useBudgetData();
  const { deleting, error, clearError, confirm } = useDeleteTransaction();

  function close() {
    clearError();
    onClose();
  }

  async function handleDelete() {
    if (!transaction || !(await confirm(transaction))) return;
    close();
    onDeleted?.();
  }

  const category = transaction ? categoryOf(transaction, categoryById) : undefined;
  const { icon: Icon, color } = category
    ? categoryStyle(category)
    : { icon: Tag, color: "#94A3B8" };

  return (
    <Drawer
      open={transaction !== null}
      onOpenChange={(open) => {
        if (!open && !deleting) close();
      }}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Usunąć transakcję?</DrawerTitle>
          <DrawerDescription>Tej operacji nie można cofnąć.</DrawerDescription>
        </DrawerHeader>

        {transaction && (
          <div className="flex items-center gap-3 rounded-2xl bg-muted p-4">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${color}26`, color }}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{category?.name ?? "Bez kategorii"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {transaction.description || "Bez opisu"}, {formatDate(transaction.date)}
              </p>
            </div>
            <SignedAmount
              amount={transaction.amount}
              category={category}
              className="font-bold"
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DrawerFooter>
          <Button
            variant="destructive"
            disabled={deleting}
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-destructive text-base font-semibold text-white hover:bg-destructive/90"
          >
            {deleting ? "Usuwanie…" : "Usuń"}
          </Button>
          <Button
            variant="secondary"
            disabled={deleting}
            onClick={close}
            className="h-12 rounded-2xl text-base font-semibold"
          >
            Anuluj
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
