"use client";

import { Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DashboardUrl } from "@/lib/hooks/use-dashboard-url";
import { useUiVariant } from "@/lib/hooks/use-ui-variant";

// Korzeń wersji mobilnej. `data-ui="mobile"` włącza tokeny wyglądu z
// `app/globals.css`, więc komponenty `ui/` dostają tu nowy wygląd, a desktop
// zostaje bez zmian. Nagłówek, widoki i dolna nawigacja dochodzą w fazach G–M.
export function MobileApp({ login, url }: { login: string; url: DashboardUrl }) {
  const { setOverride } = useUiVariant();

  return (
    <div
      data-ui="mobile"
      data-slot="mobile-root"
      data-view={url.view}
      className="flex min-h-dvh flex-col bg-background pt-[env(safe-area-inset-top)] text-foreground"
    >
      <header className="px-4 pt-4">
        <p className="text-sm text-muted-foreground">{login}</p>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold">Wersja mobilna w budowie</p>
        {/* Tymczasowe wyjście do czasu przełącznika wersji w „Więcej” (faza M). */}
        <Button variant="outline" onClick={() => setOverride("desktop")}>
          <Monitor />
          Wersja komputerowa
        </Button>
      </main>

      <nav
        aria-label="Nawigacja"
        className="h-16 shrink-0 rounded-t-3xl bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_-16px_var(--glow)]"
      />
    </div>
  );
}
