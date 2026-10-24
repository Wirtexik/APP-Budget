"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  MONTH_NAMES,
  YEAR_ITEMS,
  currentPeriod,
  samePeriod,
  type Period,
} from "@/lib/budget";
import { cn } from "@/lib/utils";

const MONTH_SHORT = MONTH_NAMES.map((name) => name.slice(0, 3).toLowerCase());
const FIRST_YEAR = Number(YEAR_ITEMS[0].value);
const LAST_YEAR = Number(YEAR_ITEMS[YEAR_ITEMS.length - 1].value);

// Panel wyboru okresu (ekran 7 makiety): rok strzałkami, siatka 12 miesięcy,
// „Bieżący miesiąc”. Rok w panelu to stan lokalny – zmienia się dopiero okres
// po dotknięciu miesiąca.
export function PeriodDrawer({
  open,
  onOpenChange,
  period,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: Period;
  onSelect: (period: Period) => void;
}) {
  const [year, setYear] = useState(period.year);
  const today = currentPeriod();

  // Przy każdym otwarciu panel startuje od oglądanego roku.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setYear(period.year);
  }

  function select(next: Period) {
    onSelect(next);
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerTitle className="sr-only">Wybór okresu</DrawerTitle>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="size-11"
            aria-label="Poprzedni rok"
            disabled={year <= FIRST_YEAR}
            onClick={() => setYear(year - 1)}
          >
            <ChevronLeft className="size-6" />
          </Button>
          <span className="text-xl font-bold tabular-nums" aria-live="polite">
            {year}
          </span>
          <Button
            variant="ghost"
            className="size-11"
            aria-label="Następny rok"
            disabled={year >= LAST_YEAR}
            onClick={() => setYear(year + 1)}
          >
            <ChevronRight className="size-6" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {MONTH_SHORT.map((label, month) => {
            const candidate = { year, month };
            const selected = samePeriod(candidate, period);
            const isToday = samePeriod(candidate, today);
            return (
              <button
                key={label}
                type="button"
                aria-pressed={selected}
                aria-label={`${MONTH_NAMES[month]} ${year}`}
                onClick={() => select(candidate)}
                className={cn(
                  "h-12 rounded-xl text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "bg-(image:--gradient-primary) text-primary-foreground shadow-[0_8px_20px_-8px_var(--glow)]"
                    : isToday
                      ? "bg-accent text-accent-foreground ring-1 ring-primary/40"
                      : "bg-muted text-foreground active:bg-secondary"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <DrawerFooter>
          <Button
            variant="secondary"
            className="h-12 rounded-2xl text-base font-semibold"
            onClick={() => select(today)}
          >
            Bieżący miesiąc
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
