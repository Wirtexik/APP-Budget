"use client";

import { useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";

import { CategorySelect } from "@/components/desktop/category-select";
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
import type { Transaction } from "@/lib/budget";
import { useTransactionForm } from "@/lib/hooks/use-transaction-form";

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
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
            onSavingChange={setSaving}
            onDone={() => onOpenChange(false)}
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
  onSavingChange,
  onDone,
}: {
  transaction: Transaction;
  onSavingChange: (saving: boolean) => void;
  onDone: () => void;
}) {
  const {
    amount,
    setAmount,
    date,
    setDate,
    description,
    setDescription,
    categoryValue,
    setCategoryValue,
    type,
    categories,
    error,
    saving,
    handleSubmit: submit,
  } = useTransactionForm({ kind: "edit", transaction });

  // Okno nie da się zamknąć w trakcie zapisu.
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    onSavingChange(true);
    const saved = await submit(e);
    onSavingChange(false);
    if (saved) onDone();
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
