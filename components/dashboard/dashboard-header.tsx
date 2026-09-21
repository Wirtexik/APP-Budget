"use client";

import { CalendarDays, LogOut, PiggyBank } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTH_ITEMS, YEAR_ITEMS } from "@/lib/budget";

export interface Period {
  year: number;
  /** Numer miesiąca liczony od 0 (styczeń = 0). */
  month: number;
}

// Nagłówek: nazwa aplikacji, globalny filtr miesiąca i roku oraz wylogowanie.
export function DashboardHeader({
  login,
  period,
  onPeriodChange,
  onSignOut,
}: {
  login: string;
  period: Period;
  onPeriodChange: (period: Period) => void;
  onSignOut: () => void;
}) {
  const { year, month } = period;

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-emerald-500 text-white shadow-sm">
          <PiggyBank className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budżet</h1>
          <p className="text-sm text-muted-foreground">
            Zalogowano jako {login}
          </p>
        </div>
      </div>

      <div className="order-last flex w-full items-center gap-2 sm:order-none sm:w-auto">
        <CalendarDays className="hidden size-4 text-muted-foreground sm:block" />
        <Select
          items={MONTH_ITEMS}
          value={String(month)}
          onValueChange={(v) =>
            v !== null && onPeriodChange({ year, month: Number(v) })
          }
        >
          <SelectTrigger
            aria-label="Miesiąc"
            className="flex-1 bg-background sm:w-36 sm:flex-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={YEAR_ITEMS}
          value={String(year)}
          onValueChange={(v) =>
            v !== null && onPeriodChange({ year: Number(v), month })
          }
        >
          <SelectTrigger aria-label="Rok" className="w-24 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEAR_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={onSignOut} aria-label="Wyloguj">
        <LogOut />
        <span className="hidden sm:inline">Wyloguj</span>
      </Button>
    </header>
  );
}
