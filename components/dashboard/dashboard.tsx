"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import {
  ChartPie,
  Clock,
  History,
  LayoutDashboard,
  Repeat,
} from "lucide-react";
import { toast } from "sonner";

import { CategoryForm } from "@/components/dashboard/category-form";
import {
  DashboardHeader,
  type Period,
} from "@/components/dashboard/dashboard-header";
import { DeleteTransactionDialog } from "@/components/dashboard/delete-transaction-dialog";
import { EditTransactionDialog } from "@/components/dashboard/edit-transaction-dialog";
import { QuickIncomeDialog } from "@/components/dashboard/quick-income-dialog";
import { ReportsTab } from "@/components/dashboard/reports-tab";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { TransactionTypeFilter } from "@/components/dashboard/transaction-type-filter";
import { RecurringTab } from "@/components/recurring/recurring-tab";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { emailToLogin } from "@/lib/auth";
import {
  MONTH_NAMES,
  computeTotals,
  formatDate,
  monthRange,
  pluralEntries,
  type Category,
  type CategoryType,
  type Transaction,
} from "@/lib/budget";
import { fetchDashboardData, type DashboardData } from "@/lib/queries";
import { materializeRecurring } from "@/lib/recurring-queries";
import { getSupabase } from "@/lib/supabase";

const RECENT_LIMIT = 5;

export function Dashboard({ session }: { session: Session }) {
  const router = useRouter();
  const userId = session.user.id;

  // Globalny filtr czasu: domyślnie bieżący miesiąc.
  const [period, setPeriod] = useState<Period>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const { year, month } = period;
  const monthLabel = `${MONTH_NAMES[month].toLowerCase()} ${year}`;

  const [categories, setCategories] = useState<Category[]>([]);
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Transakcja czekająca na potwierdzenie usunięcia / edytowana w oknie.
  // `editKey` wymusza świeży stan formularza przy każdym otwarciu edycji.
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState(0);

  // Filtr „Uznania / Obciążenia” w Historii. `null` = pokaż wszystko.
  const [historyFilter, setHistoryFilter] = useState<CategoryType | null>(
    null
  );

  // Numer ostatniego żądania: spóźniona odpowiedź dla poprzedniego miesiąca
  // (albo sprzed zapisu) nie nadpisze nowszych danych.
  const requestSeq = useRef(0);

  const apply = useCallback((data: DashboardData) => {
    if (data.error) {
      setLoadError(data.error);
    } else {
      setLoadError(null);
      setCategories(data.categories);
      setMonthTransactions(data.monthTransactions);
    }
    setLoading(false);
  }, []);

  // Odświeża karty, tabele i raporty wybranego miesiąca po każdej zmianie.
  const refresh = useCallback(async () => {
    const id = ++requestSeq.current;
    const data = await fetchDashboardData(userId, year, month);
    if (id === requestSeq.current) apply(data);
  }, [userId, year, month, apply]);

  // Zaległe wykonania zleceń stałych tworzymy raz, przy otwarciu aplikacji –
  // przed pierwszym pobraniem danych, żeby nowe wpisy od razu były widoczne.
  const materialized = useRef<Promise<void> | null>(null);

  useEffect(() => {
    materialized.current ??= materializeRecurring().then(({ error, created }) => {
      if (error) {
        toast.error("Nie udało się wykonać zleceń stałych", {
          description: error,
        });
      } else if (created > 0) {
        toast.success(
          `Dodano ${created} ${pluralEntries(created)} ze zleceń stałych`
        );
      }
    });

    const id = ++requestSeq.current;
    materialized.current
      .then(() => fetchDashboardData(userId, year, month))
      .then((data) => {
        if (id === requestSeq.current) apply(data);
      });
  }, [userId, year, month, apply]);

  // Po zapisie: odśwież widok. Filtr miesiąca służy wyłącznie do wyświetlania –
  // zapis z dowolną datą jest zawsze dozwolony, a filtr zostaje bez zmian. Gdy
  // wpis wypada poza oglądany miesiąc, potwierdzamy zapis i wyjaśniamy, czemu
  // nie widać go na liście.
  const afterSave = useCallback(
    async (date?: string) => {
      await refresh();
      if (!date) return;
      const day = date.slice(0, 10);
      const { start, next } = monthRange(year, month);
      if (day < start || day >= next) {
        toast.success(`Zapisano wpis z datą ${formatDate(day)}`, {
          description:
            "Nie ma go na liście, bo przeglądasz inny miesiąc.",
          duration: 6000,
        });
      }
    },
    [refresh, year, month]
  );

  function selectPeriod(next: Period) {
    setLoading(true);
    setMonthTransactions([]);
    setPeriod(next);
  }

  function openEdit(t: Transaction) {
    setEditing(t);
    setEditKey((k) => k + 1);
    setEditOpen(true);
  }

  async function handleSignOut() {
    await getSupabase().auth.signOut();
    router.replace("/login");
  }

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [String(c.id), c])),
    [categories]
  );

  const recent = useMemo(
    () => monthTransactions.slice(0, RECENT_LIMIT),
    [monthTransactions]
  );

  const totals = useMemo(
    () => computeTotals(monthTransactions, categoryById),
    [monthTransactions, categoryById]
  );

  // Historia: „Uznania” pokazują tylko przychody, „Obciążenia” tylko wydatki,
  // brak wyboru pokazuje wszystko wymieszane (tak jak dotąd).
  const historyTransactions = useMemo(() => {
    if (!historyFilter) return monthTransactions;
    return monthTransactions.filter(
      (t) => categoryById.get(String(t.category_id))?.type === historyFilter
    );
  }, [monthTransactions, categoryById, historyFilter]);

  return (
    <main className="min-h-svh bg-linear-to-b from-blue-50 to-background dark:from-blue-950/30">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
        <DashboardHeader
          login={emailToLogin(session.user.email)}
          period={period}
          onPeriodChange={selectPeriod}
          onSignOut={handleSignOut}
        />

        {loadError && (
          <p role="alert" className="text-sm text-destructive">
            Nie udało się pobrać danych: {loadError}
          </p>
        )}

        <Tabs defaultValue="kokpit" className="gap-4">
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

          <TabsContent value="kokpit" className="flex flex-col gap-6">
            <SummaryCards
              totals={totals}
              monthLabel={monthLabel}
              loading={loading}
              incomeAction={
                <QuickIncomeDialog
                  userId={userId}
                  categories={categories}
                  onSaved={afterSave}
                />
              }
            />

            <section className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start">
              <CategoryForm
                userId={userId}
                categories={categories}
                onSaved={refresh}
              />
              <TransactionForm
                userId={userId}
                categories={categories}
                onSaved={afterSave}
              />
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

          <TabsContent value="historia">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  Historia transakcji
                </CardTitle>
                <CardDescription>
                  {monthLabel}
                  {!loading && historyFilter
                    ? ` · ${historyTransactions.length} z ${monthTransactions.length} ${pluralEntries(monthTransactions.length)}`
                    : !loading &&
                      ` · ${monthTransactions.length} ${pluralEntries(monthTransactions.length)}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <TransactionTypeFilter
                  value={historyFilter}
                  onChange={setHistoryFilter}
                />
                <TransactionsTable
                  transactions={historyTransactions}
                  categoryById={categoryById}
                  loading={loading}
                  onEdit={openEdit}
                  onDelete={setPendingDelete}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zlecenia">
            <RecurringTab
              userId={userId}
              categories={categories}
              categoryById={categoryById}
              onTransactionsChanged={refresh}
            />
          </TabsContent>

          <TabsContent value="raporty">
            <ReportsTab
              userId={userId}
              categories={categories}
              transactions={monthTransactions}
              monthLabel={monthLabel}
              currentYear={year}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>

      <EditTransactionDialog
        key={editKey}
        open={editOpen}
        onOpenChange={setEditOpen}
        transaction={editing}
        userId={userId}
        categories={categories}
        categoryById={categoryById}
        onSaved={afterSave}
      />

      <DeleteTransactionDialog
        transaction={pendingDelete}
        userId={userId}
        onClose={() => setPendingDelete(null)}
        onDeleted={refresh}
      />
    </main>
  );
}
