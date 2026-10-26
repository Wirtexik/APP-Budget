"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Search, SearchX, SlidersHorizontal, X } from "lucide-react";

import { FiltersDrawer } from "@/components/mobile/history/filters-drawer";
import { MobileTransactionList } from "@/components/mobile/transactions/mobile-transaction-list";
import { Button } from "@/components/ui/button";
import type { Id } from "@/lib/budget";
import {
  EMPTY_FILTERS,
  drawerFilterCount,
  filterTransactions,
  hasActiveFilters,
  sanitizeFilters,
  type HistoryFilters,
} from "@/lib/filters";
import { useBudgetData } from "@/lib/hooks/budget-data";

// Historia (ekrany 2 i 3 makiety): wyszukiwarka, panel filtrów i lista wpisów
// miesiąca. Filtry są w URL (te same co na desktopie), więc przechodzą między
// wersjami i zostają po odświeżeniu.
export function MobileHistory({
  filters: urlFilters,
  onFiltersChange,
  onEdit,
}: {
  filters: HistoryFilters;
  onFiltersChange: (filters: HistoryFilters) => void;
  onEdit: (id: Id) => void;
}) {
  const { monthTransactions, categoryById, loading } = useBudgetData();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filters = useMemo(
    () => sanitizeFilters(urlFilters, categoryById),
    [urlFilters, categoryById]
  );
  const visible = useMemo(
    () => filterTransactions(monthTransactions, categoryById, filters),
    [monthTransactions, categoryById, filters]
  );
  const badge = drawerFilterCount(filters);

  let content: ReactNode;
  if (visible.length > 0) {
    content = (
      <MobileTransactionList
        transactions={visible}
        grouped={!filters.sort?.startsWith("amount")}
        onEdit={onEdit}
      />
    );
  } else if (loading) {
    content = null;
  } else if (monthTransactions.length === 0) {
    content = <EmptyState title="Brak transakcji w tym miesiącu." />;
  } else {
    content = (
      <EmptyState title="Brak transakcji" description="Brak transakcji pasujących do filtrów.">
        <Button
          variant="secondary"
          onClick={() => onFiltersChange(EMPTY_FILTERS)}
          className="h-11 rounded-2xl px-5 font-semibold"
        >
          Wyczyść filtry
        </Button>
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pt-1">
      <div className="flex gap-2">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-xl bg-card px-3 text-muted-foreground shadow-(--shadow-soft) focus-within:ring-3 focus-within:ring-ring/50">
          <Search aria-hidden className="size-5 shrink-0" />
          <input
            type="search"
            enterKeyHint="search"
            aria-label="Szukaj w opisie i kategorii"
            placeholder="Szukaj w opisie i kategorii"
            value={filters.query}
            onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
            className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.query && (
            <button
              type="button"
              aria-label="Wyczyść wyszukiwanie"
              onClick={() => onFiltersChange({ ...filters, query: "" })}
              className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-4" />
            </button>
          )}
        </label>

        <button
          type="button"
          aria-label={badge > 0 ? `Filtry, aktywne: ${badge}` : "Filtry"}
          onClick={() => setDrawerOpen(true)}
          className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-(--shadow-soft) outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <SlidersHorizontal className="size-5" />
          {badge > 0 && (
            <span
              aria-hidden
              className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground ring-2 ring-background"
            >
              {badge}
            </span>
          )}
        </button>
      </div>

      {/* Zawsze w DOM, żeby czytnik ekranu ogłaszał zmianę liczby wyników. */}
      <p className="sr-only" role="status">
        {hasActiveFilters(filters) && !loading ? `Wyniki: ${visible.length}` : ""}
      </p>

      {content}

      <FiltersDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        filters={filters}
        onChange={onFiltersChange}
        resultCount={visible.length}
      />
    </div>
  );
}

function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
      {description && (
        <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <SearchX className="size-6" />
        </span>
      )}
      <p className={description ? "font-semibold" : "text-sm text-muted-foreground"}>{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
