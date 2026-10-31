"use client";

import { useState } from "react";
import { Eye, EyeOff, Hammer } from "lucide-react";

import { MORE_CARD } from "@/components/mobile/more/card";
import { BreakPiggyBankDrawer } from "@/components/mobile/more/piggy-bank/break-piggy-bank-drawer";
import { PiggyBankHistory } from "@/components/mobile/more/piggy-bank/piggy-bank-history";
import { PiggySvg } from "@/components/mobile/more/piggy-bank/piggy-svg";
import { currency } from "@/lib/budget";
import { usePiggyBankData } from "@/lib/hooks/budget-data";
import { piggyBankMeta } from "@/lib/piggy-bank";
import { todayKey } from "@/lib/recurring";

const MASK = "••••• zł";

// Sekcja „Skarbonka” w „Więcej” (makieta J2: design/mobile/skarbonka.html).
// Kwota jest domyślnie ukryta; oko ją odsłania na czas pobytu w „Więcej” –
// stan jest lokalny, więc po wyjściu z ekranu kwota znów się chowa.
export function PiggyBankSection() {
  const { current, history, loading, error } = usePiggyBankData();
  const [revealed, setRevealed] = useState(false);
  // Kwota z chwili otwarcia potwierdzenia – po rozbiciu stan spada do zera,
  // a panel jeszcze się zamyka.
  const [confirm, setConfirm] = useState({ open: false, amount: 0 });
  const today = todayKey();

  const empty = current.amount <= 0;
  const meta = loading
    ? "Wczytywanie…"
    : (piggyBankMeta(current, today) ?? "Pusta – wrzuć wydatek „Skarbonka”");
  const EyeIcon = revealed ? EyeOff : Eye;

  return (
    <div className="flex flex-col gap-5">
      <div className={`${MORE_CARD} px-4 pt-4.5 pb-4`}>
        <div className="relative mx-auto w-62.5">
          <PiggySvg />
          <div className="pointer-events-none absolute top-[42.5%] right-[18%] left-[12%] text-center text-white">
            <span className="block text-xs font-medium opacity-85">W skarbonce</span>
            <span className="block text-2xl font-bold tracking-tight tabular-nums">
              {revealed ? currency.format(current.amount) : MASK}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="min-w-0 text-sm text-muted-foreground">{meta}</span>
          <button
            type="button"
            aria-label={revealed ? "Ukryj kwotę" : "Pokaż kwotę"}
            aria-pressed={revealed}
            onClick={() => setRevealed((prev) => !prev)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <EyeIcon className="size-5" />
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            Nie udało się wczytać skarbonki: {error}
          </p>
        )}

        <button
          type="button"
          disabled={loading || empty}
          onClick={() => setConfirm({ open: true, amount: current.amount })}
          className="mt-3 flex min-h-12.5 w-full items-center justify-center gap-2 rounded-2xl bg-(image:--gradient-primary) text-base font-semibold text-white shadow-[0_10px_28px_-10px_var(--glow)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 disabled:shadow-none"
        >
          <Hammer className="size-5" />
          Rozbij skarbonkę
        </button>
      </div>

      <PiggyBankHistory history={history} today={today} />

      <BreakPiggyBankDrawer
        open={confirm.open}
        amount={confirm.amount}
        onClose={() => setConfirm((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
