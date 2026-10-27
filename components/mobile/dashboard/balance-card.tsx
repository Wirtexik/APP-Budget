"use client";

import { useId } from "react";
import { Area, AreaChart, YAxis } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { BalancePoint } from "@/lib/balance-series";
import { currency } from "@/lib/budget";
import { cn } from "@/lib/utils";

const CHART_CONFIG = {
  balance: { label: "Saldo", color: "var(--primary)" },
} satisfies ChartConfig;

// Karta salda (wg styl-kokpit.jpg): „szkło”, kwota w kolorze głównym i wykres
// salda dzień po dniu bez osi. Wykres tylko, gdy są co najmniej dwa dni.
export function BalanceCard({
  balance,
  series,
  loading,
}: {
  balance: number;
  series: BalancePoint[];
  loading: boolean;
}) {
  const gradientId = `balance-fill-${useId().replace(/:/g, "")}`;

  return (
    <section
      aria-label="Saldo"
      className="overflow-hidden rounded-3xl border border-glass-border bg-glass shadow-(--shadow-soft) backdrop-blur-xl"
    >
      <div className="px-6 pt-5 pb-2 text-center">
        <p className="text-sm font-medium text-muted-foreground">Saldo</p>
        <p
          className={cn(
            "mt-1 text-4xl font-bold tracking-tight tabular-nums",
            balance < 0 ? "text-destructive" : "text-primary"
          )}
        >
          {loading ? "…" : currency.format(balance)}
        </p>
      </div>

      {series.length > 1 ? (
        <ChartContainer
          config={CHART_CONFIG}
          aria-hidden
          className="aspect-auto h-20 w-full"
          initialDimension={{ width: 320, height: 80 }}
        >
          <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-balance)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-balance)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Area
              dataKey="balance"
              type="monotone"
              baseValue="dataMin"
              stroke="var(--color-balance)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <div className="h-4" />
      )}
    </section>
  );
}
