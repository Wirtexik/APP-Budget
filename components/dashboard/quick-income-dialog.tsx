"use client";

import { useState, type FormEvent } from "react";
import { Plus, TrendingUp } from "lucide-react";

import { CategorySelect } from "@/components/dashboard/category-select";
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
import { dateKey, parseAmount, type Category, type Id } from "@/lib/budget";
import { insertTransaction, resolveCategory } from "@/lib/queries";

export function QuickIncomeDialog({
  userId,
  categories,
  onSaved,
}: {
  userId: string;
  categories: Category[];
  onSaved: (date?: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  // Własna data tego okna – niezależna od formularza wydatków i od filtra
  // miesiąca u góry strony (ten służy tylko do filtrowania widoku).
  const [date, setDate] = useState(() => dateKey(new Date()));
  const [categoryValue, setCategoryValue] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setAmount("");
    setDate(dateKey(new Date()));
    setCategoryValue(null);
    setDescription("");
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (saving) return;
    setOpen(next);
    if (!next) reset();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const value = parseAmount(amount);
    if (value === null) {
      setError("Podaj kwotę większą od zera.");
      return;
    }

    if (!date) {
      setError("Podaj datę.");
      return;
    }

    if (!categoryValue) {
      setError("Wybierz kategorię.");
      return;
    }

    setSaving(true);

    const category = await resolveCategory(userId, categories, categoryValue);
    const failure =
      category.error ??
      (await insertTransaction(userId, category.id as Id, {
        amount: value,
        date,
        description,
      }));

    if (failure) {
      setSaving(false);
      setError(failure);
      return;
    }

    await onSaved(date);
    setSaving(false);
    setOpen(false);
    reset();
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Szybko dodaj przychód"
        title="Szybko dodaj przychód"
        className="rounded-full border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300"
        onClick={() => {
          setDate(dateKey(new Date()));
          setOpen(true);
        }}
      >
        <Plus />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-600" />
                Szybki przychód
              </DialogTitle>
              <DialogDescription>
                Domyślnie dzisiejsza data – możesz wybrać dowolną.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="quick-amount">Kwota (zł)</Label>
                <Input
                  id="quick-amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={saving}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="quick-date">Data</Label>
                <Input
                  id="quick-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={saving}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="quick-category">Kategoria</Label>
              <CategorySelect
                id="quick-category"
                type="przychod"
                categories={categories}
                value={categoryValue}
                onChange={setCategoryValue}
                disabled={saving}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="quick-description">Opis (opcjonalnie)</Label>
              <Input
                id="quick-description"
                maxLength={80}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
              />
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
                onClick={() => handleOpenChange(false)}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Zapisywanie…" : "Dodaj przychód"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
