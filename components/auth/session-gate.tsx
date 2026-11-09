"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";

import { getSupabase } from "@/lib/supabase";

const SessionContext = createContext<Session | null>(null);

/** Sesja zalogowanego użytkownika – tylko wewnątrz <SessionGate>. */
export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useSession działa tylko wewnątrz <SessionGate>.");
  }
  return session;
}

// Wpuszcza tylko zalogowanego użytkownika, resztę odsyła na /login. Sesja
// Supabase jest trzymana w przeglądarce, więc sprawdzamy ją po stronie klienta.
// Wspólna dla wersji komputerowej i mobilnej.
export function SessionGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    try {
      const supabase = getSupabase();

      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (cancelled) return;
          if (!data.session) {
            router.replace("/login");
            return;
          }
          setSession(data.session);
          setChecking(false);
        })
        // Uszkodzona sesja w pamięci przeglądarki – zamiast wiecznego
        // „Ładowanie…” odsyłamy na logowanie.
        .catch(() => {
          if (!cancelled) router.replace("/login");
        });

      // Reaguje na wylogowanie (także w innej karcie) i wygaśnięcie sesji.
      // Jedyne miejsce przekierowania na /login po wylogowaniu – przycisk
      // „Wyloguj” tylko woła `signOut()`.
      const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, next) => {
          if (cancelled) return;
          if (!next) {
            setSession(null);
            router.replace("/login");
          } else {
            // Odświeżenie tokenu (co godzinę) daje nowy obiekt sesji tego samego
            // użytkownika – aplikacja potrzebuje tylko jego id i e-maila, więc
            // nie przerysowujemy wtedy całego drzewa.
            setSession((prev) =>
              prev?.user.id === next.user.id && prev.user.email === next.user.email
                ? prev
                : next
            );
          }
        }
      );

      return () => {
        cancelled = true;
        listener.subscription.unsubscribe();
      };
    } catch {
      // Brak konfiguracji Supabase – strona logowania pokaże komunikat.
      router.replace("/login");
    }

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking || !session) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <p className="text-sm text-muted-foreground">Ładowanie…</p>
      </main>
    );
  }

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
