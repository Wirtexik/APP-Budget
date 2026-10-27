"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { ruleName } from "@/components/mobile/recurring/recurring-card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { currency } from "@/lib/budget";
import { useBudgetData } from "@/lib/hooks/budget-data";
import { useDeleteRecurring } from "@/lib/hooks/use-recurring-actions";
import { describeSchedule, type RecurringRule } from "@/lib/recurring";

const BIG = "h-12 rounded-2xl text-base font-semibold";

// Panel akcji zlecenia z dołu: „Edytuj” i „Usuń”, a po „Usuń” – potwierdzenie
// w tym samym panelu. `confirmOnly` (z formularza edycji) od razu pokazuje
// potwierdzenie. `rule === null` oznacza „zamknięte”.
export function RecurringActionsDrawer({
  rule,
  confirmOnly = false,
  onClose,
  onEdit,
  onDeleted,
}: {
  rule: RecurringRule | null;
  confirmOnly?: boolean;
  onClose: () => void;
  onEdit?: (rule: RecurringRule) => void;
  onDeleted?: () => void;
}) {
  const { categoryById } = useBudgetData();
  const { deleting, error, clearError, confirm } = useDeleteRecurring();
  const [confirming, setConfirming] = useState(false);
  const showConfirm = confirmOnly || confirming;

  function close() {
    clearError();
    setConfirming(false);
    onClose();
  }

  async function handleDelete() {
    if (!rule || !(await confirm(rule))) return;
    close();
    onDeleted?.();
  }

  const summary = rule
    ? `${ruleName(rule, categoryById.get(rule.category_id))} · ${currency.format(
        Number(rule.amount)
      )} · ${describeSchedule(rule)}`
    : "";

  return (
    <Drawer
      open={rule !== null}
      onOpenChange={(open) => {
        if (!open && !deleting) close();
      }}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{showConfirm ? "Usunąć zlecenie stałe?" : "Zlecenie stałe"}</DrawerTitle>
          <DrawerDescription>{summary}</DrawerDescription>
        </DrawerHeader>

        {showConfirm && (
          <p className="text-center text-sm text-muted-foreground">
            Nie powstaną już nowe transakcje. Transakcje wykonane dotąd zostaną w historii.
            Jeśli chcesz tylko zrobić przerwę, wstrzymaj zlecenie.
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DrawerFooter>
          {showConfirm ? (
            <>
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={handleDelete}
                className={`${BIG} bg-destructive text-white hover:bg-destructive/90`}
              >
                {deleting ? "Usuwanie…" : "Usuń zlecenie"}
              </Button>
              <Button variant="secondary" disabled={deleting} onClick={close} className={BIG}>
                Anuluj
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  if (!rule) return;
                  close();
                  onEdit?.(rule);
                }}
                className={BIG}
              >
                <Pencil />
                Edytuj
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirming(true)}
                className={`${BIG} text-destructive`}
              >
                <Trash2 />
                Usuń
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
