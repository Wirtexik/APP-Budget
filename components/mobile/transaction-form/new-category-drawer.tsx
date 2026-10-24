"use client";

import { useState, type FormEvent } from "react";

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
import { TYPE_LABEL, type CategoryType } from "@/lib/budget";
import { existingCategoryValue, userValue } from "@/lib/categories";
import { useBudgetData } from "@/lib/hooks/budget-data";
import { insertCategory } from "@/lib/queries";

// Szybkie dodanie kategorii z formularza transakcji (ekran 6 makiety). Typ
// wynika z przełącznika formularza. Nazwa istniejącej kategorii (także
// domyślnej) nie tworzy duplikatu – kategoria zostaje po prostu zaznaczona.
export function NewCategoryDrawer({
  open,
  onOpenChange,
  type,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: CategoryType;
  /** Wartość kategorii (jak w selekcie) do zaznaczenia. */
  onCreated: (value: string) => void;
}) {
  const { userId, categories, refresh } = useBudgetData();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Każde otwarcie zaczyna od pustego pola.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName("");
      setError(null);
    }
  }

  function finish(value: string) {
    onCreated(value);
    onOpenChange(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const existing = existingCategoryValue(categories, { name, type });
    if (existing) {
      finish(existing);
      return;
    }

    setSaving(true);
    const created = await insertCategory(userId, { name, type });
    if (created.error !== null) {
      setSaving(false);
      setError(created.error);
      return;
    }
    await refresh();
    setSaving(false);
    finish(userValue({ id: created.id, name: name.trim(), type }));
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
            <DrawerTitle>Nowa kategoria</DrawerTitle>
          </DrawerHeader>

          <Input
            aria-label="Nazwa kategorii"
            placeholder="Nazwa kategorii"
            autoFocus
            enterKeyHint="done"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            className="h-12 rounded-xl px-4 text-base"
          />
          <p className="w-max rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
            Typ: <span className="font-semibold text-foreground">{TYPE_LABEL[type]}</span>
          </p>

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
              {saving ? "Dodawanie…" : "Dodaj"}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
