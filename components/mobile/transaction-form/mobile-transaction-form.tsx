"use client";

import { useId, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";

import { DeleteTransactionDrawer } from "@/components/mobile/delete-transaction-drawer";
import { FullScreen } from "@/components/mobile/full-screen";
import { AmountField } from "@/components/mobile/transaction-form/amount-field";
import { CategoryTiles } from "@/components/mobile/transaction-form/category-tiles";
import { NewCategoryDrawer } from "@/components/mobile/transaction-form/new-category-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AMOUNT_ERROR, TYPE_ITEMS, type Transaction } from "@/lib/budget";
import {
  useTransactionForm,
  type TransactionFormMode,
} from "@/lib/hooks/use-transaction-form";
import { cn } from "@/lib/utils";

// Formularz transakcji na pełnym ekranie (ekrany 4 i 5 makiety). Przełącznik
// typu działa także przy edycji: zmiana czyści kategorię, powrót przywraca
// pierwotną (logika w `useTransactionForm`). Po zapisie formularz się zamyka;
// komunikat o wpisie spoza oglądanego miesiąca daje `afterSave`.
export function MobileTransactionForm({
  mode,
  onClose,
}: {
  mode: TransactionFormMode;
  onClose: () => void;
}) {
  const formId = useId();
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
    setType,
    categories,
    error,
    saving,
    handleSubmit,
  } = useTransactionForm(mode);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const editing = mode.kind === "edit" ? mode.transaction : null;

  async function submit(e: FormEvent<HTMLFormElement>) {
    if (await handleSubmit(e)) onClose();
  }

  return (
    <FullScreen
      title={editing ? "Edytuj transakcję" : "Nowa transakcja"}
      onClose={() => {
        if (!saving) onClose();
      }}
      footer={
        <Button
          type="submit"
          form={formId}
          disabled={saving}
          className="h-14 w-full rounded-2xl bg-(image:--gradient-primary) text-lg font-semibold shadow-[0_10px_28px_-10px_var(--glow)]"
        >
          {saving ? "Zapisywanie…" : editing ? "Zapisz zmiany" : "Zapisz"}
        </Button>
      }
    >
      {/* Zwięzła góra: typ, kwota i początek kafelków mieszczą się nad klawiaturą. */}
      <form id={formId} onSubmit={submit} className="flex flex-1 flex-col gap-4 pt-1">
        <div
          role="group"
          aria-label="Typ transakcji"
          className="grid w-56 grid-cols-2 self-center rounded-xl bg-muted p-1"
        >
          {TYPE_ITEMS.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={type === item.value}
              disabled={saving}
              onClick={() => setType(item.value)}
              className={cn(
                "min-h-10 rounded-lg text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                type === item.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <AmountField
          id={`${formId}-amount`}
          value={amount}
          onChange={setAmount}
          autoFocus={!editing}
          disabled={saving}
          invalid={error === AMOUNT_ERROR}
        />

        <CategoryTiles
          type={type}
          categories={categories}
          value={categoryValue}
          onChange={setCategoryValue}
          onAddNew={() => setNewCategoryOpen(true)}
          disabled={saving}
        />

        <div className="mt-auto flex flex-col gap-3">
          <label className="flex min-h-12 items-center justify-between gap-4 rounded-xl bg-card px-4 font-medium shadow-(--shadow-soft)">
            Data
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={saving}
              className="min-h-11 bg-transparent text-right text-muted-foreground outline-none"
            />
          </label>
          <Input
            aria-label="Opis"
            placeholder="Opis (opcjonalnie)"
            enterKeyHint="done"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
            className="h-12 rounded-xl border-0 bg-card px-4 text-base shadow-(--shadow-soft)"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {editing && (
          <Button
            type="button"
            variant="destructive"
            disabled={saving}
            onClick={() => setPendingDelete(editing)}
            className="h-12 rounded-2xl text-base font-semibold"
          >
            <Trash2 />
            Usuń transakcję
          </Button>
        )}
      </form>

      <NewCategoryDrawer
        open={newCategoryOpen}
        onOpenChange={setNewCategoryOpen}
        type={type}
        onCreated={setCategoryValue}
      />
      <DeleteTransactionDrawer
        transaction={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onDeleted={onClose}
      />
    </FullScreen>
  );
}
