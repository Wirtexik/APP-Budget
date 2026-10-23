"use client";

// Stan i zapis formularza transakcji – wspólne dla formularza wydatku, okna
// przychodu, edycji i przyszłego formularza mobilnego. Widok dostarcza tylko pola.

import { useState, type FormEvent } from "react";

import {
  categoryOf,
  dateKey,
  type CategoryType,
  type Transaction,
} from "@/lib/budget";
import { valueForCategory } from "@/lib/categories";
import { useBudgetData } from "@/lib/hooks/budget-data";
import {
  insertTransaction,
  resolveCategory,
  updateTransaction,
  type Resolved,
} from "@/lib/queries";
import { validateTransactionInput } from "@/lib/transaction-input";

export type TransactionFormMode =
  | { kind: "create"; type: CategoryType }
  | { kind: "edit"; transaction: Transaction };

interface Fields {
  amount: string;
  date: string;
  categoryValue: string | null;
  description: string;
}

// Nowy wpis zaczyna się od pustych pól i dzisiejszej daty – niezależnie od
// filtra miesiąca u góry strony (ten służy tylko do filtrowania widoku).
const emptyFields = (): Fields => ({
  amount: "",
  date: dateKey(new Date()),
  categoryValue: null,
  description: "",
});

export function useTransactionForm(mode: TransactionFormMode) {
  const { userId, categories, categoryById, afterSave } = useBudgetData();

  // Wartości z chwili otwarcia formularza (przy edycji: z edytowanego wpisu).
  const [initial] = useState(() => {
    if (mode.kind === "create") {
      return { fields: emptyFields(), type: mode.type };
    }
    const { transaction } = mode;
    const category = categoryOf(transaction, categoryById);
    return {
      fields: {
        amount: String(transaction.amount),
        date: transaction.date.slice(0, 10),
        categoryValue: category ? valueForCategory(category) : null,
        description: transaction.description ?? "",
      },
      // Edycja zachowuje typ wpisu: wydatek zostaje wydatkiem, a przychód przychodem.
      type: category?.type ?? "wydatek",
    };
  });

  const [fields, setFields] = useState<Fields>(initial.fields);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set =
    <K extends keyof Fields>(key: K) =>
    (value: Fields[K]) =>
      setFields((f) => ({ ...f, [key]: value }));

  function reset() {
    setFields(mode.kind === "create" ? emptyFields() : initial.fields);
    setError(null);
  }

  async function save(amount: number, categoryValue: string) {
    const { date, description } = fields;

    if (mode.kind === "create") {
      const category = await resolveCategory(userId, categories, categoryValue);
      if (category.error !== null) return category.error;
      return insertTransaction(userId, category.id, { amount, date, description });
    }

    // Gdy kategoria nie została zmieniona, zostaje dotychczasowy `category_id`
    // (nazwa domyślnej kategorii mogłaby wskazywać inny, zdublowany wiersz).
    const { transaction } = mode;
    const keptId =
      categoryValue === initial.fields.categoryValue ? transaction.category_id : null;
    const resolved: Resolved = keptId
      ? { id: keptId, error: null }
      : await resolveCategory(userId, categories, categoryValue);
    if (resolved.error !== null) return resolved.error;
    return updateTransaction(userId, transaction.id, {
      amount,
      date,
      description,
      categoryId: resolved.id,
    });
  }

  // Zwraca true po udanym zapisie. Nowy wpis czyści formularz (data wraca na dziś).
  async function handleSubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setError(null);

    const validation = validateTransactionInput(fields);
    if (!validation.ok) {
      setError(validation.error);
      return false;
    }

    setSaving(true);
    const failure = await save(validation.value.amount, validation.value.categoryValue);
    if (failure) {
      setSaving(false);
      setError(failure);
      return false;
    }

    await afterSave(fields.date);
    setSaving(false);
    if (mode.kind === "create") reset();
    return true;
  }

  return {
    ...fields,
    setAmount: set("amount"),
    setDate: set("date"),
    setCategoryValue: set("categoryValue"),
    setDescription: set("description"),
    /** Typ kategorii, które pokazuje select. */
    type: initial.type,
    categories,
    error,
    saving,
    handleSubmit,
    reset,
  };
}
