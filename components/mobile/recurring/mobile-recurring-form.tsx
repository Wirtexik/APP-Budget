"use client";

import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { Check, Trash2 } from "lucide-react";

import { FullScreen } from "@/components/mobile/full-screen";
import { RecurringActionsDrawer } from "@/components/mobile/recurring/recurring-actions-drawer";
import { Segmented, type SegmentedOption } from "@/components/mobile/segmented";
import { AmountField } from "@/components/mobile/transaction-form/amount-field";
import { CategoryTiles } from "@/components/mobile/transaction-form/category-tiles";
import { NewCategoryDrawer } from "@/components/mobile/transaction-form/new-category-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TYPE_ITEMS, parseAmount, type Id } from "@/lib/budget";
import { useRecurringData } from "@/lib/hooks/budget-data";
import { useRecurringRuleForm } from "@/lib/hooks/use-recurring-rule-form";
import { MAX_OCCURRENCES, type EndMode, type RecurringRule } from "@/lib/recurring";
import { cn } from "@/lib/utils";

const END_OPTIONS: SegmentedOption<EndMode>[] = [
  { value: "never", label: "Bezterminowo" },
  { value: "date", label: "Do daty" },
  { value: "count", label: "Po liczbie" },
];

const SECTION_TITLE = "mb-2 px-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase";
const ROW =
  "flex min-h-12 items-center justify-between gap-4 rounded-xl bg-card px-4 font-medium shadow-(--shadow-soft)";

// Formularz z URL (`?formularz=zlecenie` / `zlecenie-<uuid>`). Otwarty z linku
// sam doczytuje zlecenia; edycja zlecenia, którego nie ma, zamyka formularz.
export function RecurringFormRoute({ id, onClose }: { id: Id | null; onClose: () => void }) {
  const { rules, loading } = useRecurringData();
  const rule = id ? rules.find((r) => r.id === id) : undefined;
  const missing = id !== null && !loading && !rule;

  useEffect(() => {
    if (missing) onClose();
  }, [missing, onClose]);

  if (id !== null && !rule) return null;
  return <MobileRecurringForm key={id ?? "nowe"} rule={rule ?? null} onClose={onClose} />;
}

// Formularz zlecenia na pełnym ekranie (ekran 10 makiety). Stan i zapis:
// `useRecurringRuleForm` (ten sam co w oknie desktopowym).
function MobileRecurringForm({
  rule,
  onClose,
}: {
  rule: RecurringRule | null;
  onClose: () => void;
}) {
  const formId = useId();
  const form = useRecurringRuleForm(rule);
  const {
    isEdit,
    today,
    type,
    setType,
    categories,
    categoryValue,
    setCategoryValue,
    amount,
    setAmount,
    description,
    setDescription,
    schedule,
    scheduleItems,
    selectSchedule,
    startDate,
    setStartDate,
    endMode,
    setEndMode,
    endDate,
    setEndDate,
    maxOccurrences,
    setMaxOccurrences,
    occurrencesCount,
    monthEndHint,
    error,
    saving,
  } = form;
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<RecurringRule | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    if (await form.handleSubmit(e)) onClose();
  }

  return (
    <FullScreen
      title={isEdit ? "Edytuj zlecenie" : "Nowe zlecenie"}
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
          {saving ? "Zapisywanie…" : isEdit ? "Zapisz zmiany" : "Zapisz zlecenie"}
        </Button>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-1 flex-col gap-6 pt-2">
        <Segmented
          label="Typ zlecenia"
          options={TYPE_ITEMS}
          value={type}
          onChange={setType}
          className="w-56 self-center"
        />

        <AmountField
          id={`${formId}-amount`}
          value={amount}
          onChange={setAmount}
          autoFocus={!isEdit}
          disabled={saving}
          invalid={error !== null && parseAmount(amount) === null}
        />

        <CategoryTiles
          type={type}
          categories={categories}
          value={categoryValue}
          onChange={setCategoryValue}
          onAddNew={() => setNewCategoryOpen(true)}
          disabled={saving}
        />

        <Input
          aria-label="Opis"
          placeholder="Opis (opcjonalnie), np. Czynsz"
          maxLength={80}
          enterKeyHint="done"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={saving}
          className="h-12 rounded-xl border-0 bg-card px-4 text-base shadow-(--shadow-soft)"
        />

        <section>
          <h3 className={SECTION_TITLE}>Częstotliwość</h3>
          <div
            role="group"
            aria-label="Częstotliwość"
            className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card shadow-(--shadow-soft)"
          >
            {scheduleItems.map((item) => {
              const selected = item.value === schedule;
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={selected}
                  disabled={saving}
                  onClick={() => selectSchedule(item.value)}
                  className={cn(
                    "flex min-h-12 w-full items-center justify-between px-4 text-left outline-none focus-visible:bg-accent",
                    selected && "font-semibold text-primary"
                  )}
                >
                  {item.label}
                  {selected && <Check aria-hidden className="size-5" />}
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <DateRow label={isEdit ? "Data startu" : "Pierwsze wykonanie"}>
            <input
              type="date"
              required
              min={isEdit ? undefined : today}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={saving}
              className="min-h-11 bg-transparent text-right text-muted-foreground outline-none"
            />
          </DateRow>
          {monthEndHint && (
            <p className="px-1 text-xs text-muted-foreground">
              W krótszych miesiącach zlecenie wykona się ostatniego dnia miesiąca.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className={SECTION_TITLE}>Zakończenie</h3>
          <Segmented
            label="Zakończenie"
            options={END_OPTIONS}
            value={endMode}
            onChange={setEndMode}
          />
          {endMode === "date" && (
            <DateRow label="Ostatni dzień">
              <input
                type="date"
                required
                min={startDate > today ? startDate : today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={saving}
                className="min-h-11 bg-transparent text-right text-muted-foreground outline-none"
              />
            </DateRow>
          )}
          {endMode === "count" && (
            <>
              <DateRow label="Liczba wykonań">
                <input
                  type="number"
                  inputMode="numeric"
                  required
                  step={1}
                  min={1}
                  max={MAX_OCCURRENCES}
                  value={maxOccurrences}
                  onChange={(e) => setMaxOccurrences(e.target.value)}
                  disabled={saving}
                  className="min-h-11 w-24 bg-transparent text-right text-muted-foreground outline-none"
                />
              </DateRow>
              {occurrencesCount > 0 && (
                <p className="px-1 text-xs text-muted-foreground">
                  Liczba obejmuje wszystkie wykonania – dotąd wykonano {occurrencesCount}.
                </p>
              )}
            </>
          )}
        </section>

        {isEdit && (
          <p className="px-1 text-xs text-muted-foreground">
            Zmiany dotyczą tylko przyszłych wykonań – dotychczasowe transakcje zostają bez zmian.
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {rule && (
          <Button
            type="button"
            variant="destructive"
            disabled={saving}
            onClick={() => setPendingDelete(rule)}
            className="h-12 rounded-2xl text-base font-semibold"
          >
            <Trash2 />
            Usuń zlecenie
          </Button>
        )}
      </form>

      <NewCategoryDrawer
        open={newCategoryOpen}
        onOpenChange={setNewCategoryOpen}
        type={type}
        onCreated={setCategoryValue}
      />
      <RecurringActionsDrawer
        rule={pendingDelete}
        confirmOnly
        onClose={() => setPendingDelete(null)}
        onDeleted={onClose}
      />
    </FullScreen>
  );
}

function DateRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={ROW}>
      {label}
      {children}
    </label>
  );
}
