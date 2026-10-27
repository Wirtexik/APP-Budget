# Plan implementacji

Plan powstał na podstawie ARCHITECTURE.md, package.json i przeglądu całego kodu (2026-10-23). Każdy etap zamyka się przez `npm run typecheck`, `npm run lint`, `npm test` i `npm run build`, zanim zacznie się następny. Stan na 2026-10-24 (po fazach F–H etapu 4): typecheck, lint i build czyste, 110/110 testów zielonych.

## Stan prac

| # | Etap | Stan |
|---|------|------|
| 0 | Audyt błędów i higiena repo | Częściowo: Vitest dodany, audyt kodu zrobiony, fazy A i B zrobione. |
| 1 | Wydzielenie warstwy danych z `Dashboard` | **Zrobione** (faza C). |
| 2 | Filtrowanie transakcji | Częściowo: w Historii wyszukiwarka, menu „Filtry” (typ, zlecenia stałe, wiele kategorii) i „Sortuj” (data, kwota), stan w URL (faza D). Zostaje: kwoty, zakres dat. |
| 3 | Zlecenia stałe | **Zrobione** (baza, logika, interfejs, `pg_cron`). Układ na telefon przechodzi do etapu 4. |
| 4 | Interfejs mobilny | W trakcie: fazy F–H zrobione (katalogi i tokeny, powłoka z nawigacją i wyborem okresu, formularz transakcji). Dalej faza I (Kokpit i lista z przesunięciem). Szczegóły: [ETAP4_MOBILE.md](ETAP4_MOBILE.md). |
| 5 | Dopracowanie interfejsu | Do zrobienia. |

Kolejność etapów 1, 2, 4, 5 zostaje taka jak była: warstwa danych przed rozdzieleniem PC i mobile, filtry przed oboma interfejsami, dopracowanie na końcu.

## Zadania przed etapem 4 (plan wewnętrzny)

Lista do odhaczania. Fazy idą po kolei; w obrębie fazy kolejność jest dowolna. Każda faza kończy się zielonym `typecheck`, `lint`, `test` i `build`. Przed każdą fazą (zgodnie z CLAUDE.md) najpierw krótka propozycja architektury do akceptacji, potem kod.

### Faza A: higiena repo (mała, bez zmian w działaniu)

- [x] **Przywrócić `.env.example`** z pustymi `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Plik nie jest ignorowany (wyjątek `!.env.example` w `.gitignore`).
- [x] **Usunąć `supabase/supabase/`.** Przypadkowa kopia z `supabase init` w złym katalogu (`config.toml` różnił się tylko `project_id`, `.gitignore` identyczny). Usunięta z gita, nic się do niej nie odwoływało.
- [x] **Opis kwot w dokumentacji.** Sprawdzone w Supabase 2026-10-23: `transactions.amount` to `numeric(10,2)` (maks. 99 999 999,99). Wpisane do `schema.sql` i ARCHITECTURE.md. `recurring_rules.amount` ma `numeric(12, 2)`, więc różni się od transakcji (patrz faza B).
- [x] **Uzupełnić `schema.sql`** o listę obu migracji (dopisana `20261023120000_recurring_cron.sql`).

### Faza B: błędy w logice (`lib/`)

- [x] **Limit 1000 wierszy w `fetchYearlyTransactions`.** Rok pobiera się partiami po 1000 przez `range()`, aż przyjdzie niepełna partia (decyzja: partie zamiast RPC, baza bez zmian). Założenie: `max_rows` w Supabase ≥ 1000 (domyślne). Dane miesiąca nadal idą jednym zapytaniem (ponad 1000 wpisów w miesiącu uznajemy za nierealne).
- [x] **Sortowanie danych rocznych:** `date, created_at, id` malejąco, jak w `fetchDashboardData`. Potrzebne też do stabilnego stronicowania.
- [x] **Sumy w groszach:** `toGrosze` / `fromGrosze` w `lib/budget.ts`, używane w `computeTotals` i `groupTransactions` (`reports-tab.tsx`). Testy w `lib/budget.test.ts` (`parseAmount`, grosze, `computeTotals`, `monthRange`, `yearRange`, `pluralEntries`).
- [x] **`parseAmount`:** pomija spacje (także twarde), przyjmuje `,` i `.`, najwyżej 2 miejsca po przecinku, od 0,01 do `MAX_AMOUNT` = 99 999 999,99. Odrzuca `1e3` i `1.000,50`. Formularze transakcji pokazują wspólny komunikat `AMOUNT_ERROR` z zakresem kwoty.
- [x] **Różna precyzja kwot:** `MAX_AMOUNT` z `lib/budget.ts` obowiązuje też zlecenia (`lib/recurring.ts` nie ma już własnego limitu 9 999 999 999,99). Decyzja: bez migracji, `recurring_rules.amount` zostaje `numeric(12, 2)`.
- [x] **`sameCategory`:** obie nazwy przycinane i porównywane bez wielkości liter. Test w `lib/categories.test.ts`.
- [x] **Strefy czasowe:** bez zmian w kodzie, rozbieżność („dziś” urządzenia vs `Europe/Warsaw` w zleceniach) opisana w ARCHITECTURE.md, sekcja „Konwencje i pułapki”.
- [x] **`YEAR_ITEMS`:** decyzja: zostaje sztywny zakres. Wrócić przy mobilnym selektorze okresu w etapie 4.

### Faza C: warstwa danych (etap 1, rozszerzony po audycie)

Dane i zapisy były rozrzucone po komponentach, więc widok mobilny musiałby je kopiować. Zrobione 2026-10-23.

- [x] **Provider `BudgetDataProvider` + hook `useBudgetData`** (`lib/hooks/budget-data.tsx`): okres (`selectPeriod`), kategorie, `categoryById`, transakcje miesiąca, `loading`, `loadError`, `refresh`, `afterSave`, numery żądań i jednorazowe `materializeRecurring()`. `Dashboard` tylko opakowuje widok w provider.
- [x] **Dane zleceń w providerze:** `useRecurringData()` (zlecenia, „Nadchodzące”, `afterChange`). Decyzja: pobierane leniwie, przy pierwszym użyciu hooka, potem zostają w providerze. `RecurringTab` i dialogi zleceń nie mają już własnego stanu danych.
- [x] **Dane roczne w providerze:** `useYearlyData()` dla `period.year`, też leniwie. Naprawiony przy okazji błąd: po zapisie transakcji raport roczny pokazywał stare dane. `refresh()` odświeża teraz rok, o ile był pobrany.
- [x] **Zapisy w `lib/queries.ts`:** `insertCategory`, `deleteCategory` (`inUse` przy `23503`), `countCategoryUsage`, `deleteTransaction`. Komunikat o blokadzie usunięcia: `categoryUsageMessage()` w `lib/categories.ts` (z testem). Komponenty nie importują `getSupabase` (poza wylogowaniem w `Dashboard`, faza D).
- [x] **Wspólne komunikaty błędów `lib/errors.ts`:** `errorMessage(error, overrides?)` (FK, duplikat, CHECK, uprawnienia, wygasła sesja, brak sieci), z testami. `recurring-queries.ts` podaje tylko swoje nadpisania.
- [x] **Logika formularza transakcji:** `validateTransactionInput` (`lib/transaction-input.ts`, z testami; sprawdza też, czy data istnieje) i hook `useTransactionForm({ kind: "create", type } | { kind: "edit", transaction })` w `lib/hooks/`. Trzy formularze mają tylko pola. Edycja sprawdza teraz także datę.
- [x] **Kwota ze znakiem:** `components/shared/signed-amount.tsx`, używana w tabeli transakcji i w zleceniach.
- [x] **`Id` = `string`** (uuid). Bez `String(id)` w mapach; helper `categoryOf(t, categoryById)` dla `category_id: null`. `Resolved` to unia, więc bez rzutowań `as Id`. `Period` i `periodLabel` przeniesione do `lib/budget.ts`, `UPCOMING_DAYS` do `lib/recurring.ts`.
- **Zasada podziału:** kontenery (zakładki, formularze, dialogi zapisu) czytają dane z hooków; komponenty prezentacyjne (`TransactionsTable`, `RecurringRulesList`, `UpcomingList`, `SummaryCards`, `BudgetGauge`) zostają na propsach, żeby mobile mógł dać własne widoki.

### Faza D: nawigacja i stan widoku

Zrobione 2026-10-23.

- [x] **Stan widoku w URL:** `lib/dashboard-url.ts` (czysta logika, testy w `lib/dashboard-url.test.ts`) i hook `useDashboardUrl()` w `lib/hooks/use-dashboard-url.ts`. Format: `?widok=historia&rok=2026&miesiac=9&q=kino&typ=wydatek&stale=1&cat=id1,id2&sort=amount_desc`. Wartości domyślne (Kokpit, bieżący miesiąc, brak filtrów) nie trafiają do URL; błędne wartości wracają do domyślnych, każda osobno. Miesiąc w URL liczony od 1, rok tylko z zakresu `YEAR_ITEMS`.
- [x] **Push vs replace (decyzja):** zmiana zakładki to `pushState` („Wstecz” cofa do poprzedniej zakładki), okres i filtry to `replaceState` (przeglądanie miesięcy i wpisywanie liter nie zaśmieca historii). „Wstecz” przywraca poprzedni wpis w całości, czyli także okres i filtry, jakie wtedy były.
- [x] **`useSyncExternalStore` zamiast `useSearchParams`:** Next 16 aktualizuje `useSearchParams` po `pushState` w `startTransition` (`app-router.js`), więc sterowane pole wyszukiwania mogłoby gubić litery. Hook czyta `window.location.search` synchronicznie i nasłuchuje `popstate`; `<Suspense>` niepotrzebny (Dashboard renderuje się dopiero po sprawdzeniu sesji w przeglądarce).
- [x] **Sterowane zakładki:** `Tabs value/onValueChange` w `Dashboard`; lista `VIEWS` i typ `View` w `lib/dashboard-url.ts` (do użycia też w dolnej nawigacji).
- [x] **Okres w URL:** `BudgetDataProvider` dostaje `period` i `onPeriodChange` z zewnątrz. Czyszczenie starych danych przy zmianie okresu dzieje się w trakcie renderu (porównanie z `shownPeriod`), więc działa też po „Wstecz”. `currentPeriod()` i `samePeriod()` w `lib/budget.ts`.
- [x] **Ukryte zakładki:** `keepMounted` dopiero po pierwszym otwarciu zakładki (zbiór `visited` w `DashboardView`). Suwak Miesiąc/Rok w Raportach i niezapisane formularze przetrwają przełączanie, a dane zleceń i roku nadal pobierają się leniwie.
- [x] **Filtry z URL:** `filtersFromParams` / `writeFilterParams` / `sanitizeFilters` w `lib/filters.ts` (z testami). `sanitizeFilters` pomija id kategorii, których nie ma albo które nie pasują do typu (stary link, usunięta kategoria).
- [x] **Wylogowanie:** przycisk tylko woła `signOut()`; przekierowanie na /login robi wyłącznie listener `onAuthStateChange` w `app/page.tsx`. `signOut()` usuwa sesję lokalnie także przy błędzie sieci, więc zdarzenie zawsze przychodzi.
- [ ] **Do sprawdzenia w przeglądarce** (po zalogowaniu): przełączanie zakładek i „Wstecz”, odświeżenie z filtrami i innym miesiącem, szybkie pisanie w wyszukiwarce, suwak w Raportach po powrocie na zakładkę, wylogowanie.

### Faza E: przygotowanie pod mobile (bez interfejsu mobilnego)

Zrobione 2026-10-23.

- [x] **Czcionka:** `subsets: ["latin", "latin-ext"]` w `Geist` i `Geist_Mono`. Sprawdzone w buildzie: `@font-face` dla `latin-ext` był w CSS już wcześniej (`subsets` decyduje tylko o preloadzie), więc polskie litery doczytywały się z opóźnieniem. Teraz preloadowane są 4 pliki (latin + latin-ext × 2 czcionki).
- [x] **`export const viewport`:** `viewportFit: "cover"` i `themeColor` (jasny `#ffffff` / ciemny `#0a0a0a` z `media`). `width=device-width, initial-scale=1` Next dodaje sam. Sprawdzone w wygenerowanym HTML.
- [x] **Tryb ciemny (decyzja: systemowy z przełącznikiem, zrobione od razu):** `lib/theme.ts` (z testami), `useTheme` + `ThemeSync` w `lib/hooks/use-theme.ts`, `ThemeToggle` w `components/shared/` i w nagłówku: jedno kliknięcie przełącza „Systemowy” (księżyc, domyślny) ↔ „Jasny” (słońce), bez rozwijanego menu i bez osobnej opcji „Ciemny”. Skrypt w `<head>` ustawia klasę `dark` przed renderem (`suppressHydrationWarning` na `<html>`); `Toaster` i `theme-color` idą za motywem. Wybór w `localStorage` (`motyw` = `light`), brak wpisu = systemowy.
- [x] **Wybór wersji (decyzja: po stronie klienta, bez `proxy.ts`):** `lib/ui-variant.ts` (z testami) i `useUiVariant()`. Ręczny wybór w `localStorage` (`wersja`) ma pierwszeństwo, bez niego `matchMedia("(max-width: 767px)")`, na bieżąco. Wspólny magazyn ustawień urządzenia: `lib/hooks/preference-store.ts`. `/` zostaje statyczne.
- [x] **Bramka sesji:** `components/auth/session-gate.tsx` (+ `useSession()`), `app/page.tsx` to Server Component: `<SessionGate><AppShell /></SessionGate>`. `components/app-shell.tsx` stawia `useDashboardUrl` i `BudgetDataProvider` nad wyborem wersji, więc przełączenie nie gubi stanu. `Dashboard` dostaje `login` i `url` z `AppShell`.
- [x] **ARCHITECTURE.md** zaktualizowany po fazach C–E (przepływ danych, pliki w `lib/` i `lib/hooks/`, stan w URL, motyw, wybór wersji, konwencje). Opis „mobile-first” poprawiony.
- [ ] **Do sprawdzenia w przeglądarce:** motyw (przełącznik, systemowy, brak mignięcia po odświeżeniu, komunikaty), polskie litery, logowanie i wylogowanie przez `SessionGate`.

## Etap 0: błędy i higiena

Zastąpiony przez fazy A i B powyżej. Z pierwotnej listy:

- `.env.example`: przywrócony (faza A).
- `schema.sql` vs prawdziwa baza: kolumny i RLS zweryfikowane 2026-10-18, precyzja `amount` 2026-10-23; klucze obce, CHECK i indeksy nadal nie.
- Limit 1000 wierszy: naprawione w `fetchYearlyTransactions` (faza B).
- Dokładność kwot: sumy w groszach (faza B).
- Strefy czasowe: sprawdzone, bez błędu w kodzie klienta (faza B, tylko dokumentacja).
- Testy: Vitest, 79 testów po fazie B (`recurring`, `filters`, `budget`, `categories`, `errors`, `transaction-input`, `dashboard-url`); po fazie H etapu 4 jest ich 110 (doszły `ui-variant`, `theme`, `category-style`, `amount-input`).

## Etap 1: warstwa danych

Zrobiony w fazie C. Cel: desktop i mobile mają różne widoki, ale jedno źródło danych i jedne funkcje zapisu.

## Etap 2: filtrowanie transakcji

**Zrobione** (Historia, szczegóły w ARCHITECTURE.md, sekcja „Historia”):

- Logika w `lib/filters.ts` (czysty TypeScript, testy w `lib/filters.test.ts`), pasek w `components/desktop/history-filters.tsx`.
- Wyszukiwarka od pierwszej litery, w opisie i nazwie kategorii. Dopasowuje tylko początki wyrazów, bez wielkości liter i polskich znaków.
- Menu „Filtry” (`components/ui/dropdown-menu.tsx`): typ Uznania/Obciążenia, „Zlecenia stałe” (łączy się z typem) i wiele kategorii, z licznikiem na przycisku. Dawny `transaction-type-filter.tsx` jest usunięty.
- Menu „Sortuj”: data i kwota, rosnąco i malejąco. Nic nie zaznaczone oznacza kolejność domyślną.
- „Wyczyść wszystko” czyści wyszukiwanie, filtry i sortowanie.
- **Decyzja:** filtrowanie w przeglądarce, na transakcjach miesiąca, które już są pobrane. Wynik zmienia się przy każdej literze bez zapytań do bazy. Zapytania do Supabase (`ilike`, `in`, `gte/lte`) są potrzebne dopiero przy filtrach wykraczających poza miesiąc.
- Baza się nie zmienia.

**Zostaje:**

- Zakres kwot i zakres dat (obok globalnego miesiąca). Zakres dat wymaga zapytania do Supabase.
- ~~Stan w URL~~: zrobiony w fazie D.
- Filtry w Raportach (tryb „Rok”).
- Mobilny wysuwany panel z dołu: w etapie 4.

## Etap 3: zlecenia stałe (zrobione)

Szczegóły działania są w ARCHITECTURE.md (baza, sekcja „Zlecenia”, struktura katalogów). Tu tylko to, co zostało zrobione, i co jeszcze otwarte.

**Zrobione:**

- Baza: migracja `supabase/migrations/20261018120000_recurring_rules.sql` (tabela `recurring_rules`, `transactions.recurring_rule_id`, RLS, RPC `materialize_recurring()` i `upcoming_recurring()`).
- Logika: `lib/recurring.ts` (typy, presety, walidacja, opisy) i `lib/recurring-queries.ts` (CRUD, wstrzymanie, RPC), z testami.
- Interfejs: zakładka „Zlecenia” w `components/desktop/recurring/` (lista, formularz dodawania i edycji, wstrzymanie i wznowienie, usuwanie, „Nadchodzące” na 30 dni).
- Wykonywanie: `materializeRecurring()` przy otwarciu aplikacji, przed pierwszym pobraniem danych, oraz po każdej zmianie zlecenia.
- Wykonane transakcje oznaczone ikoną zlecenia w tabelach.
- `pg_cron` raz dziennie o 23:05 UTC: migracja `supabase/migrations/20261023120000_recurring_cron.sql`. Wywołanie przy otwarciu aplikacji zostaje jako zabezpieczenie.
- Usuwanie kategorii: `CategoryForm` sprawdza transakcje i zlecenia, a komunikat mówi, co blokuje usunięcie.
- Uprawnienia `GRANT` do `recurring_rules` (wymóg Supabase od 30.10.2026).

**Przeniesione do etapu 4:** układ zleceń na telefon. Cztery zakładki w nagłówku mogą się tam ściskać.

## Etap 4: PC i mobile

Program wdrożenia (wymagania, fazy F–O): [ETAP4_MOBILE.md](ETAP4_MOBILE.md). Zrobione fazy F–H (2026-10-24), klawiatura kwoty sprawdzona na iOS i Androidzie (zostaje systemowa).

- **Struktura:** wybór wersji po stronie klienta (`useUiVariant` w `AppShell`, faza E): w miejsce drugiego `<Dashboard>` wchodzi `<MobileApp>`. Wspólne `lib/`, provider i hooki z fazy C; osobne komponenty w `components/desktop/` i `components/mobile/`. Dawne `components/dashboard/` jest już w `components/desktop/` (faza F).
- **Przełącznik ręczny** „Automatycznie / Komputerowa / Mobilna”: `setOverride` z `useUiVariant` (zapis w `localStorage`). Do fazy M w mobilnym ekranie „Więcej” jest tymczasowy przycisk „Wersja komputerowa”.
- **Interfejs mobilny, całkiem inny niż desktopowy:**
  - dolna nawigacja (Kokpit, Historia, „+”, Zlecenia, Raporty), z odstępem na `safe-area`;
  - pełnoekranowy formularz dodawania z dużym polem kwoty (na `useTransactionForm`);
  - lista transakcji z przesunięciem palcem (edycja i usuwanie);
  - filtry w panelu wysuwanym z dołu;
  - zlecenia w układzie listy kart zamiast tabeli.
- **PWA:** manifest (`app/manifest.ts`) i ikony, żeby dało się zainstalować aplikację na telefonie.
- Po tym etapie zaktualizować ARCHITECTURE.md (opis wersji mobilnej).

## Etap 5: interfejs

Spójne stany ładowania (szkielety), puste stany, komunikaty błędów, dostępność (focus, kontrast). Tryb ciemny działa od fazy E; zostaje przejrzenie kolorów w ciemnym motywie (gradienty kart, wykres, kolory kwot). Szczegóły do ustalenia po zobaczeniu aplikacji na obu urządzeniach.

- **Zmiana typu przy edycji transakcji na desktopie** (decyzja z fazy H etapu 4, 2026-10-24). W mobile edycja pozwala przełączyć Wydatek/Przychód: zmiana typu czyści kategorię (zapis zablokowany, dopóki nie wybierze się nowej), powrót do pierwotnego typu przywraca pierwotną kategorię. Desktopowe `EditTransactionDialog` nadal trzyma typ wpisu (lista kategorii tylko tego typu), więc wersje różnią się w tej jednej rzeczy. Do wyrównania: przełącznik typu w oknie edycji na `setType` z `useTransactionForm` (hook już to obsługuje). Skutek uboczny jak w mobile: wpis ze zlecenia stałego może zmienić typ niezależnie od zlecenia.
- **Potwierdzenie usunięcia kategorii na desktopie** (decyzja z fazy M etapu 4, 2026-10-27). W mobile „Usuń” przy kategorii otwiera panel z potwierdzeniem, na desktopie kosz w `CategoryForm` usuwa od razu (blokada dla używanych kategorii działa w obu). Do wyrównania: okno potwierdzenia na desktopie na tym samym `useRemoveCategory`.

## Decyzje do podjęcia

1. ~~Wykonywanie zleceń~~ Rozstrzygnięte: nadrabianie przy otwarciu aplikacji + `pg_cron` raz dziennie.
2. ~~Wykrywanie urządzenia~~ Rozstrzygnięte (faza E): po stronie klienta, szerokość ekranu + ręczny wybór w `localStorage`, bez `proxy.ts`.
3. ~~Dane roczne~~ Rozstrzygnięte: partie po `range()`, bez zmian w bazie.
4. ~~Tryb ciemny~~ Rozstrzygnięte (faza E): systemowy z przełącznikiem.
5. ~~Zakres lat w selektorze~~ Rozstrzygnięte w etapie 4 (faza G): zostaje sztywny `YEAR_ITEMS`, strzałki okresu gasną na końcu zakresu.
6. ~~Testy~~ Vitest jest dodany, `lib/budget.ts` i `lib/categories.ts` pokryte w fazie B.
7. ~~Precyzja kwot zleceń~~ Rozstrzygnięte: tylko limit `MAX_AMOUNT` w kodzie, bez migracji.
