"use client";

import type { FormEvent } from "react";

import { Segmented } from "@/components/mobile/segmented";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { TYPE_ITEMS, type Category } from "@/lib/budget";
import { useCategoryForm } from "@/lib/hooks/use-category-actions";

// Dodanie albo edycja własnej kategorii w panelu z dołu („Więcej”).
// `category === null` – nowa. Rodzic zmienia `key` przy każdym otwarciu,
// więc pola startują od nowa.
export function CategoryDrawer({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}) {
  const { name, setName, type, setType, error, saving, submit } = useCategoryForm(category);
  const typeChanged = category !== null && type !== category.type;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (await submit()) onOpenChange(false);
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next);
      }}
    >
      <DrawerContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DrawerHeader className="text-left">
            <DrawerTitle>{category ? "Edytuj kategorię" : "Nowa kategoria"}</DrawerTitle>
          </DrawerHeader>

          <Input
            aria-label="Nazwa kategorii"
            placeholder="Nazwa kategorii"
            autoFocus={!category}
            enterKeyHint="done"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            className="h-12 rounded-xl px-4 text-base"
          />

          <Segmented
            label="Typ kategorii"
            options={TYPE_ITEMS}
            value={type}
            onChange={setType}
          />

          {typeChanged && (
            <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              Zmiana typu obejmie też zapisane już transakcje tej kategorii – wydatki
              i przychody liczą się po typie kategorii.
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DrawerFooter className="flex-row">
            <DrawerClose
              render={
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12 flex-1 rounded-2xl text-base font-semibold"
                />
              }
              disabled={saving}
            >
              Anuluj
            </DrawerClose>
            <Button
              type="submit"
              disabled={saving || !name.trim()}
              className="h-12 flex-1 rounded-2xl text-base font-semibold"
            >
              {saving ? "Zapisywanie…" : category ? "Zapisz" : "Dodaj"}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
