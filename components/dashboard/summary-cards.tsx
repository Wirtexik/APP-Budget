"use client";

import type { ReactNode } from "react";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { currency, type Totals } from "@/lib/budget";

interface CardSpec {
  key: string;
  title: string;
  description: string;
  value: number;
  Icon: LucideIcon;
  card: string;
  chip: string;
  amount: string;
  action?: ReactNode;
}

// Karty Saldo / Przychody / Wydatki za wybrany miesiąc. `incomeAction` to przycisk
// szybkiego dodawania przychodu, osadzony w karcie „Przychody”.
export function SummaryCards({
  totals,
  monthLabel,
  loading,
  incomeAction,
}: {
  totals: Totals;
  monthLabel: string;
  loading: boolean;
  incomeAction: ReactNode;
}) {
  const cards: CardSpec[] = [
    {
      key: "balance",
      title: "Saldo",
      description: monthLabel,
      value: totals.balance,
      Icon: Wallet,
      card: "from-sky-500/25 via-blue-500/10 to-transparent ring-blue-500/25",
      chip: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
      amount:
        totals.balance < 0
          ? "text-destructive"
          : "text-blue-700 dark:text-blue-300",
    },
    {
      key: "income",
      title: "Przychody",
      description: monthLabel,
      value: totals.income,
      Icon: TrendingUp,
      card: "from-emerald-500/25 via-green-500/10 to-transparent ring-emerald-500/25",
      chip: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
      amount: "text-emerald-700 dark:text-emerald-300",
      action: incomeAction,
    },
    {
      key: "expenses",
      title: "Wydatki",
      description: monthLabel,
      value: totals.expenses,
      Icon: TrendingDown,
      card: "from-orange-500/25 via-rose-500/10 to-transparent ring-orange-500/25",
      chip: "bg-orange-500/15 text-orange-600 dark:text-orange-300",
      amount: "text-orange-700 dark:text-orange-300",
    },
  ];

  return (
    <section className="flex flex-col gap-4 sm:grid sm:grid-cols-3">
      {cards.map((item) => (
        <Card key={item.key} className={`bg-linear-to-br ${item.card}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span
                className={`flex size-7 items-center justify-center rounded-lg ${item.chip}`}
              >
                <item.Icon className="size-4" />
              </span>
              {item.title}
            </CardTitle>
            <CardDescription>{item.description}</CardDescription>
            {item.action && <CardAction>{item.action}</CardAction>}
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold tabular-nums ${item.amount}`}>
              {loading ? "…" : currency.format(item.value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
