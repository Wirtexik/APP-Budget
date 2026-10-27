"use client";

import type { FormEvent } from "react";
import { CircleArrowDown, CircleArrowUp, Repeat } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryType } from "@/lib/budget";
import { END_ITEMS, useRecurringRuleForm } from "@/lib/hooks/use-recurring-rule-form";
import { MAX_OCCURRENCES, type EndMode, type RecurringRule } from "@/lib/recurring";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS: {
  value: CategoryType;
  label: string;
  Icon: typeof CircleArrowUp;
  active: string;
}[] = [
  {
    value: "wydatek",
    label: "Wydatek",
    Icon: CircleArrowDown,
    active:
      "border-orange-500/50 bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 dark:text-orange-300",
  },
  {
    value: "przychod",
    label: "Przychód",
    Icon: CircleArrowUp,
    active:
      "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300",
  },
];

const isEndMode = (value: string): value is EndMode =>
  END_ITEMS.some((item) => item.value === value);

// Okno dodawania (`rule === null`) i edycji zlecenia. Świeży stan formularza
// przy każdym otwarciu zapewnia rodzic przez zmianę `key`. Stan i zapis:
// `useRecurringRuleForm`; przy edycji typ (wydatek / przychód) jest stały.
export function RecurringRuleDialog({
  open,
  onOpenChange,
  rule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: RecurringRule | null;
}) {
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (await form.handleSubmit(e)) onOpenChange(false);
  }

  const onDone = () => onOpenChange(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="size-4 text-muted-foreground" />
              {isEdit ? "Edytuj zlecenie stałe" : "Nowe zlecenie stałe"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Zmiany dotyczą tylko przyszłych wykonań – dotychczasowe transakcje zostają bez zmian."
                : "Transakcje będą tworzone automatycznie w kolejnych terminach."}
            </DialogDescription>
          </DialogHeader>

          {!isEdit && (
            <div className="flex gap-2" role="group" aria-label="Typ zlecenia">
              {TYPE_OPTIONS.map((opt) => {
                const active = type === opt.value;
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-pressed={active}
                    className={cn(
                      "flex-1",
                      active ? opt.active : "text-muted-foreground"
                    )}
                    disabled={saving}
                    onClick={() => setType(opt.value)}
                  >
                    <opt.Icon />
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rule-amount">Kwota (zł)</Label>
              <Input
                id="rule-amount"
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
              <Label htmlFor="rule-category">Kategoria</Label>
              <CategorySelect
                id="rule-category"
                type={type}
                categories={categories}
                value={categoryValue}
                onChange={setCategoryValue}
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rule-description">Opis (opcjonalnie)</Label>
            <Input
              id="rule-description"
              maxLength={80}
              placeholder="np. Czynsz, Wypłata, Netflix"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rule-schedule">Częstotliwość</Label>
              <Select
                items={scheduleItems}
                value={schedule}
                onValueChange={selectSchedule}
                disabled={saving}
              >
                <SelectTrigger id="rule-schedule" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scheduleItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rule-start">
                {isEdit ? "Data startu" : "Pierwsze wykonanie"}
              </Label>
              <Input
                id="rule-start"
                type="date"
                min={isEdit ? undefined : today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={saving}
                required
              />
            </div>
          </div>
          {monthEndHint && (
            <p className="-mt-2 text-xs text-muted-foreground">
              W krótszych miesiącach zlecenie wykona się ostatniego dnia miesiąca.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rule-end-mode">Zakończenie</Label>
              <Select
                items={END_ITEMS}
                value={endMode}
                onValueChange={(v) => v !== null && isEndMode(v) && setEndMode(v)}
                disabled={saving}
              >
                <SelectTrigger id="rule-end-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {END_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {endMode === "date" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="rule-end-date">Ostatni dzień</Label>
                <Input
                  id="rule-end-date"
                  type="date"
                  min={startDate > today ? startDate : today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={saving}
                  required
                />
              </div>
            )}

            {endMode === "count" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="rule-count">Liczba wykonań</Label>
                <Input
                  id="rule-count"
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="1"
                  max={MAX_OCCURRENCES}
                  value={maxOccurrences}
                  onChange={(e) => setMaxOccurrences(e.target.value)}
                  disabled={saving}
                  required
                />
              </div>
            )}
          </div>
          {endMode === "count" && occurrencesCount > 0 && (
            <p className="-mt-2 text-xs text-muted-foreground">
              Liczba obejmuje wszystkie wykonania – dotąd wykonano{" "}
              {occurrencesCount}.
            </p>
          )}

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
              {saving
                ? "Zapisywanie…"
                : isEdit
                  ? "Zapisz zmiany"
                  : "Dodaj zlecenie"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
