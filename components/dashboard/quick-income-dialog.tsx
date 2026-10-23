"use client";

import { useState } from "react";
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
import { useTransactionForm } from "@/lib/hooks/use-transaction-form";

export function QuickIncomeDialog() {
  const [open, setOpen] = useState(false);
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
    handleSubmit,
    reset,
  } = useTransactionForm({ kind: "create", type: "przychod" });

  function handleOpenChange(next: boolean) {
    if (saving) return;
    setOpen(next);
    if (!next) reset();
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
          // Data na dziś także wtedy, gdy aplikacja jest otwarta od wczoraj.
          reset();
          setOpen(true);
        }}
      >
        <Plus />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <form
            onSubmit={async (e) => {
              if (await handleSubmit(e)) setOpen(false);
            }}
            className="flex flex-col gap-4">
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
                type={type}
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
