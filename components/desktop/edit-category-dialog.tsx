"use client";

import { useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TYPE_ITEMS, type Category, type CategoryType } from "@/lib/budget";
import { useBudgetData } from "@/lib/hooks/budget-data";
import { updateCategory } from "@/lib/queries";

// Okno edycji własnej kategorii: nazwa i typ. `category === null` oznacza „zamknięte”.
export function EditCategoryDialog({
  category,
  onClose,
}: {
  category: Category | null;
  onClose: () => void;
}) {
  const { userId, refresh: onSaved } = useBudgetData();
  // `key` na wywołaniu w rodzicu resetuje ten stan przy każdym nowym otwarciu.
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<CategoryType>(category?.type ?? "wydatek");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (saving) return;
    setError(null);
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!category) return;
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Podaj nazwę kategorii.");
      return;
    }

    setSaving(true);
    const failure = await updateCategory(userId, category.id, {
      name: trimmed,
      type,
    });
    setSaving(false);

    if (failure) {
      setError(failure);
      return;
    }

    await onSaved();
    onClose();
  }

  return (
    <Dialog
      open={category !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4 text-muted-foreground" />
              Edytuj kategorię
            </DialogTitle>
            <DialogDescription>
              Zmień nazwę lub typ kategorii „{category?.name}”.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-category-name">Nazwa</Label>
            <Input
              id="edit-category-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-category-type">Typ</Label>
            <Select
              items={TYPE_ITEMS}
              value={type}
              onValueChange={(v) => v && setType(v as CategoryType)}
              disabled={saving}
            >
              <SelectTrigger id="edit-category-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Zmiana typu przełoży się też na już zapisane transakcje tej
              kategorii – wydatki i przychody liczą się właśnie po typie
              kategorii.
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={close}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Zapisywanie…" : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
