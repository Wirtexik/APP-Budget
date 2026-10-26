import {
  categoryOf,
  fromGrosze,
  toGrosze,
  type Category,
  type CategoryType,
  type Id,
  type Transaction,
} from "@/lib/budget";

export interface CategoryGroup {
  category: Category;
  /** Suma w złotych. */
  total: number;
  transactions: Transaction[];
}

export interface TypeGroup {
  /** Suma w złotych. */
  total: number;
  /** Od największej sumy. */
  groups: CategoryGroup[];
}

export type ReportGroups = Record<CategoryType, TypeGroup>;

// Grupuje transakcje wg typu i kategorii (Raporty). Kolejność transakcji w grupie
// zostaje taka, jak w danych wejściowych (zapytanie sortuje je od najnowszych).
// Wpisy bez znanej kategorii są pomijane. Kolory nadaje widok.
export function groupTransactions(
  transactions: Transaction[],
  categoryById: Map<Id, Category>
): ReportGroups {
  // Sumy w groszach (bez błędów zmiennoprzecinkowych), na złote dopiero na końcu.
  const groups = new Map<Id, { category: Category; grosze: number; transactions: Transaction[] }>();

  for (const t of transactions) {
    const category = categoryOf(t, categoryById);
    if (!category) continue;

    let group = groups.get(category.id);
    if (!group) {
      group = { category, grosze: 0, transactions: [] };
      groups.set(category.id, group);
    }
    group.grosze += toGrosze(t.amount);
    group.transactions.push(t);
  }

  const build = (type: CategoryType): TypeGroup => {
    const list = [...groups.values()]
      .filter((g) => g.category.type === type)
      .sort((a, b) => b.grosze - a.grosze);
    const total = list.reduce((sum, g) => sum + g.grosze, 0);
    return {
      total: fromGrosze(total),
      groups: list.map(({ category, grosze, transactions }) => ({
        category,
        total: fromGrosze(grosze),
        transactions,
      })),
    };
  };

  return { wydatek: build("wydatek"), przychod: build("przychod") };
}

// Udział części w całości w pełnych procentach; 0, gdy całość jest zerowa.
export function share(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
