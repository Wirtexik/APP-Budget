"use client";

import {
  CalendarClock,
  ChartPie,
  House,
  List,
  Plus,
  type LucideIcon,
} from "lucide-react";

import type { View } from "@/lib/dashboard-url";
import { cn } from "@/lib/utils";

const LEFT: NavItem[] = [
  { view: "kokpit", label: "Kokpit", icon: House },
  { view: "historia", label: "Historia", icon: List },
];
const RIGHT: NavItem[] = [
  { view: "zlecenia", label: "Zlecenia", icon: CalendarClock },
  { view: "raporty", label: "Raporty", icon: ChartPie },
];

interface NavItem {
  view: View;
  label: string;
  icon: LucideIcon;
}

// Dolna nawigacja (wg styl-kokpit.jpg): cztery widoki i wystający „+”.
export function BottomNav({
  active,
  onSelect,
  onAdd,
}: {
  active: View;
  onSelect: (view: View) => void;
  onAdd: () => void;
}) {
  const item = ({ view, label, icon: Icon }: NavItem) => {
    const isActive = view === active;
    return (
      <button
        key={view}
        type="button"
        aria-current={isActive ? "page" : undefined}
        onClick={() => onSelect(view)}
        className={cn(
          "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          isActive ? "text-primary" : "text-foreground/80"
        )}
      >
        <Icon className={cn("size-6", isActive && "fill-primary/20")} />
        {label}
      </button>
    );
  };

  return (
    <nav
      aria-label="Nawigacja"
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_-16px_rgb(76_61_140/0.3)]"
    >
      <div className="flex h-16 items-center px-2">
        {LEFT.map(item)}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            aria-label="Dodaj transakcję"
            onClick={onAdd}
            className="-mt-8 flex size-16 items-center justify-center rounded-full bg-(image:--gradient-primary) text-primary-foreground shadow-[0_10px_28px_-6px_var(--glow)] ring-4 ring-background outline-none focus-visible:ring-ring/50 active:scale-95 transition-transform"
          >
            <Plus className="size-8" strokeWidth={2.5} />
          </button>
        </div>
        {RIGHT.map(item)}
      </div>
    </nav>
  );
}
