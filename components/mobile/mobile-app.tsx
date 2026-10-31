"use client";

import { useEffect, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

import { BottomNav } from "@/components/mobile/bottom-nav";
import { MobileDashboard } from "@/components/mobile/dashboard/mobile-dashboard";
import { TypeListScreen } from "@/components/mobile/dashboard/type-list-screen";
import { MobileHistory } from "@/components/mobile/history/mobile-history";
import { MobileReports } from "@/components/mobile/reports/mobile-reports";
import { MobileRecurring } from "@/components/mobile/recurring/mobile-recurring";
import { RecurringFormRoute } from "@/components/mobile/recurring/mobile-recurring-form";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { MoreScreen } from "@/components/mobile/more/more-screen";
import { MobileTransactionForm } from "@/components/mobile/transaction-form/mobile-transaction-form";
import { Button } from "@/components/ui/button";
import { categoryOf, type CategoryType } from "@/lib/budget";
import { isPiggyBreak } from "@/lib/categories";
import {
  DEFAULT_VIEW,
  VIEWS,
  adjacentView,
  mobileFormParam,
  type Screen,
  type View,
} from "@/lib/dashboard-url";
import { useBudgetData } from "@/lib/hooks/budget-data";
import type { DashboardUrl } from "@/lib/hooks/use-dashboard-url";
import { useViewSwipe } from "@/lib/hooks/use-view-swipe";
import { useVisited } from "@/lib/hooks/use-visited";

const VIEW_TITLES: Record<View, string> = {
  kokpit: "Kokpit",
  historia: "Historia",
  zlecenia: "Zlecenia stałe",
  raporty: "Raporty",
};

const LIST_SCREENS: Record<CategoryType, Screen> = {
  przychod: "przychody",
  wydatek: "wydatki",
};

// Korzeń wersji mobilnej. `data-ui="mobile"` włącza tokeny wyglądu z
// `app/globals.css`, więc komponenty `ui/` dostają tu nowy wygląd, a desktop
// zostaje bez zmian. Widok, okres, formularz i ekrany na pełnym ekranie są
// w URL. Przesunięcie w bok po treści przełącza widok.
export function MobileApp({ login, url }: { login: string; url: DashboardUrl }) {
  const {
    period,
    selectPeriod,
    monthTransactions,
    categoryById,
    loading,
    loadError,
    refresh,
  } = useBudgetData();
  // Ukryte widoki zostają zamontowane od pierwszej wizyty (jak zakładki na PC).
  const visited = useVisited(url.view);

  // Formularz z URL. Edycja tylko dla wpisu z pobranego miesiąca: gdy go nie ma
  // (stary link, inny miesiąc, wpis usunięty) albo to rozbicie skarbonki (można
  // je tylko usunąć), parametr znika. Zlecenia sprawdza `RecurringFormRoute`
  // (po doczytaniu listy zleceń).
  const { form, closeOverlay } = url;
  const editId = form?.kind === "transaction" ? form.id : null;
  const editing = monthTransactions.find(
    (t) => t.id === editId && !isPiggyBreak(categoryOf(t, categoryById))
  );
  const formInvalid = editId !== null && !loading && !editing;
  useEffect(() => {
    if (formInvalid) closeOverlay();
  }, [formInvalid, closeOverlay]);

  const { screen } = url;
  const swipe = useViewSwipe({
    enabled: !form && !screen,
    onSwipe: (step) => {
      const next = adjacentView(url.view, step);
      if (next) url.setView(next);
    },
  });

  const listType: CategoryType | null =
    screen === "przychody" ? "przychod" : screen === "wydatki" ? "wydatek" : null;

  const views: Record<View, ReactNode> = {
    kokpit: (
      <MobileDashboard
        onOpenList={(type) => url.openScreen(LIST_SCREENS[type])}
        onAdd={(type) => url.openForm({ kind: "transaction", id: null, type })}
      />
    ),
    historia: (
      <MobileHistory
        filters={url.filters}
        onFiltersChange={url.setFilters}
        onEdit={(id) => url.openForm({ kind: "transaction", id })}
      />
    ),
    zlecenia: (
      <MobileRecurring onOpenForm={(id) => url.openForm({ kind: "recurring", id })} />
    ),
    raporty: <MobileReports />,
  };

  return (
    <div
      data-ui="mobile"
      data-slot="mobile-root"
      className="flex min-h-dvh flex-col bg-background text-foreground"
    >
      <MobileHeader
        title={VIEW_TITLES[url.view]}
        login={login}
        period={period}
        onPeriodChange={selectPeriod}
        onOpenMore={() => url.openScreen("wiecej")}
        onBack={url.view === DEFAULT_VIEW ? undefined : url.goBack}
      />

      {loading && (
        <div
          role="progressbar"
          aria-label="Wczytywanie danych"
          className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary/15"
        >
          <div className="h-full w-1/3 animate-[loading-bar_1.2s_ease-in-out_infinite] bg-(image:--gradient-primary)" />
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="mx-4 mb-2 flex items-center gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <p className="flex-1">Nie udało się pobrać danych: {loadError}</p>
          <Button
            variant="destructive"
            className="min-h-11 shrink-0"
            onClick={() => void refresh()}
          >
            <RefreshCw />
            Spróbuj ponownie
          </Button>
        </div>
      )}

      {/* Odstęp pod treścią na dolną nawigację z wystającym „+”. */}
      <main
        {...swipe}
        className="flex flex-1 touch-pan-y flex-col px-4 pb-[calc(6rem+env(safe-area-inset-bottom))]"
      >
        {VIEWS.map(
          (view) =>
            visited.has(view) && (
              <section
                key={view}
                hidden={view !== url.view}
                aria-label={VIEW_TITLES[view]}
                className="flex flex-1 flex-col"
              >
                {views[view]}
              </section>
            )
        )}
      </main>

      <BottomNav
        active={url.view}
        onSelect={url.setView}
        onAdd={() => url.openForm({ kind: "transaction", id: null })}
      />

      {form?.kind === "transaction" && (form.id === null || editing) && (
        <MobileTransactionForm
          // Każde otwarcie (inny wpis, nowy) zaczyna od świeżego stanu.
          key={mobileFormParam(form)}
          mode={
            editing
              ? { kind: "edit", transaction: editing }
              : { kind: "create", type: form.type ?? "wydatek" }
          }
          onClose={closeOverlay}
        />
      )}

      {form?.kind === "recurring" && (
        <RecurringFormRoute id={form.id} onClose={closeOverlay} />
      )}

      {listType && (
        <TypeListScreen
          type={listType}
          onEdit={(id) => url.openForm({ kind: "transaction", id })}
          onClose={closeOverlay}
        />
      )}

      {screen === "wiecej" && <MoreScreen login={login} onClose={closeOverlay} />}
    </div>
  );
}
