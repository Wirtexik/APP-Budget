"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronRight, Hammer } from "lucide-react";

import { currency } from "@/lib/budget";
import { longDate, piggyBankMeta, type BrokenPiggyBank } from "@/lib/piggy-bank";

const LIST_CARD = "overflow-hidden rounded-2xl bg-card shadow-(--shadow-soft)";

// „Rozbite skarbonki (N)”: rozwijana lista, domyślnie zwinięta. Kwoty historii
// nie są ukrywane. Bez rozbić sekcji nie ma.
export function PiggyBankHistory({
  history,
  today,
}: {
  history: BrokenPiggyBank[];
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  if (!history.length) return null;

  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className={`${LIST_CARD} flex min-h-13 w-full items-center justify-between px-4 font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50`}
      >
        <span>
          Rozbite skarbonki{" "}
          <span className="font-medium text-muted-foreground">({history.length})</span>
        </span>
        <Chevron aria-hidden className="size-5 text-muted-foreground" />
      </button>

      {open && (
        <ul id={listId} className={`${LIST_CARD} divide-y divide-border/60`}>
          {history.map((piggy) => (
            <li key={piggy.id} className="flex items-center gap-3 px-4 py-3">
              <span
                aria-hidden
                className="flex size-10.5 shrink-0 items-center justify-center rounded-full bg-income/15 text-income-strong dark:text-income"
              >
                <Hammer className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{longDate(piggy.date, today, true)}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {piggyBankMeta(piggy, today, true) ?? "bez wrzuceń"}
                </span>
              </span>
              <span className="font-semibold whitespace-nowrap text-income-strong tabular-nums dark:text-income">
                +{currency.format(piggy.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
