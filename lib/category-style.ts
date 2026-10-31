// Ikona i kolor kategorii (czysta logika, baza bez zmian).
//
// Kategorie domyślne mają stałą ikonę Lucide i kolor; własne dostają ikonę
// ogólną i kolor z palety wybrany po nazwie – zawsze ten sam dla tej samej
// nazwy, bez względu na wielkość liter i spacje na brzegach.

import {
  Car,
  Clapperboard,
  Coins,
  Gift,
  Hammer,
  HeartPulse,
  PiggyBank,
  Receipt,
  Tag,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { DEFAULT_CATEGORIES, sameCategory } from "@/lib/categories";
import type { CategoryRef } from "@/lib/budget";

export interface CategoryStyle {
  icon: LucideIcon;
  /** Kolor hex, czytelny w obu motywach. */
  color: string;
}

/** Paleta dla kategorii własnych. */
export const CATEGORY_PALETTE = [
  "#8B5CF6",
  "#6366F1",
  "#0EA5E9",
  "#14B8A6",
  "#F59E0B",
  "#F97316",
  "#EC4899",
  "#84CC16",
] as const;

const DEFAULT_STYLES: Record<string, CategoryStyle> = {
  Jedzenie: { icon: UtensilsCrossed, color: "#F97316" },
  Transport: { icon: Car, color: "#0EA5E9" },
  Rachunki: { icon: Receipt, color: "#6366F1" },
  Rozrywka: { icon: Clapperboard, color: "#EC4899" },
  Zdrowie: { icon: HeartPulse, color: "#EF4444" },
  Skarbonka: { icon: PiggyBank, color: "#8B5CF6" },
  Wynagrodzenie: { icon: Wallet, color: "#10B981" },
  Premia: { icon: Gift, color: "#A855F7" },
  "Inne przychody": { icon: Coins, color: "#14B8A6" },
  "Ze skarbonki": { icon: Hammer, color: "#22C55E" },
};

export const FALLBACK_ICON = Tag;

// djb2 – prosty, stabilny hash; wystarczy do rozłożenia nazw na paletę.
function hashName(name: string) {
  let hash = 5381;
  for (const char of name.trim().toLowerCase()) {
    hash = ((hash << 5) + hash + char.codePointAt(0)!) >>> 0;
  }
  return hash;
}

export function categoryStyle(category: CategoryRef): CategoryStyle {
  const preset = DEFAULT_CATEGORIES.find((d) => sameCategory(category, d));
  if (preset) return DEFAULT_STYLES[preset.name];
  return {
    icon: FALLBACK_ICON,
    color: CATEGORY_PALETTE[hashName(category.name) % CATEGORY_PALETTE.length],
  };
}
