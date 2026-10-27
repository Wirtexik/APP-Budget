"use client";

import { useEffect, useMemo, useState } from "react";

import { DeleteTransactionDrawer } from "@/components/mobile/delete-transaction-drawer";
import { SwipeRow } from "@/components/mobile/transactions/swipe-row";
import { categoryOf, currency, fromGrosze, type Id, type Transaction } from "@/lib/budget";
import { useBudgetData } from "@/lib/hooks/budget-data";
import { dayLabel, groupByDay } from "@/lib/transaction-groups";

function signedTotal(grosze: number) {
  const value = currency.format(fromGrosze(Math.abs(grosze)));
  if (grosze > 0) return `+${value}`;
  if (grosze < 0) return `−${value}`;
  return value;
}

// Lista transakcji (ekran 2 makiety): pogrupowana po dniach albo – przy
// sortowaniu po kwocie – jedna karta z datą w wierszu. Odsłonięty jest najwyżej
// jeden wiersz; przewinięcie strony albo dotknięcie poza nim go zamyka.
export function MobileTransactionList({
  transactions,
  grouped = true,
  onEdit,
}: {
  transactions: Transaction[];
  grouped?: boolean;
  onEdit: (id: Id) => void;
}) {
  const { categoryById } = useBudgetData();
  const [openId, setOpenId] = useState<Id | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const groups = useMemo(
    () => groupByDay(transactions, categoryById),
    [transactions, categoryById]
  );
  const today = new Date();

  useEffect(() => {
    if (openId === null) return;
    const close = () => setOpenId(null);
    function onPointerDown(event: PointerEvent) {
      const row = (event.target as Element | null)?.closest("[data-swipe-id]");
      if (row?.getAttribute("data-swipe-id") !== openId) close();
    }
    window.addEventListener("scroll", close, { passive: true });
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("scroll", close);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openId]);

  const rows = (items: Transaction[]) => (
    <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card shadow-(--shadow-soft)">
      {items.map((t) => (
        <SwipeRow
          key={t.id}
          transaction={t}
          category={categoryOf(t, categoryById)}
          showDate={!grouped}
          open={openId === t.id}
          onOpenChange={(open) =>
            setOpenId((current) => (open ? t.id : current === t.id ? null : current))
          }
          onEdit={() => onEdit(t.id)}
          onDelete={() => setDeleting(t)}
        />
      ))}
    </ul>
  );

  return (
    <>
      {grouped ? (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.date} aria-label={dayLabel(group.date, today)}>
              <h3 className="mb-2 flex justify-between px-1 text-sm font-semibold text-muted-foreground">
                <span>{dayLabel(group.date, today)}</span>
                <span className="tabular-nums">{signedTotal(group.total)}</span>
              </h3>
              {rows(group.items)}
            </section>
          ))}
        </div>
      ) : (
        rows(transactions)
      )}

      <DeleteTransactionDrawer transaction={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
