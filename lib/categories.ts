import type { Category, CategoryRef, CategoryType } from "@/lib/budget";

// Podstawowe kategorie dostępne od razu. W bazie powstają dopiero przy pierwszym
// użyciu (transakcje wymagają `category_id`), potem używany jest ten sam wiersz.
export const DEFAULT_CATEGORIES: CategoryRef[] = [
  { name: "Jedzenie", type: "wydatek" },
  { name: "Transport", type: "wydatek" },
  { name: "Rachunki", type: "wydatek" },
  { name: "Rozrywka", type: "wydatek" },
  { name: "Zdrowie", type: "wydatek" },
  { name: "Wynagrodzenie", type: "przychod" },
  { name: "Premia", type: "przychod" },
  { name: "Inne przychody", type: "przychod" },
];

export const sameCategory = (a: CategoryRef, b: CategoryRef) =>
  a.type === b.type && a.name.trim().toLowerCase() === b.name.toLowerCase();

export const defaultValue = (c: CategoryRef) => `default:${c.type}:${c.name}`;

export const userValue = (c: Category) => `user:${c.id}`;

// Kategorie dodane przez użytkownika. Wiersze z bazy, które odpowiadają kategorii
// domyślnej (utworzone przy jej pierwszym użyciu), nie są „własne” – nie da się ich usunąć.
export const ownCategories = (categories: Category[]) =>
  categories.filter((c) => !DEFAULT_CATEGORIES.some((d) => sameCategory(c, d)));

export interface CategoryOptions {
  defaults: { value: string; label: string }[];
  own: { value: string; label: string }[];
}

// Kategorie jednego typu: najpierw domyślne, pod nimi te dodane przez użytkownika.
export function buildCategoryOptions(
  categories: Category[],
  type: CategoryType
): CategoryOptions {
  return {
    defaults: DEFAULT_CATEGORIES.filter((c) => c.type === type).map((c) => ({
      value: defaultValue(c),
      label: c.name,
    })),
    own: ownCategories(categories)
      .filter((c) => c.type === type)
      .map((c) => ({ value: userValue(c), label: c.name })),
  };
}

// Wartość selecta odpowiadająca kategorii z bazy.
export function valueForCategory(category: Category) {
  const preset = DEFAULT_CATEGORIES.find((d) => sameCategory(category, d));
  return preset ? defaultValue(preset) : userValue(category);
}
