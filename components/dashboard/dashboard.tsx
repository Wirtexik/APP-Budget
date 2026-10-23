"use client";

import { useMemo, useState } from "react";
import {
  ChartPie,
  Clock,
  History,
  LayoutDashboard,
  Repeat,
} from "lucide-react";

import { CategoryForm } from "@/components/dashboard/category-form";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DeleteTransactionDialog } from "@/components/dashboard/delete-transaction-dialog";
import { EditTransactionDialog } from "@/components/dashboard/edit-transaction-dialog";
import { QuickIncomeDialog } from "@/components/dashboard/quick-income-dialog";
import { ReportsTab } from "@/components/dashboard/reports-tab";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { HistoryFilters } from "@/components/dashboard/history-filters";
import { RecurringTab } from "@/components/recurring/recurring-tab";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { computeTotals, pluralEntries, type Transaction } from "@/lib/budget";
import { isView, type View } from "@/lib/dashboard-url";
import {
  filterTransactions,
  hasActiveFilters,
  sanitizeFilters,
} from "@/lib/filters";
import { useBudgetData } from "@/lib/hooks/budget-data";
import type { DashboardUrl } from "@/lib/hooks/use-dashboard-url";
import { getSupabase } from "@/lib/supabase";

const RECENT_LIMIT = 5;

// Przekierowanie na /login robi listener `onAuthStateChange` w SessionGate –
// jedno miejsce dla obu wersji i dla wylogowania w innej karcie. `signOut()`
// usuwa sesję lokalnie nawet przy błędzie sieci, więc zdarzenie zawsze przyjdzie.
function handleSignOut() {
  void getSupabase().auth.signOut();
}

// Wersja komputerowa. Provider danych i stan z URL stawia AppShell, wspólny
// dla obu wersji; zakładka, okres i filtry Historii żyją w URL.
export function Dashboard({ login, url }: { login: string; url: DashboardUrl }) {
  const {
    period,
    selectPeriod,
    monthLabel,
    categories,
    categoryById,
    monthTransactions,
    loading,
    loadError,
  } = useBudgetData();

  // Transakcja czekająca na potwierdzenie usunięcia / edytowana w oknie.
  // `editKey` wymusza świeży stan formularza przy każdym otwarciu edycji.
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState(0);

  // Ukryte zakładki Base UI domyślnie odmontowuje, a wtedy ginie ich stan
  // (suwak Miesiąc/Rok w Raportach, niezapisane formularze). Zakładka zostaje
  // zamontowana dopiero po pierwszym otwarciu, więc dane zleceń i roku nadal
  // pobierają się leniwie.
  const [visited, setVisited] = useState<ReadonlySet<View>>(
    () => new Set([url.view])
  );
  if (!visited.has(url.view)) setVisited(new Set(visited).add(url.view));

  // Filtry i sortowanie Historii (z URL). Zostają przy zmianie miesiąca.
  const historyFilters = useMemo(
    () => sanitizeFilters(url.filters, categoryById),
    [url.filters, categoryById]
  );

  function openEdit(t: Transaction) {
    setEditing(t);
    setEditKey((k) => k + 1);
    setEditOpen(true);
  }

  const recent = useMemo(
    () => monthTransactions.slice(0, RECENT_LIMIT),
    [monthTransactions]
  );

  const totals = useMemo(
    () => computeTotals(monthTransactions, categoryById),
    [monthTransactions, categoryById]
  );

  // Historia: filtrowanie w przeglądarce na danych miesiąca – wynik zmienia się
  // od razu, przy każdej wpisanej literze.
  const historyTransactions = useMemo(
    () => filterTransactions(monthTransactions, categoryById, historyFilters),
    [monthTransactions, categoryById, historyFilters]
  );
  const historyFiltered = hasActiveFilters(historyFilters);

  return (
    <main className="min-h-svh bg-linear-to-b from-blue-50 to-background dark:from-blue-950/30">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
        <DashboardHeader
          login={login}
          period={period}
          onPeriodChange={selectPeriod}
          onSignOut={handleSignOut}
        />

        {loadError && (
          <p role="alert" className="text-sm text-destructive">
            Nie udało się pobrać danych: {loadError}
          </p>
        )}

        <Tabs
          value={url.view}
          onValueChange={(v) => isView(v) && url.setView(v)}
          className="gap-4"
        >
          <TabsList className="h-10 w-full sm:w-fit">
            <TabsTrigger value="kokpit" className="sm:px-4">
              <LayoutDashboard />
              Kokpit
            </TabsTrigger>
            <TabsTrigger value="historia" className="sm:px-4">
              <History />
              Historia
            </TabsTrigger>
            <TabsTrigger value="zlecenia" className="sm:px-4">
              <Repeat />
              Zlecenia
            </TabsTrigger>
            <TabsTrigger value="raporty" className="sm:px-4">
              <ChartPie />
              Raporty
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="kokpit"
            keepMounted={visited.has("kokpit")}
            className="flex flex-col gap-6"
          >
            <SummaryCards
              totals={totals}
              monthLabel={monthLabel}
              loading={loading}
              incomeAction={
<QuickIncomeDialog />
              }
            />

            <section className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start">
              <CategoryForm />
              <TransactionForm />
            </section>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  Ostatnie transakcje
                </CardTitle>
                <CardDescription>
                  {RECENT_LIMIT} najnowszych wpisów · {monthLabel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionsTable
                  transactions={recent}
                  categoryById={categoryById}
                  loading={loading}
                  onEdit={openEdit}
                  onDelete={setPendingDelete}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="historia"
            keepMounted={visited.has("historia")}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  Historia transakcji
                </CardTitle>
                <CardDescription>
                  {monthLabel}
                  {!loading && historyFiltered
                    ? ` · ${historyTransactions.length} z ${monthTransactions.length} ${pluralEntries(monthTransactions.length)}`
                    : !loading &&
                      ` · ${monthTransactions.length} ${pluralEntries(monthTransactions.length)}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <HistoryFilters
                  value={historyFilters}
                  onChange={url.setFilters}
                  categories={categories}
                  categoryById={categoryById}
                />
                <TransactionsTable
                  transactions={historyTransactions}
                  categoryById={categoryById}
                  loading={loading}
                  emptyText={
                    historyFiltered && monthTransactions.length > 0
                      ? "Brak transakcji pasujących do filtrów."
                      : undefined
                  }
                  onEdit={openEdit}
                  onDelete={setPendingDelete}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="zlecenia"
            keepMounted={visited.has("zlecenia")}
          >
            <RecurringTab />
          </TabsContent>

          <TabsContent
            value="raporty"
            keepMounted={visited.has("raporty")}
          >
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </div>

      <EditTransactionDialog
        key={editKey}
        open={editOpen}
        onOpenChange={setEditOpen}
        transaction={editing}
      />

      <DeleteTransactionDialog
        transaction={pendingDelete}
        onClose={() => setPendingDelete(null)}
      />
    </main>
  );
}
