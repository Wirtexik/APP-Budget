"use client";

import { useMemo } from "react";
import {
  ArrowDownUp,
  CircleArrowDown,
  CircleArrowUp,
  ListFilter,
  Repeat,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Category, CategoryType } from "@/lib/budget";
import {
  EMPTY_FILTERS,
  SORT_OPTIONS,
  categoryGroups,
  hasActiveFilters,
  menuFilterCount,
  toggleCategory,
  withType,
  type HistoryFilters as Filters,
} from "@/lib/filters";

const TYPE_OPTIONS: {
  value: CategoryType;
  label: string;
  Icon: typeof CircleArrowUp;
}[] = [
  { value: "przychod", label: "Uznania", Icon: CircleArrowUp },
  { value: "wydatek", label: "Obciążenia", Icon: CircleArrowDown },
];

// Pasek Historii: wyszukiwarka (od pierwszej litery, początki wyrazów), menu
// „Filtry” (typ + wiele kategorii) i menu „Sortuj”. Odznaczenie wszystkiego
// wraca do widoku domyślnego.
export function HistoryFilters({
  value,
  onChange,
  categories,
  categoryById,
}: {
  value: Filters;
  onChange: (value: Filters) => void;
  categories: Category[];
  categoryById: Map<string, Category>;
}) {
  const groups = useMemo(
    () => categoryGroups(categories, value.type),
    [categories, value.type]
  );
  const filterCount = menuFilterCount(value);
  const sortLabel = SORT_OPTIONS.find((o) => o.value === value.sort)?.label;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative sm:max-w-xs sm:flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Szukaj transakcji"
          placeholder="Szukaj w opisie lub kategorii…"
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          className="pr-8 pl-8"
        />
        {value.query && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Wyczyść wyszukiwanie"
            title="Wyczyść wyszukiwanie"
            className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
            onClick={() => onChange({ ...value, query: "" })}
          >
            <X />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className={filterCount ? "border-blue-500/50" : undefined}
              />
            }
          >
            <ListFilter />
            Filtry
            {filterCount > 0 && (
              <span className="rounded-full bg-blue-600 px-1.5 text-xs leading-4 text-white tabular-nums">
                {filterCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-80 w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Typ</DropdownMenuLabel>
              {TYPE_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={value.type === opt.value}
                  onCheckedChange={(checked) =>
                    onChange(
                      withType(value, checked ? opt.value : null, categoryById)
                    )
                  }
                >
                  <opt.Icon className="text-muted-foreground" />
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuCheckboxItem
                // Zawsze boolean – `undefined` (np. stary stan po Fast Refresh)
                // zrobiłby z pola niekontrolowane i Base UI zgłasza ostrzeżenie.
                checked={value.recurring === true}
                onCheckedChange={(recurring) => onChange({ ...value, recurring })}
              >
                <Repeat className="text-muted-foreground" />
                Zlecenia stałe
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>

            {groups.map((g) => (
              <DropdownMenuGroup key={g.type}>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{g.label}</DropdownMenuLabel>
                {g.categories.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.id}
                    checked={value.categoryIds.includes(String(c.id))}
                    onCheckedChange={() =>
                      onChange({
                        ...value,
                        categoryIds: toggleCategory(value.categoryIds, c.id),
                      })
                    }
                  >
                    {c.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            ))}

            {filterCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    onChange({
                      ...value,
                      type: null,
                      recurring: false,
                      categoryIds: [],
                    })
                  }
                >
                  <X />
                  Wyczyść filtry
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className={value.sort ? "border-blue-500/50" : undefined}
              />
            }
          >
            <ArrowDownUp />
            {sortLabel ?? "Sortuj"}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Sortowanie</DropdownMenuLabel>
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  closeOnClick
                  checked={value.sort === opt.value}
                  onCheckedChange={(checked) =>
                    onChange({ ...value, sort: checked ? opt.value : null })
                  }
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters(value) && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            <X />
            Wyczyść wszystko
          </Button>
        )}
      </div>
    </div>
  );
}
