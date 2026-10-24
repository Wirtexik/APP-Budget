"use client";

import { sanitizeAmountInput } from "@/lib/amount-input";

// Duże pole kwoty. Systemowa klawiatura numeryczna (`inputMode="decimal"`),
// a wpisywany tekst przechodzi przez `sanitizeAmountInput` (zawsze przecinek).
// Szerokość pola idzie za treścią: niewidoczny napis w tej samej komórce siatki
// rozpycha ją, więc „zł” stoi tuż obok kwoty.
export function AmountField({
  id,
  value,
  onChange,
  autoFocus,
  disabled,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-center gap-2 py-2">
      <div className="inline-grid min-w-0 text-5xl leading-tight font-bold tracking-tight tabular-nums">
        <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-pre">
          {value || "0,00"}
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          aria-label="Kwota w złotych"
          aria-invalid={invalid || undefined}
          placeholder="0,00"
          autoFocus={autoFocus}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(sanitizeAmountInput(e.target.value))}
          className="col-start-1 row-start-1 w-full min-w-0 bg-transparent text-center outline-none placeholder:text-muted-foreground/50 aria-invalid:text-destructive"
        />
      </div>
      <span aria-hidden className="text-3xl font-normal text-muted-foreground">
        zł
      </span>
    </div>
  );
}
