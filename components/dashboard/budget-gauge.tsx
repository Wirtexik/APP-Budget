"use client";

import { useMemo } from "react";
import { Label, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  computeTotals,
  currency,
  type Category,
  type Transaction,
} from "@/lib/budget";

const CHART_CONFIG = { value: { label: "Kwota" } } satisfies ChartConfig;

// Zużyta część budżetu – neutralny szary; pozostała część – zielony.
const COLOR_USED = "#94a3b8";
const COLOR_REMAINING = "#10b981";
// Budżet wyczerpany lub przekroczony (wydatki >= przychody) – cała oponka czerwona.
const COLOR_EXCEEDED = "#ef4444";

interface Segment {
  name: string;
  value: number;
  fill: string;
}

function buildSegments(income: number, expenses: number): Segment[] {
  if (expenses >= income) {
    return [{ name: "Wydane", value: expenses, fill: COLOR_EXCEEDED }];
  }
  const segments: Segment[] = [];
  if (expenses > 0) {
    segments.push({ name: "Wydane", value: expenses, fill: COLOR_USED });
  }
  segments.push({
    name: "Pozostało",
    value: income - expenses,
    fill: COLOR_REMAINING,
  });
  return segments;
}

// Sam wykres (bez karty) – oponka z sumą przychodów na tle wydatków wybranego
// miesiąca. W środku wyłącznie kwota, jaka została (albo „Na minusie” przy
// przekroczeniu); procent wykorzystania budżetu jest osobnym tekstem pod spodem.
export function BudgetGauge({
  transactions,
  categoryById,
  periodNoun = "miesiącu",
}: {
  transactions: Transaction[];
  categoryById: Map<string, Category>;
  /** Odmieniony okres w miejscownikowej frazie „w tym ___” (np. „miesiącu”, „roku”). */
  periodNoun?: string;
}) {
  const { income, expenses, balance } = useMemo(
    () => computeTotals(transactions, categoryById),
    [transactions, categoryById]
  );

  if (income === 0 && expenses === 0) {
    return (
      <div className="flex w-full max-w-[280px] flex-col items-center justify-center gap-2">
        <p className="py-10 text-center text-sm text-muted-foreground">
          Brak transakcji w tym {periodNoun}.
        </p>
      </div>
    );
  }

  const segments = buildSegments(income, expenses);
  const overBudget = balance < 0;
  const caption = overBudget ? "Na minusie" : "Zostało";
  const amountClass = overBudget ? "fill-destructive" : "fill-foreground";

  const percentText =
    income > 0
      ? `Wykorzystano ${Math.round((expenses / income) * 100)}% budżetu`
      : `Brak przychodów w tym ${periodNoun}`;

  return (
    <div className="flex w-full max-w-[280px] flex-col items-center gap-3">
      <ChartContainer config={CHART_CONFIG} className="aspect-square w-full">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name, item) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-[2px]"
                        style={{ background: item.payload?.fill }}
                      />
                      {name}
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {currency.format(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Pie
            data={segments}
            dataKey="value"
            nameKey="name"
            innerRadius={78}
            strokeWidth={2}
            isAnimationActive={false}
            paddingAngle={segments.length > 1 ? 2 : 0}
          >
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox)) return null;
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) - 16}
                      className="fill-muted-foreground text-xs"
                    >
                      {caption}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 10}
                      className={`text-xl font-bold ${amountClass}`}
                    >
                      {currency.format(balance)}
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <p
        className={`text-sm ${overBudget ? "text-destructive" : "text-muted-foreground"}`}
      >
        {percentText}
      </p>
    </div>
  );
}
