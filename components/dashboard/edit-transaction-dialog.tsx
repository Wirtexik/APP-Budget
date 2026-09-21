"use client";

import { useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";

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
import {
  parseAmount,
  type Category,
  type CategoryType,
  type Id,
  type Transaction,
} from "@/lib/budget";
import { valueForCategory } from "@/lib/categories";
import { resolveCategory, updateTransaction, type Resolved } from "@/lib/queries";

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  userId,
  categories,
  categoryById,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  userId: string;
  categories: Category[];
  categoryById: Map<string, Category>;
  onSaved: (date?: string) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next);
      }}
    >
      <DialogContent>
        {transaction && (
          <EditTransactionForm
            transaction={transaction}
            category={categoryById.get(String(transaction.category_id))}
            userId={userId}
            categories={categories}
            onSavingChange={setSaving}
            onDone={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Edycja zachowuje typ wpisu: lista kategorii jest ograniczona do typu obecnej kategorii,
// więc wydatek zostaje wydatkiem, a przychód przychodem.
function EditTransactionForm({
  transaction,
  category,
  userId,
  categories,
  onSavingChange,
  onDone,
  onSaved,
}: {
  transaction: Transaction;
  category: Category | undefined;
  userId: string;
  categories: Category[];
  onSavingChange: (saving: boolean) => void;
  onDone: () => void;
  onSaved: (date?: string) => Promise<void>;
}) {
  const type: CategoryType = category?.type ?? "wydatek";

  const [initialCategoryValue] = useState(() =>
    category ? valueForCategory(category) : null
  );
  const [amount, setAmount] = useState(() => String(transaction.amount));
  const [date, setDate] = useState(() => transaction.date.slice(0, 10));
  const [categoryValue, setCategoryValue] = useState<string | null>(
    initialCategoryValue
  );
  const [description, setDescription] = useState(
    () => transaction.description ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function setBusy(busy: boolean) {
    setSaving(busy);
    onSavingChange(busy);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const value = parseAmount(amount);
    if (value === null) {
      setError("Podaj kwotę większą od zera.");
      return;
    }

    if (!categoryValue) {
      setError("Wybierz kategorię.");
      return;
    }

    setBusy(true);

    // Gdy kategoria nie została zmieniona, zostaje dotychczasowy `category_id`
    // (nazwa domyślnej kategorii mogłaby wskazywać inny, zdublowany wiersz).
    const keepCategory =
      categoryValue === initialCategoryValue && transaction.category_id != null;
    const resolved: Resolved = keepCategory
      ? { id: transaction.category_id, error: null }
      : await resolveCategory(userId, categories, categoryValue);

    const failure =
      resolved.error ??
      (await updateTransaction(userId, transaction.id, {
        amount: value,
        date,
        description,
        categoryId: resolved.id as Id,
      }));

    if (failure) {
      setBusy(false);
      setError(failure);
      return;
    }

    await onSaved(date);
    setBusy(false);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Pencil className="size-4 text-muted-foreground" />
          Edytuj transakcję
        </DialogTitle>
        <DialogDescription>Zmień dane wpisu i zapisz.</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-amount">Kwota (zł)</Label>
          <Input
            id="edit-amount"
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
          <Label htmlFor="edit-date">Data</Label>
          <Input
            id="edit-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={saving}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-category">Kategoria</Label>
        <CategorySelect
          id="edit-category"
          type={type}
          categories={categories}
          value={categoryValue}
          onChange={setCategoryValue}
          disabled={saving}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-description">Opis</Label>
        <Input
          id="edit-description"
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
          onClick={onDone}
        >
          Anuluj
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Zapisywanie…" : "Zapisz zmiany"}
        </Button>
      </DialogFooter>
    </form>
  );
}
