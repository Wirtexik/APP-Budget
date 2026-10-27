"use client";

import { Pause, Pencil, Play, Trash2 } from "lucide-react";

import { SignedAmount } from "@/components/shared/signed-amount";
import { Button } from "@/components/ui/button";
import { formatDate, type Category, type Id } from "@/lib/budget";
import {
  STATUS_LABEL,
  describeSchedule,
  ruleStatus,
  type RecurringRule,
  type RuleStatus,
} from "@/lib/recurring";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<RuleStatus, string> = {
  active:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  paused:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  finished: "border-border bg-muted text-muted-foreground",
};

// Lista zleceń jako karty – czytelniejsze od tabeli na wąskim ekranie.
export function RecurringRulesList({
  rules,
  categoryById,
  loading,
  busyId,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  rules: RecurringRule[];
  categoryById: Map<string, Category>;
  loading: boolean;
  busyId: Id | null;
  onEdit: (rule: RecurringRule) => void;
  onToggleActive: (rule: RecurringRule) => void;
  onDelete: (rule: RecurringRule) => void;
}) {
  if (rules.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {loading
          ? "Ładowanie…"
          : "Nie masz jeszcze zleceń stałych. Dodaj pierwsze, np. czynsz albo wypłatę."}
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y">
      {rules.map((rule) => {
        const category = categoryById.get(rule.category_id);
        const status = ruleStatus(rule);
        const busy = busyId === rule.id;

        return (
          <li
            key={rule.id}
            className={cn(
              "flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4",
              status === "finished" && "opacity-70"
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate font-medium">
                    {rule.description || category?.name || "Zlecenie"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs font-medium",
                      STATUS_STYLE[status]
                    )}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </div>
                <SignedAmount
                  amount={rule.amount}
                  category={category}
                  className="font-medium sm:hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {category?.name ?? "—"} · {describeSchedule(rule)}
              </p>
              <p className="text-xs text-muted-foreground">
                {rule.next_run_date
                  ? `Następne wykonanie: ${formatDate(rule.next_run_date)}${
                      status === "paused" ? " (po wznowieniu)" : ""
                    }`
                  : `Wykonano ${rule.occurrences_count} ${
                      rule.occurrences_count === 1 ? "raz" : "razy"
                    }`}
              </p>
            </div>

            <SignedAmount
              amount={rule.amount}
              category={category}
              className="hidden font-medium sm:inline"
            />

            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edytuj zlecenie"
                title="Edytuj"
                className="text-muted-foreground hover:text-foreground"
                disabled={busy}
                onClick={() => onEdit(rule)}
              >
                <Pencil />
              </Button>
              {status !== "finished" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={rule.is_active ? "Wstrzymaj zlecenie" : "Wznów zlecenie"}
                  title={rule.is_active ? "Wstrzymaj" : "Wznów"}
                  className="text-muted-foreground hover:text-foreground"
                  disabled={busy}
                  onClick={() => onToggleActive(rule)}
                >
                  {rule.is_active ? <Pause /> : <Play />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Usuń zlecenie"
                title="Usuń"
                className="text-muted-foreground hover:text-destructive"
                disabled={busy}
                onClick={() => onDelete(rule)}
              >
                <Trash2 />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
