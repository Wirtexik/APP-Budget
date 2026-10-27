"use client";

import { useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, CategoryType } from "@/lib/budget";
import { buildCategoryOptions } from "@/lib/categories";

// Select kategorii jednego typu: najpierw domyślne, pod nimi te dodane przez użytkownika.
export function CategorySelect({
  id,
  type,
  categories,
  value,
  onChange,
  disabled,
}: {
  id: string;
  type: CategoryType;
  categories: Category[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) {
  const options = useMemo(
    () => buildCategoryOptions(categories, type),
    [categories, type]
  );
  const items = useMemo(
    () => [...options.defaults, ...options.own],
    [options]
  );

  return (
    <Select
      items={items}
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Wybierz kategorię" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Domyślne</SelectLabel>
          {options.defaults.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
        {options.own.length > 0 && (
          <SelectGroup>
            <SelectLabel>Twoje kategorie</SelectLabel>
            {options.own.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
}
