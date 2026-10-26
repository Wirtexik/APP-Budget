"use client";

// Akcje na zleceniu stałym – wspólne dla desktopu i mobile. Widok dostarcza
// tylko przyciski i potwierdzenie.

import { useState } from "react";
import { toast } from "sonner";

import type { Id } from "@/lib/budget";
import { useBudgetData, useRecurringData } from "@/lib/hooks/budget-data";
import type { RecurringRule } from "@/lib/recurring";
import { deleteRecurringRule, setRecurringRuleActive } from "@/lib/recurring-queries";

// Wstrzymanie / wznowienie. `busyId` – zlecenie, na którym trwa zmiana
// (blokuje jego przyciski).
export function useToggleRecurring() {
  const { userId } = useBudgetData();
  const { afterChange } = useRecurringData();
  const [busyId, setBusyId] = useState<Id | null>(null);

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

  return { busyId, toggleActive };
}

// Usunięcie zlecenia; `confirm` zwraca true po udanym usunięciu.
export function useDeleteRecurring() {
  const { userId } = useBudgetData();
  const { afterChange } = useRecurringData();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(rule: RecurringRule) {
    setDeleting(true);
    setError(null);
    const failure = await deleteRecurringRule(userId, rule.id);
    if (failure) {
      setDeleting(false);
      setError(failure);
      return false;
    }
    await afterChange();
    setDeleting(false);
    return true;
  }

  return { deleting, error, clearError: () => setError(null), confirm };
}
