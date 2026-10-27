"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PeriodDrawer } from "@/components/mobile/period-drawer";
import { Button } from "@/components/ui/button";
import { periodLabel, shiftPeriod, type Period } from "@/lib/budget";

// Nagłówek wersji mobilnej: „‹ miesiąc rok ›” (dotknięcie nazwy otwiera panel
// okresu), awatar otwierający „Więcej” i duży tytuł widoku.
export function MobileHeader({
  title,
  login,
  period,
  onPeriodChange,
  onOpenMore,
}: {
  title: string;
  login: string;
  period: Period;
  onPeriodChange: (period: Period) => void;
  onOpenMore: () => void;
}) {
  const [periodOpen, setPeriodOpen] = useState(false);
  const previous = shiftPeriod(period, -1);
  const next = shiftPeriod(period, 1);

  return (
    <header className="sticky top-0 z-30 bg-background/80 px-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="size-11"
            aria-label="Poprzedni miesiąc"
            disabled={!previous}
            onClick={() => previous && onPeriodChange(previous)}
          >
            <ChevronLeft className="size-6" />
          </Button>
          <button
            type="button"
            onClick={() => setPeriodOpen(true)}
            aria-label={`Okres: ${periodLabel(period)}. Zmień`}
            className="min-h-11 rounded-xl px-1 text-base font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:opacity-70"
          >
            {periodLabel(period)}
          </button>
          <Button
            variant="ghost"
            className="size-11"
            aria-label="Następny miesiąc"
            disabled={!next}
            onClick={() => next && onPeriodChange(next)}
          >
            <ChevronRight className="size-6" />
          </Button>
        </div>

        <button
          type="button"
          onClick={onOpenMore}
          aria-label="Więcej"
          className="mr-2 flex size-11 items-center justify-center rounded-full bg-(image:--gradient-primary) text-base font-semibold text-primary-foreground uppercase shadow-[0_6px_16px_-6px_var(--glow)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {login.charAt(0) || "?"}
        </button>
      </div>

      <h1 className="px-2 pt-2 text-3xl font-bold tracking-tight">{title}</h1>

      <PeriodDrawer
        open={periodOpen}
        onOpenChange={setPeriodOpen}
        period={period}
        onSelect={onPeriodChange}
      />
    </header>
  );
}
