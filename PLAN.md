# Plan implementacji – zrobione etapy

Plan powstał 2026-10-23 po przeglądzie całego kodu. Tu są tylko zrobione etapy i rozstrzygnięte decyzje; jak działa aplikacja: [ARCHITECTURE.md](ARCHITECTURE.md), otwarte zadania (etap 5 i reszta): [DO_ZROBIENIA.md](DO_ZROBIENIA.md). Każdy etap zamyka się przez `npm run typecheck`, `npm run lint`, `npm test` i `npm run build`, zanim zacznie się następny. Stan na 2026-10-27 (po etapie 4): typecheck, lint i build czyste, 147/147 testów zielonych.

## Stan prac

| # | Etap | Stan |
|---|------|------|
| 0 | Audyt błędów i higiena repo | **Zrobione** (fazy A i B, weryfikacja kluczy obcych, CHECK i indeksów 2026-10-29). |
| 1 | Wydzielenie warstwy danych z `Dashboard` | **Zrobione** (faza C). |
| 2 | Filtrowanie transakcji | **Zrobione w części podstawowej:** wyszukiwarka, filtry, sortowanie i stan w URL na obu wersjach. Zakres kwot i dat, filtry w Raportach: DO_ZROBIENIA.md. |
| 3 | Zlecenia stałe | **Zrobione** (baza, logika, interfejs, `pg_cron`; karty na telefon w etapie 4). |
| 4 | Interfejs mobilny | **Zrobione** (fazy F–O, 2026-10-27): powłoka, formularze na pełnym ekranie, Kokpit, Historia z przesunięciem, Zlecenia jako karty, Raporty, „Więcej” z przełącznikiem wersji, PWA. Szczegóły: [ETAP4_MOBILE.md](ETAP4_MOBILE.md). |
| 5 | Dopracowanie interfejsu | Następny – zakres w [DO_ZROBIENIA.md](DO_ZROBIENIA.md). |

## Etapy 0–3 i fazy A–E (zrobione)

Szczegółowe listy zadań faz A–E są w historii gita (PLAN.md sprzed 2026-10-27); działanie opisuje ARCHITECTURE.md. W skrócie:

- **Etap 0 → fazy A i B (higiena i błędy w logice):** przywrócony `.env.example`, usunięta przypadkowa kopia `supabase/supabase/`, `schema.sql` zweryfikowany z bazą (kolumny, RLS, precyzja `amount`; klucze obce, CHECK i indeksy sprawdzone 2026-10-29: `user_id` → `auth.users` bez `CASCADE` (zostaje, zapisane w pliku), brakujące `CHECK (amount > 0)` i indeks `(user_id, date)` w `transactions` dodane migracją `20261029120000_transactions_amount_check.sql`). Dane roczne partiami przez `range()` (limit 1000 wierszy PostgREST), sumy w groszach, `parseAmount` z limitem `MAX_AMOUNT` także dla zleceń, porównanie kategorii bez wielkości liter i spacji. Rozbieżność stref czasowych (urządzenie vs `Europe/Warsaw`) świadomie zostawiona i opisana.
- **Etap 1 → faza C (warstwa danych):** `BudgetDataProvider` z `useBudgetData` / `useRecurringData` / `useYearlyData` (zlecenia i rok leniwie), zapisy w `lib/queries.ts`, wspólne komunikaty błędów (`lib/errors.ts`), `useTransactionForm`. Komponenty nie importują Supabase.
- **Faza D (nawigacja):** widok, okres i filtry w URL (`lib/dashboard-url.ts`, `useSyncExternalStore` zamiast `useSearchParams`); zakładka przez `pushState`, okres i filtry przez `replaceState`.
- **Faza E (przygotowanie pod mobile):** czcionki `latin-ext`, `viewport` z `viewport-fit=cover`, motyw systemowy z przełącznikiem, wybór wersji po stronie klienta, `SessionGate` i `AppShell` nad obiema wersjami.
- **Etap 2 (filtrowanie):** w Historii wyszukiwarka (początki wyrazów, bez polskich znaków), filtry typu, zleceń stałych i wielu kategorii, sortowanie po dacie i kwocie, stan w URL. Filtrowanie w przeglądarce na pobranym miesiącu, bez zapytań do bazy.
- **Etap 3 (zlecenia stałe):** tabela `recurring_rules` z RLS i `GRANT`, RPC `materialize_recurring()` i `upcoming_recurring()`, wykonywanie przy otwarciu aplikacji i przez `pg_cron` (23:05 UTC), zakładka „Zlecenia” z „Nadchodzącymi” na 30 dni, blokada usunięcia kategorii używanej przez zlecenia.

## Etap 4: PC i mobile (zrobione)

Program wdrożenia i decyzje z każdej fazy: [ETAP4_MOBILE.md](ETAP4_MOBILE.md); opis wersji mobilnej: ARCHITECTURE.md, sekcja „Wersja mobilna”.

- **Struktura:** wybór wersji po stronie klienta (`useUiVariant` w `AppShell`): `<Dashboard>` albo `<MobileApp>` nad wspólnym providerem, `lib/` i hookami. Komponenty w `components/desktop/`, `components/mobile/` i (używane przez obie) `components/shared/`.
- **Przełącznik** „Automatycznie / Komputerowa / Mobilna”: w ekranie „Więcej” (mobile) i w menu konta w nagłówku (desktop).
- **Interfejs mobilny:** dolna nawigacja z wystającym „+”, wybór okresu w nagłówku, formularze transakcji i zleceń na pełnym ekranie (klawiatura systemowa `decimal`), Kokpit z wykresem salda, lista transakcji z przesunięciem palcem, filtry w panelu z dołu, zlecenia jako karty, Raporty z oponką i strukturą transakcji, ekran „Więcej” z zarządzaniem kategoriami. Własne tokeny wyglądu (jasne i ciemne) tylko pod `data-ui="mobile"`.
- **Wspólna logika wydzielona przy okazji:** `useRecurringRuleForm`, `useToggleRecurring` / `useDeleteRecurring`, `useCategoryForm` / `useRemoveCategory`, `groupTransactions` (Raporty), `budgetUsage`, `signOut()`.
- **PWA:** manifest, ikony (w tym maskable i `apple-icon`), `appleWebApp`; instalacja sprawdzona na Androidzie i iOS. Bez trybu offline i powiadomień.
- **Poza zakresem (świadomie):** lista w DO_ZROBIENIA.md, sekcja „Odłożone”.

## Etap 5: dopracowanie interfejsu (w toku)

- **Poprawki wersji mobilnej (2026-10-31):** ciemny motyw do wyboru (System/Jasny/Ciemny w „Więcej”, desktopowy przycisk przechodzi przez trzy stany; zwykły granat/indygo z istniejących tokenów). Strzałka „Wstecz” w nagłówku (`history.back()` dla wpisów z przełączenia zakładki, w innym razie Kokpit; ukryta na Kokpicie), okres na środku. Karty „Przychody”/„Wydatki” otwierają listę miesiąca danego typu (`?ekran=przychody|wydatki`). Przyciski „+ Wydatek” / „+ Przychód” na Kokpicie (`?formularz=nowy-przychod` zachowuje typ po odświeżeniu) i podpis „Dodaj” pod „+”. Klawiatura w formularzu: „Dalej” i dotknięcie poza polem ją chowają, zwięźlejsza góra. Przesunięcie w bok przełącza widoki (poza wierszami listy).
- **Skarbonka (2026-10-31, tylko mobile, bez zmian w bazie):** kategorie domyślne „Skarbonka” (wydatek, wrzucenie zwykłym formularzem) i „Ze skarbonki” (przychód, zapisuje go tylko rozbicie; nie ma go w kafelkach ani w selektach, nazwy nie da się nadać własnej kategorii). Stan = wrzucenia po ostatnim rozbiciu (`summarizePiggyBank`, `lib/piggy-bank.ts`); rozbicie bierze całość z dzisiejszą datą, a jego wpis można tylko usunąć (cofa rozbicie; edycji nie ma w mobile ani na desktopie). Sekcja „Skarbonka” w „Więcej” wg makiety J2: świnka SVG, kwota ukryta do kliknięcia oka, potwierdzenie rozbicia w panelu z dołu, zwijana historia rozbitych skarbonek. Dane leniwie (`usePiggyBankData`), partiami przez `range()` (wspólne `fetchAllPages` z danymi rocznymi).

## Rozstrzygnięte decyzje

1. Wykonywanie zleceń: nadrabianie przy otwarciu aplikacji + `pg_cron` raz dziennie.
2. Wykrywanie urządzenia (faza E): po stronie klienta, szerokość ekranu + ręczny wybór w `localStorage`, bez `proxy.ts`.
3. Dane roczne: partie po `range()`, bez zmian w bazie.
4. Tryb ciemny (faza E, rozszerzony 2026-10-31): „Systemowy”, „Jasny” albo „Ciemny”; ciemny to granat/indygo z tokenów (bez wariantu OLED).
5. Zakres lat w selektorze (etap 4, faza G): zostaje sztywny `YEAR_ITEMS`, strzałki okresu gasną na końcu zakresu.
6. Testy: Vitest dla czystej logiki w `lib/` (147 testów po etapie 4, 151 po poprawkach mobile, 164 po skarbonce).
7. Precyzja kwot zleceń: tylko limit `MAX_AMOUNT` w kodzie, bez migracji.
8. Klawiatura kwoty w mobile (etap 4, faza H): systemowa `inputMode="decimal"`, sprawdzona na iOS i Androidzie.
9. Strzałka „Wstecz” w nagłówku mobile (2026-10-31): `history.back()`, a bez poprzedniego widoku w historii – Kokpit.
10. Gest zmiany widoku (2026-10-31): wszędzie w treści widoku poza wierszami z akcjami (nie od krawędzi – kolizja z gestem „Wstecz” Androida).
11. Skarbonka (2026-10-31): stan liczony od ostatniego rozbicia (nie „wrzucenia minus rozbicia”), remis dat rozstrzyga `created_at`; wrzucenia z datą w przyszłości czekają na następną skarbonkę, żeby rozbicie nie policzyło ich dwa razy.
