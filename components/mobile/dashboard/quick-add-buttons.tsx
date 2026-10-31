import { Plus } from "lucide-react";

import type { CategoryType } from "@/lib/budget";

const BUTTON =
  "flex min-h-12 items-center justify-center gap-1.5 rounded-2xl font-semibold outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98]";

// „+ Przychód” i „+ Wydatek” pod kartami Kokpitu (każdy pod swoją kartą):
// formularz z ustawionym typem.
export function QuickAddButtons({ onAdd }: { onAdd: (type: CategoryType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onAdd("przychod")}
        className={`${BUTTON} bg-income text-income-foreground shadow-[0_10px_28px_-12px_var(--income)]`}
      >
        <Plus className="size-5" strokeWidth={2.5} />
        Przychód
      </button>
      <button
        type="button"
        onClick={() => onAdd("wydatek")}
        className={`${BUTTON} bg-(image:--gradient-primary) text-primary-foreground shadow-[0_10px_28px_-10px_var(--glow)]`}
      >
        <Plus className="size-5" strokeWidth={2.5} />
        Wydatek
      </button>
    </div>
  );
}
