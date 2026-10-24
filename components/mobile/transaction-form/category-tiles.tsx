"use client";

import { useMemo, type CSSProperties } from "react";
import { Plus } from "lucide-react";

import type { Category, CategoryType } from "@/lib/budget";
import { buildCategoryOptions } from "@/lib/categories";
import { categoryStyle } from "@/lib/category-style";
import { cn } from "@/lib/utils";

const TILE =
  "flex min-h-11 flex-col items-center gap-1.5 rounded-2xl py-1 text-[11px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50";

// Kategorie jednego typu jako kafelki z ikoną i kolorem (najpierw domyślne,
// potem własne), na końcu „+ Nowa”.
export function CategoryTiles({
  type,
  categories,
  value,
  onChange,
  onAddNew,
  disabled,
}: {
  type: CategoryType;
  categories: Category[];
  value: string | null;
  onChange: (value: string) => void;
  onAddNew: () => void;
  disabled?: boolean;
}) {
  const options = useMemo(() => {
    const { defaults, own } = buildCategoryOptions(categories, type);
    return [...defaults, ...own];
  }, [categories, type]);

  return (
    <div role="group" aria-label="Kategoria" className="grid grid-cols-4 gap-x-2 gap-y-4">
      {options.map((option) => {
        const { icon: Icon, color } = categoryStyle({ name: option.label, type });
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(TILE, selected ? "text-foreground" : "text-muted-foreground")}
          >
            <span
              className={cn(
                "flex size-14 items-center justify-center rounded-full transition-colors",
                selected && "ring-2 ring-(--tile-color) ring-offset-2 ring-offset-background"
              )}
              style={
                {
                  "--tile-color": color,
                  backgroundColor: selected ? color : `${color}26`,
                  color: selected ? "#ffffff" : color,
                } as CSSProperties
              }
            >
              <Icon className="size-6" />
            </span>
            <span className="line-clamp-2 text-center break-words">{option.label}</span>
          </button>
        );
      })}

      <button
        type="button"
        disabled={disabled}
        onClick={onAddNew}
        className={cn(TILE, "text-muted-foreground")}
      >
        <span className="flex size-14 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 bg-muted">
          <Plus className="size-6" />
        </span>
        Nowa
      </button>
    </div>
  );
}
