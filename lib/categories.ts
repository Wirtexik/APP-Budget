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

const normalizeName = (name: string) => name.trim().toLowerCase();

export const sameCategory = (a: CategoryRef, b: CategoryRef) =>
  a.type === b.type && normalizeName(a.name) === normalizeName(b.name);

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

// Wartość już istniejącej kategorii o tej nazwie i typie (domyślnej albo
// własnej), bez względu na wielkość liter i spacje; null, gdy takiej nie ma.
// Szybkie dodawanie kategorii zaznacza wtedy istniejącą zamiast tworzyć duplikat.
export function existingCategoryValue(
  categories: Category[],
  target: CategoryRef
): string | null {
  const preset = DEFAULT_CATEGORIES.find((d) => sameCategory(d, target));
  if (preset) return defaultValue(preset);
  const own = categories.find((c) => sameCategory(c, target));
  return own ? userValue(own) : null;
}

// Wyjaśnienie, czemu nie można usunąć kategorii; null, gdy nic jej nie używa.
export function categoryUsageMessage(usage: {
  transactions: number;
  rules: number;
}): string | null {
  const { transactions, rules } = usage;
  if (transactions === 0 && rules === 0) return null;

  const usages = [
    transactions > 0 && `transakcje (${transactions})`,
    rules > 0 && `zlecenia stałe (${rules})`,
  ].filter(Boolean);
  const hints = [
    transactions > 0 && "usuń transakcje lub przenieś je do innej kategorii",
    rules > 0 && "usuń zlecenia lub zmień im kategorię w zakładce „Zlecenia”",
  ].filter(Boolean);
  return `Ma przypisane ${usages.join(" i ")}. Najpierw ${hints.join(", a ")}.`;
}
