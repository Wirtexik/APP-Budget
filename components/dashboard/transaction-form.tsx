"use client";

import { useState, type FormEvent } from "react";
import { ReceiptText } from "lucide-react";

import { CategorySelect } from "@/components/dashboard/category-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dateKey, parseAmount, type Category, type Id } from "@/lib/budget";
import { insertTransaction, resolveCategory } from "@/lib/queries";

// Główny formularz służy wyłącznie do wydatków (przychody: przycisk „+” na karcie).
export function TransactionForm({
  userId,
  categories,
  onSaved,
}: {
  userId: string;
  categories: Category[];
  onSaved: (date?: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => dateKey(new Date()));
  const [description, setDescription] = useState("");
  const [categoryValue, setCategoryValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    setAmount("");
    setDescription("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="size-4 text-muted-foreground" />
          Nowa transakcja
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tx-amount">Kwota (zł)</Label>
              <Input
                id="tx-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={saving}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tx-date">Data</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={saving}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tx-category">Kategoria</Label>
            <CategorySelect
              id="tx-category"
              type="wydatek"
              categories={categories}
              value={categoryValue}
              onChange={setCategoryValue}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tx-description">Opis</Label>
            <Input
              id="tx-description"
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

          <Button type="submit" disabled={saving}>
            {saving ? "Zapisywanie…" : "Dodaj transakcję"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
