"use client";

// Stan, walidacja i zapis formularza zlecenia stałego – wspólne dla okna
// desktopowego i formularza mobilnego. Widok dostarcza tylko pola. Świeży stan
// przy każdym otwarciu zapewnia rodzic przez zmianę `key`.

import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { parseAmount, type CategoryType } from "@/lib/budget";
import { valueForCategory } from "@/lib/categories";
import { useBudgetData, useRecurringData } from "@/lib/hooks/budget-data";
import { resolveCategory, type Resolved } from "@/lib/queries";
import {
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
import { insertRecurringRule, updateRecurringRule } from "@/lib/recurring-queries";

/** Wartość harmonogramu spoza presetów (np. „co 5 tygodni” ustawione w bazie). */
export const CUSTOM_SCHEDULE = "custom";

export const END_ITEMS: { value: EndMode; label: string }[] = [
  { value: "never", label: "Bezterminowo" },
  { value: "date", label: "Do wybranej daty" },
  { value: "count", label: "Po liczbie wykonań" },
];

const isPreset = (value: string): value is SchedulePreset => value in SCHEDULE_PRESETS;

export function useRecurringRuleForm(rule: RecurringRule | null) {
  const { userId, categories, categoryById } = useBudgetData();
  const { afterChange } = useRecurringData();
  const isEdit = rule !== null;
  const [today] = useState(todayKey);

  // Wartości z chwili otwarcia (przy edycji: z edytowanego zlecenia).
  const [initial] = useState(() => {
    const category = rule ? categoryById.get(rule.category_id) : undefined;
    return {
      type: category?.type ?? ("wydatek" as CategoryType),
      categoryValue: category ? valueForCategory(category) : null,
    };
  });

  const [type, setTypeState] = useState<CategoryType>(initial.type);
  const [categoryValue, setCategoryValue] = useState<string | null>(initial.categoryValue);
  const [amount, setAmount] = useState(() => (rule ? String(rule.amount) : ""));
  const [description, setDescription] = useState(() => rule?.description ?? "");
  const [frequency, setFrequency] = useState<Frequency>(() => rule?.frequency ?? "monthly");
  const [intervalCount, setIntervalCount] = useState(() => rule?.interval_count ?? 1);
  const [startDate, setStartDate] = useState(() => rule?.start_date ?? today);
  const [endMode, setEndMode] = useState<EndMode>(() => (rule ? endModeOf(rule) : "never"));
  const [endDate, setEndDate] = useState(() => rule?.end_date ?? "");
  const [maxOccurrences, setMaxOccurrences] = useState(() =>
    rule?.max_occurrences != null ? String(rule.max_occurrences) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Harmonogram spoza presetów zostaje na liście jako osobna pozycja, żeby
  // edycja go nie zgubiła.
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
  const schedule: string = presetFor(frequency, intervalCount) ?? CUSTOM_SCHEDULE;

  // Zmiana typu czyści kategorię (należy do typu); przy edycji powrót do
  // pierwotnego typu przywraca pierwotną kategorię. Desktop zmienia typ tylko
  // przy dodawaniu.
  function setType(next: CategoryType) {
    if (next === type) return;
    setTypeState(next);
    setCategoryValue(isEdit && next === initial.type ? initial.categoryValue : null);
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

  // Zwraca true po udanym zapisie (komunikat i odświeżenie danych już zrobione).
  async function handleSubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
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
      return false;
    }
    if (!categoryValue) {
      setError("Wybierz kategorię.");
      return false;
    }

    setSaving(true);

    // Niezmieniona kategoria zachowuje dotychczasowy `category_id`
    // (nazwa domyślnej kategorii mogłaby wskazywać inny, zdublowany wiersz).
    const resolved: Resolved =
      rule && categoryValue === initial.categoryValue
        ? { id: rule.category_id, error: null }
        : await resolveCategory(userId, categories, categoryValue);

    const payload = toRulePayload(input);
    const failure =
      resolved.error ??
      (rule
        ? await updateRecurringRule(userId, rule.id, resolved.id, payload)
        : await insertRecurringRule(userId, resolved.id, payload));

    if (failure) {
      setSaving(false);
      setError(failure);
      return false;
    }

    toast.success(isEdit ? "Zapisano zmiany zlecenia" : "Dodano zlecenie stałe");
    await afterChange();
    setSaving(false);
    return true;
  }

  return {
    isEdit,
    /** `RRRR-MM-DD` z chwili otwarcia – dolna granica dat. */
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
    frequency,
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
    /** Wykonania dotąd (przy edycji) – do podpowiedzi przy „Po liczbie wykonań”. */
    occurrencesCount: rule?.occurrences_count ?? 0,
    /** Miesięczne zlecenie z dniem > 28 wykona się w krótszych miesiącach ostatniego dnia. */
    monthEndHint: frequency === "monthly" && Number(startDate.slice(8, 10)) > 28,
    error,
    saving,
    handleSubmit,
  };
}
