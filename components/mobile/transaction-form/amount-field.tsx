"use client";

import { useEffect, useRef, useState } from "react";

import { sanitizeAmountInput } from "@/lib/amount-input";

// Klawiatura ekranowa nie może zasłaniać dalszych kroków: dotknięcie innego pola
// tekstowego tylko przenosi do niego kursor, a wszystko inne (kafelek, puste
// miejsce) chowa klawiaturę.
const EDITABLE = "input, textarea, select, [contenteditable]";

// Duże pole kwoty. Systemowa klawiatura numeryczna (`inputMode="decimal"`),
// a wpisywany tekst przechodzi przez `sanitizeAmountInput` (zawsze przecinek).
// Szerokość pola idzie za treścią: niewidoczny napis w tej samej komórce siatki
// rozpycha ją, więc „zł” stoi tuż obok kwoty. „Dalej” na klawiaturze
// (`enterKeyHint="next"`) chowa ją i odsłania kafelki kategorii.
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) return;
    // `click`, nie `pointerdown`: kafelek dostaje swoje kliknięcie, zanim
    // klawiatura zjedzie i przesunie układ.
    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      if (target === inputRef.current || target?.closest(EDITABLE)) return;
      inputRef.current?.blur();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [focused]);

  return (
    <div className="flex items-baseline justify-center gap-2">
      <div className="inline-grid min-w-0 text-5xl leading-tight font-bold tracking-tight tabular-nums">
        <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-pre">
          {value || "0,00"}
        </span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="next"
          aria-label="Kwota w złotych"
          aria-invalid={invalid || undefined}
          placeholder="0,00"
          autoFocus={autoFocus}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(sanitizeAmountInput(e.target.value))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            // Enter nie wysyła formularza – zamyka klawiaturę.
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          className="col-start-1 row-start-1 w-full min-w-0 bg-transparent text-center outline-none placeholder:text-muted-foreground/50 aria-invalid:text-destructive"
        />
      </div>
      <span aria-hidden className="text-3xl font-normal text-muted-foreground">
        zł
      </span>
    </div>
  );
}
