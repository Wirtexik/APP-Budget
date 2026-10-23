"use client";

import { useSession } from "@/components/auth/session-gate";
import { Dashboard } from "@/components/dashboard/dashboard";
import { emailToLogin } from "@/lib/auth";
import { BudgetDataProvider } from "@/lib/hooks/budget-data";
import { useDashboardUrl } from "@/lib/hooks/use-dashboard-url";
import { useUiVariant } from "@/lib/hooks/use-ui-variant";

// Wspólna podstawa obu wersji: stan widoku z URL i provider danych stoją nad
// wyborem wersji, więc przełączenie (obrót tabletu, ręczny wybór) nie gubi
// zakładki, okresu, filtrów ani pobranych danych.
export function AppShell() {
  const session = useSession();
  const url = useDashboardUrl();
  const { variant } = useUiVariant();
  const login = emailToLogin(session.user.email);

  return (
    <BudgetDataProvider
      userId={session.user.id}
      period={url.period}
      onPeriodChange={url.selectPeriod}
    >
      {/* Wersja mobilna powstanie w etapie 4; do tego czasu obie to Dashboard. */}
      {variant === "mobile" ? (
        <Dashboard login={login} url={url} />
      ) : (
        <Dashboard login={login} url={url} />
      )}
    </BudgetDataProvider>
  );
}
