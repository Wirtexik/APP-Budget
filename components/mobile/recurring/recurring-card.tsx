"use client";

import { Ellipsis, Tag } from "lucide-react";

import { ToggleSwitch } from "@/components/mobile/toggle-switch";
import { SignedAmount } from "@/components/shared/signed-amount";
import { formatDate, type Category } from "@/lib/budget";
import { categoryStyle } from "@/lib/category-style";
import {
  STATUS_LABEL,
  describeSchedule,
  ruleStatus,
  type RecurringRule,
  type RuleStatus,
} from "@/lib/recurring";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<RuleStatus, string> = {
  active: "bg-income/15 text-income-strong dark:text-income",
  paused: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  finished: "bg-muted text-muted-foreground",
};

export const ruleName = (rule: RecurringRule, category: Category | undefined) =>
  rule.description || category?.name || "Zlecenie";

// Karta zlecenia (ekran 9 makiety). Dotknięcie karty otwiera edycję; przełącznik
// wstrzymuje / wznawia (bez niego, gdy zlecenie się zakończyło), „⋯” otwiera
// panel z akcjami.
export function RecurringCard({
  rule,
  category,
  busy,
  onEdit,
  onToggleActive,
  onMore,
}: {
  rule: RecurringRule;
  category: Category | undefined;
  busy: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onMore: () => void;
}) {
  const status = ruleStatus(rule);
  const name = ruleName(rule, category);
  const { icon: Icon, color } = category
    ? categoryStyle(category)
    : { icon: Tag, color: "#94A3B8" };

  const next = rule.next_run_date
    ? `Nast. termin: ${formatDate(rule.next_run_date)}${status === "paused" ? " (po wznowieniu)" : ""}`
    : `Wykonano ${rule.occurrences_count} ${rule.occurrences_count === 1 ? "raz" : "razy"}`;

  return (
    <li
      className={cn(
        "relative rounded-3xl bg-card shadow-(--shadow-soft) transition-opacity",
        status !== "active" && "opacity-70"
      )}
    >
      <button
        type="button"
        aria-label={`Edytuj zlecenie: ${name}`}
        onClick={onEdit}
        className="block w-full rounded-3xl p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}26`, color }}
          >
            <Icon className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-lg font-bold">{name}</span>
            <span className="block truncate text-sm text-muted-foreground">
              {category?.name ?? "Bez kategorii"}
            </span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            <SignedAmount amount={rule.amount} category={category} className="font-bold" />
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium",
                STATUS_STYLE[status]
              )}
            >
              {STATUS_LABEL[status]}
            </span>
          </span>
        </span>
        {/* Prawy margines na przełącznik i „⋯” (leżą nad kartą, nie w przycisku). */}
        <span className="mt-4 block border-t border-border/60 pt-3 pr-28 text-sm">
          <span className="block font-medium">{describeSchedule(rule)}</span>
          <span className="block text-xs text-muted-foreground">{next}</span>
        </span>
      </button>

      <div className="absolute right-2 bottom-2 flex items-center">
        {status !== "finished" && (
          <ToggleSwitch
            checked={rule.is_active}
            onChange={onToggleActive}
            disabled={busy}
            label={rule.is_active ? `Wstrzymaj zlecenie: ${name}` : `Wznów zlecenie: ${name}`}
            className="px-1"
          />
        )}
        <button
          type="button"
          aria-label={`Więcej akcji: ${name}`}
          disabled={busy}
          onClick={onMore}
          className="flex size-11 items-center justify-center rounded-full text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Ellipsis className="size-5" />
        </button>
      </div>
    </li>
  );
}
