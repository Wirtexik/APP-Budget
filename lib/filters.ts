// Filtrowanie i sortowanie listy transakcji w Historii (czysta logika, bez Supabase).
// Działa na transakcjach już pobranych dla wybranego miesiąca, więc wynik
// zmienia się od razu przy każdej wpisanej literze.
import type { Category, CategoryType, Id, Transaction } from "@/lib/budget";

export type SortKey = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_desc", label: "Data: od najnowszych" },
  { value: "date_asc", label: "Data: od najstarszych" },
  { value: "amount_desc", label: "Kwota: od najwyższej" },
  { value: "amount_asc", label: "Kwota: od najniższej" },
];

export interface HistoryFilters {
  /** `null` = oba typy („Uznania” i „Obciążenia”). */
  type: CategoryType | null;
  /** Tylko wpisy utworzone przez zlecenia stałe; łączy się z typem. */
  recurring: boolean;
  /** Id wybranych kategorii (jako tekst); pusta lista = wszystkie kategorie. */
  categoryIds: string[];
  /** Szukane początki wyrazów w opisie i nazwie kategorii; pusty = bez wyszukiwania. */
  query: string;
  /** `null` = kolejność domyślna (jak z bazy: data, potem czas zapisu, malejąco). */
  sort: SortKey | null;
}

export const EMPTY_FILTERS: HistoryFilters = {
  type: null,
  recurring: false,
  categoryIds: [],
  query: "",
  sort: null,
};

/** Liczba filtrów z menu „Filtry” (bez wyszukiwarki i sortowania) – do znaczka na przycisku. */
export const menuFilterCount = (f: HistoryFilters) =>
  (f.type ? 1 : 0) + (f.recurring ? 1 : 0) + f.categoryIds.length;

export const hasActiveFilters = (f: HistoryFilters) =>
  menuFilterCount(f) > 0 || f.query.trim() !== "" || f.sort !== null;

// Do porównań: bez wielkości liter i polskich znaków („Żółć” ≈ „zolc”).
// „ł” nie rozkłada się w NFD na literę + znak diakrytyczny, więc zamieniamy ją osobno.
export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ł/g, "l")
    .trim();
}

const words = (value: string) =>
  normalizeText(value).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

// Każdy szukany wyraz musi być początkiem któregoś wyrazu w tekście:
// „ki” znajdzie „Kino”, ale nie „Biedronka zakupy” (litery w środku wyrazu się nie liczą).
export function matchesQuery(text: string, query: string) {
  const needles = words(query);
  if (needles.length === 0) return true;
  const haystack = words(text);
  return needles.every((n) => haystack.some((w) => w.startsWith(n)));
}

export function filterTransactions(
  transactions: Transaction[],
  categoryById: Map<string, Category>,
  filters: HistoryFilters
): Transaction[] {
  const selected = new Set(filters.categoryIds);

  const filtered = transactions.filter((t) => {
    const category = categoryById.get(String(t.category_id));
    if (filters.type && category?.type !== filters.type) return false;
    if (filters.recurring && t.recurring_rule_id == null) return false;
    if (selected.size > 0 && !selected.has(String(t.category_id))) return false;
    return matchesQuery(
      `${t.description ?? ""} ${category?.name ?? ""}`,
      filters.query
    );
  });

  return sortTransactions(filtered, filters.sort);
}

// Sortowanie stabilne: przy równej dacie lub kwocie zostaje kolejność domyślna.
// Przy dacie rosnąco odwracamy też kolejność zapisów z tego samego dnia.
export function sortTransactions(
  transactions: Transaction[],
  sort: SortKey | null
): Transaction[] {
  if (!sort) return transactions;
  if (sort === "date_asc") return [...transactions].reverse();
  if (sort === "date_desc") return transactions;
  const dir = sort === "amount_asc" ? 1 : -1;
  return [...transactions].sort(
    (a, b) => dir * (Number(a.amount) - Number(b.amount))
  );
}

export interface CategoryGroup {
  type: CategoryType;
  label: string;
  categories: Category[];
}

// Kategorie do menu filtrów, pogrupowane po typie i posortowane po nazwie.
// Przy wybranym typie pokazujemy tylko jego grupę.
export function categoryGroups(
  categories: Category[],
  type: CategoryType | null
): CategoryGroup[] {
  const groups: CategoryGroup[] = [
    { type: "wydatek", label: "Kategorie wydatków", categories: [] },
    { type: "przychod", label: "Kategorie przychodów", categories: [] },
  ];
  return groups
    .filter((g) => !type || g.type === type)
    .map((g) => ({
      ...g,
      categories: categories
        .filter((c) => c.type === g.type)
        .sort((a, b) => a.name.localeCompare(b.name, "pl")),
    }))
    .filter((g) => g.categories.length > 0);
}

// Zmiana typu odznacza kategorie drugiego typu – inaczej lista byłaby zawsze pusta.
export function withType(
  filters: HistoryFilters,
  type: CategoryType | null,
  categoryById: Map<string, Category>
): HistoryFilters {
  return {
    ...filters,
    type,
    categoryIds: type
      ? filters.categoryIds.filter((id) => categoryById.get(id)?.type === type)
      : filters.categoryIds,
  };
}

export function toggleCategory(categoryIds: string[], id: Id): string[] {
  const key = String(id);
  return categoryIds.includes(key)
    ? categoryIds.filter((c) => c !== key)
    : [...categoryIds, key];
}
