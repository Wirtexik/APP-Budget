"use client";

import type { FocusEvent } from "react";
import { Pencil, RefreshCw, Tag, Trash2 } from "lucide-react";

import { SignedAmount } from "@/components/shared/signed-amount";
import { currency, formatDate, type Category, type Transaction } from "@/lib/budget";
import { categoryStyle } from "@/lib/category-style";
import { useSwipeReveal } from "@/lib/hooks/use-swipe-reveal";
import { cn } from "@/lib/utils";

/** Szerokość jednego przycisku akcji. */
const ACTION_WIDTH = 72;

// Wiersz transakcji (ekran 2 makiety): dotknięcie otwiera edycję, przesunięcie
// w lewo odsłania „Edytuj” i „Usuń”. Akcje są zawsze w DOM, więc działają też
// z klawiatury i czytnika ekranu – fokus na nich odsłania wiersz. Bez `onEdit`
// (wpis rozbicia skarbonki) zostaje samo „Usuń”, także pod dotknięciem.
export function SwipeRow({
  transaction,
  category,
  showDate = false,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  category: Category | undefined;
  /** Data w drugiej linii – na liście bez nagłówków dni (sortowanie po kwocie). */
  showDate?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete: () => void;
}) {
  const actionsWidth = ACTION_WIDTH * (onEdit ? 2 : 1);
  const { offset, dragging, handlers } = useSwipeReveal({
    open,
    onOpenChange,
    actionsWidth,
  });
  const { icon: Icon, color } = category
    ? categoryStyle(category)
    : { icon: Tag, color: "#94A3B8" };
  const name = category?.name ?? "Bez kategorii";
  const label = `${name}, ${currency.format(Number(transaction.amount))}`;
  const subtitle = [transaction.description, showDate && formatDate(transaction.date)]
    .filter(Boolean)
    .join(" · ");

  function handleBlur(event: FocusEvent<HTMLLIElement>) {
    if (open && !event.currentTarget.contains(event.relatedTarget)) onOpenChange(false);
  }

  function act(action: () => void) {
    onOpenChange(false);
    action();
  }

  return (
    <li data-swipe-id={transaction.id} onBlur={handleBlur} className="relative overflow-hidden">
      <button
        type="button"
        aria-label={`${onEdit ? "Edytuj" : "Usuń"}: ${label}${transaction.description ? `, ${transaction.description}` : ""}`}
        {...handlers}
        onClick={onEdit ?? onDelete}
        style={{ transform: `translateX(${offset}px)` }}
        className={cn(
          "relative z-10 flex w-full touch-pan-y items-center gap-3 bg-card px-4 py-3 text-left outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset",
          !dragging && "transition-transform duration-200 ease-out"
        )}
      >
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}26`, color }}
        >
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{name}</span>
          {subtitle && (
            <span className="block truncate text-sm text-muted-foreground">{subtitle}</span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <SignedAmount
            amount={transaction.amount}
            category={category}
            className="font-semibold"
          />
          {transaction.recurring_rule_id && (
            <RefreshCw aria-label="Ze zlecenia stałego" className="size-3 text-muted-foreground" />
          )}
        </span>
      </button>

      <div className="absolute inset-y-0 right-0 flex" style={{ width: actionsWidth }}>
        {onEdit && (
          <button
            type="button"
            aria-label={`Edytuj: ${label}`}
            onFocus={() => onOpenChange(true)}
            onClick={() => act(onEdit)}
            className="flex flex-1 flex-col items-center justify-center gap-1 bg-primary text-xs font-medium text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
          >
            <Pencil className="size-4.5" />
            Edytuj
          </button>
        )}
        <button
          type="button"
          aria-label={`Usuń: ${label}`}
          onFocus={() => onOpenChange(true)}
          onClick={() => act(onDelete)}
          className="flex flex-1 flex-col items-center justify-center gap-1 bg-destructive text-xs font-medium text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
        >
          <Trash2 className="size-4.5" />
          Usuń
        </button>
      </div>
    </li>
  );
}
