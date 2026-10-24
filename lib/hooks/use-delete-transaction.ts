"use client";

// Usuwanie transakcji z potwierdzeniem – wspólne dla okna desktopowego
// i panelu z dołu w mobile. Widok dostarcza tylko przyciski.

import { useState } from "react";

import type { Transaction } from "@/lib/budget";
import { useBudgetData } from "@/lib/hooks/budget-data";
import { deleteTransaction } from "@/lib/queries";

export function useDeleteTransaction() {
  const { userId, refresh } = useBudgetData();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zwraca true po udanym usunięciu. Dane odświeżają się także po błędzie
  // (wpis mógł zniknąć wcześniej, np. w innej karcie).
  async function confirm(transaction: Transaction) {
    setDeleting(true);
    setError(null);
    const failure = await deleteTransaction(userId, transaction.id);
    await refresh();
    setDeleting(false);
    if (failure) setError(failure);
    return !failure;
  }

  return { deleting, error, clearError: () => setError(null), confirm };
}
