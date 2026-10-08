"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  CalendarRange,
  ChartPie,
  ListTree,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { BudgetGauge } from "@/components/dashboard/budget-gauge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  currency,
  formatDate,
  type Category,
  type CategoryType,
  type Transaction,
} from "@/lib/budget";
import { fetchYearlyTransactions } from "@/lib/queries";

const EXPENSE_COLORS = [
  "#f97316",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#ef4444",
  "#22c55e",
  "#06b6d4",
  "#a855f7",
  "#64748b",
];

const INCOME_COLORS = [
  "#10b981",
  "#14b8a6",
  "#22c55e",
  "#84cc16",
  "#06b6d4",
  "#0ea5e9",
];

interface CategoryGroup {
  category: Category;
  total: number;
  color: string;
  transactions: Transaction[];
}

interface TypeGroup {
  total: number;
  groups: CategoryGroup[];
}

// Grupuje transakcje wg kategorii i typu. Kolejność transakcji w grupie zostaje taka,
// jak w danych wejściowych (zapytanie sortuje je już od najnowszych).
function groupTransactions(
  categories: Category[],
  transactions: Transaction[]
): Record<CategoryType, TypeGroup> {
  const byId = new Map(categories.map((c) => [String(c.id), c]));
  const groups = new Map<string, CategoryGroup>();

  for (const t of transactions) {
    const category = byId.get(String(t.category_id));
    if (!category) continue;

    const key = String(category.id);
    let group = groups.get(key);
    if (!group) {
      group = { category, total: 0, color: "", transactions: [] };
      groups.set(key, group);
    }
    group.total += Number(t.amount);
    group.transactions.push(t);
  }

  const build = (type: CategoryType, colors: string[]): TypeGroup => {
    const list = [...groups.values()]
      .filter((g) => g.category.type === type)
      .sort((a, b) => b.total - a.total);
    list.forEach((g, i) => {
      g.color = colors[i % colors.length];
    });
    return { total: list.reduce((sum, g) => sum + g.total, 0), groups: list };
  };

  return {
    wydatek: build("wydatek", EXPENSE_COLORS),
    przychod: build("przychod", INCOME_COLORS),
  };
}

const TYPE_SECTIONS: {
  type: CategoryType;
  title: string;
  Icon: typeof TrendingUp;
  amount: string;
}[] = [
  {
    type: "wydatek",
    title: "Wydatki",
    Icon: TrendingDown,
    amount: "text-orange-700 dark:text-orange-300",
  },
  {
    type: "przychod",
    title: "Przychody",
    Icon: TrendingUp,
    amount: "text-emerald-700 dark:text-emerald-300",
  },
];

type Granularity = "miesiac" | "rok";

export function ReportsTab({
  userId,
  categories,
  transactions,
  monthLabel,
  currentYear,
  loading,
}: {
  userId: string;
  categories: Category[];
  transactions: Transaction[];
  monthLabel: string;
  /** Rok aktualnie wybrany w globalnym filtrze u góry strony. */
  currentYear: number;
  loading: boolean;
}) {
  // Suwak „Miesiąc / Rok” – przełącza zakres danych dla wykresu, legendy
  // i akordeonu poniżej, niezależnie od globalnego wyboru miesiąca w nagłówku.
  const [granularity, setGranularity] = useState<Granularity>("miesiac");

  // Dane całego roku pobierane w tle (niezależnie od suwaka), żeby przełączenie
  // na „Rok” było natychmiastowe, bez migotania stanu ładowania.
  const [yearTransactions, setYearTransactions] = useState<Transaction[]>([]);
  const [yearLoading, setYearLoading] = useState(true);
  const [yearError, setYearError] = useState<string | null>(null);

  // Zmiana globalnego roku czyści stare dane roku bez efektu – dopasowanie stanu
  // podczas renderu (react.dev/learn/you-might-not-need-an-effect), inaczej przez
  // chwilę widać by było liczby z poprzedniego roku pod nową etykietą.
  const [syncedYear, setSyncedYear] = useState(currentYear);
  if (currentYear !== syncedYear) {
    setSyncedYear(currentYear);
    setYearLoading(true);
    setYearTransactions([]);
  }

  const yearRequestSeq = useRef(0);
  useEffect(() => {
    const id = ++yearRequestSeq.current;
    fetchYearlyTransactions(userId, currentYear).then((data) => {
      if (id !== yearRequestSeq.current) return;
      setYearError(data.error);
      setYearTransactions(data.transactions);
      setYearLoading(false);
    });
  }, [userId, currentYear]);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [String(c.id), c])),
    [categories]
  );

  const isYear = granularity === "rok";
  const activeTransactions = isYear ? yearTransactions : transactions;
  const activeLoading = isYear ? yearLoading : loading;
  const periodLabel = isYear ? String(currentYear) : monthLabel;
  const periodNoun = isYear ? "roku" : "miesiącu";

  const grouped = useMemo(
    () => groupTransactions(categories, activeTransactions),
    [categories, activeTransactions]
  );
  const expenses = grouped.wydatek;

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={granularity}
        onValueChange={(v) => v && setGranularity(v as Granularity)}
      >
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="miesiac" className="sm:px-4">
            <Calendar />
            Miesiąc
          </TabsTrigger>
          <TabsTrigger value="rok" className="sm:px-4">
            <CalendarRange />
            Rok
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isYear && yearError && (
        <p role="alert" className="text-sm text-destructive">
          Nie udało się pobrać danych roku: {yearError}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartPie className="size-4 text-muted-foreground" />
            Wydatki wg kategorii
          </CardTitle>
          <CardDescription>
            {isYear ? "Rok" : "Miesiąc"}: {periodLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeLoading ? (
            <p className="py-10 text-center text-muted-foreground">
              Ładowanie…
            </p>
          ) : (
            <div className="flex flex-col items-center gap-6 md:flex-row md:justify-around">
              <BudgetGauge
                transactions={activeTransactions}
                categoryById={categoryById}
                periodNoun={periodNoun}
              />

              {expenses.groups.length === 0 ? (
                <p className="w-full py-10 text-center text-muted-foreground md:max-w-sm">
                  Brak wydatków w tym {periodNoun}.
                </p>
              ) : (
                <ul className="flex w-full max-h-56 flex-col gap-2 overflow-y-auto pr-2 md:max-w-sm">
                  {expenses.groups.map((g) => (
                    <li
                      key={String(g.category.id)}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-[2px]"
                          style={{ background: g.color }}
                        />
                        <span className="truncate">{g.category.name}</span>
                      </span>
                      <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                        <span className="text-xs text-muted-foreground">
                          {Math.round((g.total / expenses.total) * 100)}%
                        </span>
                        <span className="font-medium">
                          {currency.format(g.total)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTree className="size-4 text-muted-foreground" />
            Struktura transakcji
          </CardTitle>
          <CardDescription>
            {periodLabel} – rozwiń, aby zobaczyć kategorie i pojedyncze wpisy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeLoading ? (
            <p className="py-6 text-center text-muted-foreground">
              Ładowanie…
            </p>
          ) : (
            <Accordion multiple>
              {TYPE_SECTIONS.map(({ type, title, Icon, amount }) => {
                const section = grouped[type];
                return (
                  <AccordionItem key={type} value={type}>
                    <AccordionTrigger className="items-center py-3 text-base hover:no-underline">
                      <span className="flex flex-1 items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <Icon className={`size-4 ${amount}`} />
                          {title}
                        </span>
                        <span className={`tabular-nums ${amount}`}>
                          {currency.format(section.total)}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {section.groups.length === 0 ? (
                        <p className="py-2 pl-6 text-muted-foreground">
                          Brak wpisów w tym {periodNoun}.
                        </p>
                      ) : (
                        <Accordion
                          multiple
                          className="ml-2 w-auto border-l pl-3 sm:ml-3 sm:pl-4"
                        >
                          {section.groups.map((g) => (
                            <AccordionItem
                              key={String(g.category.id)}
                              value={`${type}:${g.category.id}`}
                            >
                              <AccordionTrigger className="items-center hover:no-underline">
                                <span className="flex flex-1 items-center justify-between gap-3">
                                  <span className="flex min-w-0 items-center gap-2">
                                    <span
                                      className="size-2.5 shrink-0 rounded-[2px]"
                                      style={{ background: g.color }}
                                    />
                                    <span className="truncate">
                                      {g.category.name}
                                    </span>
                                    <span className="shrink-0 text-xs font-normal text-muted-foreground">
                                      ({g.transactions.length})
                                    </span>
                                  </span>
                                  <span className="shrink-0 tabular-nums">
                                    {currency.format(g.total)}
                                  </span>
                                </span>
                              </AccordionTrigger>
                              <AccordionContent>
                                <ul className="divide-y rounded-lg bg-muted/40 px-3">
                                  {g.transactions.map((t) => (
                                    <li
                                      key={String(t.id)}
                                      className="grid grid-cols-[auto_1fr_auto] items-baseline gap-3 py-2"
                                    >
                                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                                        {formatDate(t.date)}
                                      </span>
                                      <span
                                        className="truncate"
                                        title={t.description ?? undefined}
                                      >
                                        {t.description || "—"}
                                      </span>
                                      <span className="whitespace-nowrap tabular-nums">
                                        {currency.format(Number(t.amount))}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
