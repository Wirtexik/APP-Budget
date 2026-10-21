"use client";

import { Pencil, Repeat, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currency, formatDate, type Category, type Transaction } from "@/lib/budget";

// Tabela transakcji z kolumną „Akcje” (edycja / usuwanie) – wspólna dla kokpitu i historii.
export function TransactionsTable({
  transactions,
  categoryById,
  loading,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  categoryById: Map<string, Category>;
  loading: boolean;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}) {
  return (
    <Table className="max-sm:[&_td]:px-1.5 max-sm:[&_th]:px-1.5">
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Opis</TableHead>
          <TableHead className="hidden sm:table-cell">Kategoria</TableHead>
          <TableHead className="text-right">Kwota</TableHead>
          <TableHead className="text-right">Akcje</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="h-24 text-center text-muted-foreground"
            >
              {loading ? "Ładowanie…" : "Brak transakcji w tym miesiącu."}
            </TableCell>
          </TableRow>
        ) : (
          transactions.map((t) => {
            const category = categoryById.get(String(t.category_id));
            const isIncome = category?.type === "przychod";
            const amount = Number(t.amount);
            return (
              <TableRow key={t.id}>
                <TableCell className="whitespace-nowrap" title={formatDate(t.date)}>
                  {/* Na telefonie bez roku: rok i miesiąc są w selektorze u góry. */}
                  <span className="sm:hidden">
                    {formatDate(t.date).slice(0, 5)}
                  </span>
                  <span className="hidden sm:inline">{formatDate(t.date)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {t.recurring_rule_id != null && (
                      <Repeat
                        role="img"
                        aria-label="Ze zlecenia stałego"
                        className="size-3.5 shrink-0 text-muted-foreground"
                      >
                        <title>Ze zlecenia stałego</title>
                      </Repeat>
                    )}
                    <span>{t.description || "—"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground sm:hidden">
                    {category?.name ?? "—"}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {category?.name ?? "—"}
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums ${
                    isIncome ? "text-emerald-600" : ""
                  }`}
                >
                  {category
                    ? `${isIncome ? "+" : "−"}${currency.format(amount)}`
                    : currency.format(amount)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edytuj transakcję"
                      title="Edytuj"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => onEdit(t)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Usuń transakcję"
                      title="Usuń"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(t)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
