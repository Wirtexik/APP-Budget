"use client";

// Rozbicie skarbonki: cała zawartość wraca do budżetu jako przychód
// „Ze skarbonki” z dzisiejszą datą (lib/piggy-bank.ts). Widok dostarcza
// tylko potwierdzenie.

import { useState } from "react";
import { toast } from "sonner";

import { currency } from "@/lib/budget";
import { PIGGY_BREAK, defaultValue } from "@/lib/categories";
import { useBudgetData } from "@/lib/hooks/budget-data";
import { insertTransaction, resolveCategory } from "@/lib/queries";
import { todayKey } from "@/lib/recurring";

export function useBreakPiggyBank() {
  const { userId, categories, refresh } = useBudgetData();
  const [breaking, setBreaking] = useState(false);

  // Zwraca true po udanym rozbiciu.
  async function breakPiggyBank(amount: number) {
    setBreaking(true);
    const category = await resolveCategory(userId, categories, defaultValue(PIGGY_BREAK));
    const failure =
      category.error ??
      (await insertTransaction(userId, category.id, {
        amount,
        date: todayKey(),
        description: "",
      }));
    // Odświeżamy też po błędzie: kategoria mogła już powstać.
    await refresh();
    setBreaking(false);

    if (failure) {
      toast.error("Nie udało się rozbić skarbonki", { description: failure });
      return false;
    }
    toast.success(`${currency.format(amount)} wróciło do budżetu`);
    return true;
  }

  return { breaking, breakPiggyBank };
}
