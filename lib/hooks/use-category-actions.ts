"use client";

// Dodawanie, edycja i usuwanie własnych kategorii – wspólne dla desktopu
// i mobile. Widok dostarcza tylko pola, przyciski i potwierdzenie.

import { useState } from "react";
import { toast } from "sonner";

import type { Category, CategoryType, Id } from "@/lib/budget";
import { categoryUsageMessage } from "@/lib/categories";
import { thrownMessage } from "@/lib/errors";
import { useBudgetData } from "@/lib/hooks/budget-data";
import {
  countCategoryUsage,
  deleteCategory,
  insertCategory,
  updateCategory,
} from "@/lib/queries";

// Formularz kategorii: `category === null` – nowa, inaczej edycja (nazwa i typ
// startują z kategorii; `key` w rodzicu resetuje stan przy nowym otwarciu).
// `submit` zwraca true po udanym zapisie; nowa kategoria czyści wtedy nazwę.
export function useCategoryForm(category: Category | null) {
  const { userId, categories, refresh } = useBudgetData();
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<CategoryType>(category?.type ?? "wydatek");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(): Promise<boolean> {
    setError(null);
    if (!name.trim()) {
      setError("Podaj nazwę kategorii.");
      return false;
    }

    setSaving(true);
    try {
      const failure = category
        ? await updateCategory(userId, categories, category.id, { name, type })
        : (await insertCategory(userId, categories, { name, type })).error;
      if (failure !== null) {
        setError(failure);
        return false;
      }

      if (!category) setName("");
      await refresh();
      return true;
    } catch (thrown) {
      setError(thrownMessage(thrown));
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { name, setName, type, setType, error, setError, saving, submit };
}

// Usunięcie kategorii: najpierw sprawdzenie, czy coś jej używa (inaczej baza
// usunęłaby kaskadowo jej transakcje), potem usunięcie. Wynik jako komunikat.
// `removingId` – kategoria, na której trwa usuwanie (blokuje przyciski).
export function useRemoveCategory() {
  const { userId, refresh } = useBudgetData();
  const [removingId, setRemovingId] = useState<Id | null>(null);

  async function remove(category: Category) {
    setRemovingId(category.id);

    const blocked = (description: string) =>
      toast.error(`Nie można usunąć kategorii „${category.name}”`, {
        description,
        duration: 7000,
      });

    try {
      const usage = await countCategoryUsage(userId, category.id);
      const usageMessage = categoryUsageMessage(usage);

      if (usage.error) {
        toast.error("Nie udało się sprawdzić, czy kategoria jest używana", {
          description: usage.error,
        });
      } else if (usageMessage) {
        blocked(usageMessage);
      } else {
        const { error, inUse } = await deleteCategory(userId, category.id);
        if (inUse) {
          blocked(
            "Ma przypisane transakcje lub zlecenia stałe. Usuń je lub przenieś do innej kategorii i spróbuj ponownie."
          );
        } else if (error) {
          toast.error("Nie udało się usunąć kategorii", { description: error });
        } else {
          toast.success(`Usunięto kategorię „${category.name}”`);
        }
      }
      await refresh();
    } catch (thrown) {
      toast.error("Nie udało się usunąć kategorii", { description: thrownMessage(thrown) });
    } finally {
      setRemovingId(null);
    }
  }

  return { removingId, remove };
}
