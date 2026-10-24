"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CircleArrowDown, CircleArrowUp, Repeat } from "lucide-react";
import { toast } from "sonner";

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
import { parseAmount, type Category, type CategoryType } from "@/lib/budget";
import { valueForCategory } from "@/lib/categories";
import { useBudgetData, useRecurringData } from "@/lib/hooks/budget-data";
import { resolveCategory, type Resolved } from "@/lib/queries";
import {
  MAX_OCCURRENCES,
  SCHEDULE_ITEMS,
  SCHEDULE_PRESETS,
  describeFrequency,
  endModeOf,
  presetFor,
  todayKey,
  toRulePayload,
  validateRuleInput,
  type EndMode,
  type Frequency,
  type RecurringRule,
  type RecurringRuleInput,
  type SchedulePreset,
} from "@/lib/recurring";
import {
  insertRecurringRule,
  updateRecurringRule,
} from "@/lib/recurring-queries";
import { cn } from "@/lib/utils";

const CUSTOM_SCHEDULE = "custom";

const END_ITEMS: { value: EndMode; label: string }[] = [
  { value: "never", label: "Bezterminowo" },
  { value: "date", label: "Do wybranej daty" },
  { value: "count", label: "Po liczbie wykonań" },
];

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

const isPreset = (value: string): value is SchedulePreset =>
  value in SCHEDULE_PRESETS;

const isEndMode = (value: string): value is EndMode =>
  END_ITEMS.some((item) => item.value === value);

// Okno dodawania (`rule === null`) i edycji zlecenia. Świeży stan formularza
// przy każdym otwarciu zapewnia rodzic przez zmianę `key`.
export function RecurringRuleDialog({
  open,
  onOpenChange,
  rule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: RecurringRule | null;
}) {
  const { userId, categories, categoryById } = useBudgetData();
  const { afterChange } = useRecurringData();
  const [saving, setSaving] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <RecurringRuleForm
          rule={rule}
          category={
            rule ? categoryById.get(rule.category_id) : undefined
          }
          userId={userId}
          categories={categories}
          onSavingChange={setSaving}
          onDone={() => onOpenChange(false)}
          onSaved={afterChange}
        />
      </DialogContent>
    </Dialog>
  );
}

// Przy edycji typ (wydatek / przychód) jest stały – tak jak w edycji transakcji.
function RecurringRuleForm({
  rule,
  category,
  userId,
  categories,
  onSavingChange,
  onDone,
  onSaved,
}: {
  rule: RecurringRule | null;
  category: Category | undefined;
  userId: string;
  categories: Category[];
  onSavingChange: (saving: boolean) => void;
  onDone: () => void;
  onSaved: () => Promise<void>;
}) {
  const isEdit = rule !== null;
  const [today] = useState(todayKey);

  const [type, setType] = useState<CategoryType>(
    () => category?.type ?? "wydatek"
  );
  const [initialCategoryValue] = useState(() =>
    category ? valueForCategory(category) : null
  );
  const [categoryValue, setCategoryValue] = useState<string | null>(
    initialCategoryValue
  );
  const [amount, setAmount] = useState(() => (rule ? String(rule.amount) : ""));
  const [description, setDescription] = useState(
    () => rule?.description ?? ""
  );
  const [frequency, setFrequency] = useState<Frequency>(
    () => rule?.frequency ?? "monthly"
  );
  const [intervalCount, setIntervalCount] = useState(
    () => rule?.interval_count ?? 1
  );
  const [startDate, setStartDate] = useState(() => rule?.start_date ?? today);
  const [endMode, setEndMode] = useState<EndMode>(() =>
    rule ? endModeOf(rule) : "never"
  );
  const [endDate, setEndDate] = useState(() => rule?.end_date ?? "");
  const [maxOccurrences, setMaxOccurrences] = useState(() =>
    rule?.max_occurrences != null ? String(rule.max_occurrences) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Harmonogram spoza presetów (np. „co 5 tygodni” ustawione w bazie) zostaje
  // na liście jako osobna pozycja, żeby edycja go nie zgubiła.
  const preset = presetFor(frequency, intervalCount);
  const [customLabel] = useState(() =>
    rule && !presetFor(rule.frequency, rule.interval_count)
      ? describeFrequency(rule.frequency, rule.interval_count)
      : null
  );
  const scheduleItems = useMemo(
    () =>
      customLabel
        ? [...SCHEDULE_ITEMS, { value: CUSTOM_SCHEDULE, label: customLabel }]
        : SCHEDULE_ITEMS,
    [customLabel]
  );

  function setBusy(busy: boolean) {
    setSaving(busy);
    onSavingChange(busy);
  }

  function selectType(next: CategoryType) {
    if (next === type) return;
    setType(next);
    setCategoryValue(null);
  }

  function selectSchedule(value: string | null) {
    if (value === CUSTOM_SCHEDULE && rule) {
      setFrequency(rule.frequency);
      setIntervalCount(rule.interval_count);
    } else if (value !== null && isPreset(value)) {
      setFrequency(SCHEDULE_PRESETS[value].frequency);
      setIntervalCount(SCHEDULE_PRESETS[value].intervalCount);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const count = maxOccurrences.trim();
    const input: RecurringRuleInput = {
      amount: parseAmount(amount),
      description,
      frequency,
      intervalCount,
      startDate,
      endMode,
      endDate,
      maxOccurrences: count === "" ? null : Number(count),
    };

    const invalid = validateRuleInput(input, today, rule ?? undefined);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (!categoryValue) {
      setError("Wybierz kategorię.");
      return;
    }

    setBusy(true);

    // Niezmieniona kategoria zachowuje dotychczasowy `category_id`
    // (nazwa domyślnej kategorii mogłaby wskazywać inny, zdublowany wiersz).
    const resolved: Resolved =
      rule && categoryValue === initialCategoryValue
        ? { id: rule.category_id, error: null }
        : await resolveCategory(userId, categories, categoryValue);

    const payload = toRulePayload(input);
    const failure =
      resolved.error ??
      (rule
        ? await updateRecurringRule(userId, rule.id, resolved.id, payload)
        : await insertRecurringRule(userId, resolved.id, payload));

    if (failure) {
      setBusy(false);
      setError(failure);
      return;
    }

    toast.success(isEdit ? "Zapisano zmiany zlecenia" : "Dodano zlecenie stałe");
    await onSaved();
    setBusy(false);
    onDone();
  }

  return (
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
                onClick={() => selectType(opt.value)}
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
            value={preset ?? CUSTOM_SCHEDULE}
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
      {frequency === "monthly" && Number(startDate.slice(8, 10)) > 28 && (
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
      {endMode === "count" && rule && rule.occurrences_count > 0 && (
        <p className="-mt-2 text-xs text-muted-foreground">
          Liczba obejmuje wszystkie wykonania – dotąd wykonano{" "}
          {rule.occurrences_count}.
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
  );
}
