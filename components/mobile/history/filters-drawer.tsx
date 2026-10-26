"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";

import { Segmented, type SegmentedOption } from "@/components/mobile/segmented";
import { ToggleSwitch } from "@/components/mobile/toggle-switch";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { plural, type CategoryType } from "@/lib/budget";
import { categoryStyle } from "@/lib/category-style";
import {
  categoryGroups,
  clearDrawerFilters,
  drawerFilterCount,
  toggleCategory,
  withType,
  type HistoryFilters,
  type SortKey,
} from "@/lib/filters";
import { useBudgetData } from "@/lib/hooks/budget-data";
import { cn } from "@/lib/utils";

type TypeChoice = CategoryType | "wszystkie";

const TYPE_OPTIONS: SegmentedOption<TypeChoice>[] = [
  { value: "wszystkie", label: "Wszystkie" },
  { value: "przychod", label: "Uznania" },
  { value: "wydatek", label: "Obciążenia" },
];
const DATE_SORT: SegmentedOption<SortKey>[] = [
  { value: "date_desc", label: "Najnowsze" },
  { value: "date_asc", label: "Najstarsze" },
];
const AMOUNT_SORT: SegmentedOption<SortKey>[] = [
  { value: "amount_asc", label: "Rosnąco" },
  { value: "amount_desc", label: "Malejąco" },
];

const SECTION_TITLE = "mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase";

// Panel filtrów Historii (ekran 3 makiety). Zmiany działają na żywo (od razu
// w URL i na liście), „Pokaż N wyników” tylko zamyka panel.
export function FiltersDrawer({
  open,
  onOpenChange,
  filters,
  onChange,
  resultCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: HistoryFilters;
  onChange: (filters: HistoryFilters) => void;
  resultCount: number;
}) {
  const { categories, categoryById } = useBudgetData();
  const groups = useMemo(
    () => categoryGroups(categories, filters.type),
    [categories, filters.type]
  );
  const sort = filters.sort ?? "date_desc";

  // Kolejność domyślna („Najnowsze”) nie trafia do URL.
  const setSort = (value: SortKey) =>
    onChange({ ...filters, sort: value === "date_desc" ? null : value });

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-2xl font-bold">Filtry</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-6">
          <section>
            <h3 className={SECTION_TITLE}>Typ</h3>
            <Segmented
              label="Typ"
              options={TYPE_OPTIONS}
              value={filters.type ?? "wszystkie"}
              onChange={(value) =>
                onChange(withType(filters, value === "wszystkie" ? null : value, categoryById))
              }
            />
            <ToggleSwitch
              checked={filters.recurring}
              onChange={(recurring) => onChange({ ...filters, recurring })}
              className="mt-3 w-full text-base font-medium"
            >
              Tylko zlecenia stałe
            </ToggleSwitch>
          </section>

          {groups.map((group) => (
            <section key={group.type}>
              <h3 className={SECTION_TITLE}>{group.label}</h3>
              <div role="group" aria-label={group.label} className="flex flex-wrap gap-2">
                {group.categories.map((category) => {
                  const { icon: Icon, color } = categoryStyle(category);
                  const selected = filters.categoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        onChange({
                          ...filters,
                          categoryIds: toggleCategory(filters.categoryIds, category.id),
                        })
                      }
                      className={cn(
                        "flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                        selected
                          ? "bg-accent text-accent-foreground ring-1 ring-primary/40"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon aria-hidden className="size-4" style={{ color }} />
                      {category.name}
                      {selected && <Check aria-hidden className="size-3.5" />}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          <section>
            <h3 className={SECTION_TITLE}>Sortuj</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <span className="w-12 text-sm text-muted-foreground">Data</span>
                <Segmented
                  label="Sortuj po dacie"
                  options={DATE_SORT}
                  value={sort.startsWith("date") ? sort : null}
                  onChange={setSort}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-12 text-sm text-muted-foreground">Kwota</span>
                <Segmented
                  label="Sortuj po kwocie"
                  options={AMOUNT_SORT}
                  value={sort.startsWith("amount") ? sort : null}
                  onChange={setSort}
                  className="flex-1"
                />
              </div>
            </div>
          </section>
        </div>

        <DrawerFooter className="pt-2">
          <Button
            onClick={() => onOpenChange(false)}
            className="h-12 rounded-2xl bg-(image:--gradient-primary) text-base font-semibold"
          >
            {resultCount === 0
              ? "Brak wyników"
              : `Pokaż ${resultCount} ${plural(resultCount, "wynik", "wyniki", "wyników")}`}
          </Button>
          <Button
            variant="ghost"
            disabled={drawerFilterCount(filters) === 0}
            onClick={() => onChange(clearDrawerFilters(filters))}
            className="h-11 rounded-2xl text-base font-semibold text-primary"
          >
            Wyczyść wszystko
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
