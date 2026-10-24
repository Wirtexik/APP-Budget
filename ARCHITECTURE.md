# Architektura – Budżet

Aplikacja do prowadzenia domowego budżetu (przychody, wydatki, kategorie, historia, raporty). Interfejs po polsku. Dziś jedna wersja (komputerowa, responsywna); wersja mobilna powstaje w etapie 4 (PLAN.md) na tej samej warstwie danych.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (tryb ścisły, bez `any`)
- **Tailwind CSS 4** + **shadcn/ui** (styl `base-nova`, oparty na Base UI, nie Radix) – komponenty w `components/ui/`
- **Lucide** (`lucide-react`) – ikony; **Recharts** – wykresy; **Sonner** – komunikaty (toast)
- **Supabase** (`@supabase/supabase-js`) – baza PostgreSQL i logowanie
- Zmienne środowiskowe: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (szablon: `.env.example`, prawdziwe wartości w `.env.local`, który jest w `.gitignore`)

## Baza danych (Supabase)

Źródło prawdy: [`supabase/schema.sql`](supabase/schema.sql), odtworzony 2026-10-18 z prawdziwej bazy. Kolumny, typy, wartości domyślne i polityki RLS są zweryfikowane. Klucze obce, CHECK i indeksy nie są (oznaczone w pliku jako „niezweryfikowane”).

Wszystkie `id` to `uuid` (`gen_random_uuid()`). `user_id` w `categories` i `transactions` **nie ma wartości domyślnej** – aplikacja wysyła go sama.

**`categories`** – `id`, `user_id`, `name`, `type` (`'wydatek'` lub `'przychod'`), `created_at`.

**`transactions`** – `id`, `user_id`, `category_id` → `categories.id` (w bazie dopuszcza NULL), `amount` (`numeric(10,2)`, maks. 99 999 999,99, zawsze dodatnie), `date` (`date`), `description` (opcjonalny), `created_at` (`default now()`), `recurring_rule_id` → `recurring_rules.id` (`ON DELETE SET NULL`, unikalne razem z `date`).

**`recurring_rules`** (zlecenia stałe, migracja [`supabase/migrations/20261018120000_recurring_rules.sql`](supabase/migrations/20261018120000_recurring_rules.sql)) – `category_id` (`RESTRICT`), `amount`, `description`, `frequency` (`daily`/`weekly`/`monthly`/`yearly`) × `interval_count`, `start_date`, `end_date`, `max_occurrences`, `is_active`. Kolumny `run_index`, `occurrences_count`, `next_run_date` są wewnętrzne: trigger nadpisuje to, co wyśle klient, a zmienia je tylko `materialize_recurring()`.

- N-ty termin = `start_date + N × okres` (31. dzień → ostatni dzień krótszego miesiąca, bez dryfu).
- Transakcje tworzy RPC `materialize_recurring()` (idempotentne, nadrabia zaległe terminy, „dziś” liczone w `Europe/Warsaw`). Wywołuje je aplikacja przy otwarciu oraz `pg_cron` raz dziennie o 23:05 UTC (migracja [`supabase/migrations/20261023120000_recurring_cron.sql`](supabase/migrations/20261023120000_recurring_cron.sql); działa jako `postgres`, więc obejmuje wszystkich użytkowników). Podgląd przyszłych terminów: RPC `upcoming_recurring(p_until)`.
- Wstrzymanie i zmiana harmonogramu nie nadrabiają przeszłości. Nowe zlecenie z datą startu w przeszłości nadrabia w bazie, ale aplikacja na to nie pozwala (`validateRuleInput` blokuje start i koniec w przeszłości; przy edycji niezmieniona data startu może być przeszła).

Zasady, na których opiera się cała aplikacja:

- **Kwota jest zawsze dodatnia.** Czy wpis to przychód czy wydatek, wynika wyłącznie z `categories.type`. Zmiana typu kategorii przeklasyfikowuje więc wszystkie jej dotychczasowe transakcje (dialog edycji kategorii ostrzega o tym).
- **`created_at` jest wymagane** – służy jako drugie kryterium sortowania przy tej samej dacie (`date desc, created_at desc, id desc`).
- **RLS włączone na wszystkich tabelach**, polityka `for all` z warunkiem `auth.uid() = user_id`. To RLS jest prawdziwym zabezpieczeniem danych; klucz `anon` jest publiczny z założenia. Brak polityki `UPDATE`/`DELETE` nie zwraca błędu, tylko 0 wierszy – kod to wykrywa i pokazuje komunikat.
- **Każda nowa tabela musi mieć jawne `GRANT`.** Od 30.10.2026 Supabase nie daje nowym tabelom w `public` domyślnego dostępu przez Data API – bez uprawnień aplikacja dostaje `permission denied`. Migracja tworząca tabelę kończy się więc poleceniem `grant select, insert, update, delete on table public.<tabela> to anon, authenticated, service_role;` (wzór: migracja `recurring_rules`). `GRANT` otwiera tylko dostęp do tabeli; to, które wiersze są widoczne, nadal ustala RLS, więc tabela potrzebuje obu.
- **Autoryzacja:** użytkownik wpisuje sam login, a aplikacja loguje go przez `signInWithPassword` jako `login@budzet.local` (`lib/auth.ts`). Konta trzeba tworzyć w Supabase (Auth → Users) z takim adresem i opcją *Auto Confirm User*.
- **Kategorie domyślne** (`DEFAULT_CATEGORIES` w `lib/categories.ts`) istnieją tylko w kodzie. Wiersz w bazie powstaje dopiero przy pierwszym użyciu (`ensureCategory` w `lib/queries.ts`). Kategorie z bazy pasujące nazwą i typem do domyślnych nie są „własne” – nie da się ich usunąć ani edytować.
- Kategorii z transakcjami lub zleceniami stałymi nie da się usunąć (sprawdzenie obu w `CategoryForm` + `RESTRICT` w bazie). Komunikat mówi, co blokuje usunięcie.

## Funkcje

**Stan widoku w URL** (`lib/dashboard-url.ts`, hook `useDashboardUrl`): aktywna zakładka, oglądany okres i filtry Historii, np. `/?widok=historia&rok=2026&miesiac=9&q=kino&typ=wydatek&stale=1&cat=id1,id2&sort=amount_desc`. Wartości domyślne (Kokpit, bieżący miesiąc, brak filtrów) nie trafiają do URL, błędne wracają do domyślnych. Zmiana zakładki dodaje wpis w historii (`pushState`, „Wstecz” cofa do poprzedniej zakładki), okres i filtry podmieniają bieżący (`replaceState`). „Wstecz” przywraca poprzedni wpis w całości, łącznie z okresem i filtrami.

**Globalny filtr miesiąca i roku** (nagłówek) służy **wyłącznie do filtrowania widoku**. Zapis z dowolną datą (wstecz i w przód) jest zawsze dozwolony, a po zapisie filtr zostaje bez zmian. Gdy zapisany wpis wypada poza oglądany miesiąc, pojawia się komunikat tłumaczący, czemu go nie widać.

**Kokpit**
- Karty Saldo / Przychody / Wydatki wybranego miesiąca (kolorowe gradienty, ikony).
- Formularz wydatku (`TransactionForm`) – tylko kategorie typu `wydatek`, własna data.
- Okno szybkiego przychodu (przycisk „+” na karcie Przychody, `QuickIncomeDialog`) – tylko kategorie typu `przychod`, **własna, niezależna data**. Oba formularze mają osobne stany i po zapisie czyszczą się całkowicie.
- Zarządzanie kategoriami (`CategoryForm`): dodawanie, edycja nazwy i typu, usuwanie; lista własnych kategorii przewija się (`max-h-32`).
- 5 ostatnich transakcji z edycją i usuwaniem.

**Historia** – pełna lista transakcji miesiąca z edycją i usuwaniem oraz paskiem (`HistoryFilters`, logika w `lib/filters.ts`): wyszukiwarka w opisie i nazwie kategorii (od pierwszej litery, dopasowuje tylko **początki wyrazów**, bez wielkości liter i polskich znaków), rozwijane menu „Filtry” (typ Uznania/Obciążenia, „Zlecenia stałe” – tylko wpisy z `recurring_rule_id`, łączy się z typem – i wiele kategorii, licznik na przycisku), menu „Sortuj” (data lub kwota, rosnąco/malejąco; nic nie zaznaczone = kolejność domyślna) i „Wyczyść wszystko”. Filtrowanie odbywa się w przeglądarce na danych miesiąca; filtry są w URL i zostają przy zmianie miesiąca. Id kategorii z URL, których nie ma (stary link, usunięta kategoria) albo które nie pasują do typu, są pomijane (`sanitizeFilters`).

**Zlecenia** – lista zleceń stałych (status, harmonogram, następny termin) z edycją, wstrzymaniem/wznowieniem jednym kliknięciem i usuwaniem, formularz dodawania/edycji (presety częstotliwości, zakończenie: bezterminowo / data / liczba wykonań) oraz „Nadchodzące” na 30 dni. `materializeRecurring()` jest wołane raz przy otwarciu aplikacji (przed pierwszym pobraniem danych) i po każdej zmianie zlecenia. Transakcje ze zleceń mają w tabelach ikonę `Repeat`.

**Raporty** – suwak **Miesiąc / Rok** (`Tabs`) decyduje, z jakich danych korzystają trzy elementy poniżej:
- **Wskaźnik budżetu** (`BudgetGauge`, donut z Recharts): w środku tylko kwota z napisem „Zostało” lub „Na minusie”, procent wykorzystania jako tekst pod wykresem. **Trzy kolory:** wydatki < przychody → część zużyta szara, pozostała zielona; wydatki ≥ przychody → całe koło czerwone.
- Legenda kategorii wydatków obok wskaźnika (`max-h-56`, przewijana).
- Akordeon „Struktura transakcji”: Wydatki/Przychody → kategorie → transakcje.
- Tryb „Rok” bierze rok z globalnego filtra i ignoruje miesiąc. Dane roczne pobierają się w tle (`fetchYearlyTransactions`).

**Zakładki** są sterowane z URL. Ukryta zakładka zostaje zamontowana od pierwszego otwarcia (`useVisited`, w desktopie przez `keepMounted`), więc suwak w Raportach i niezapisane formularze przetrwają przełączanie, a dane zleceń i roku nadal pobierają się leniwie.

**Motyw** – przycisk `ThemeToggle` w nagłówku (logika w `lib/theme.ts`, hook `useTheme`): jedno kliknięcie przełącza „Systemowy” (ikona księżyca, domyślny, idzie za `prefers-color-scheme`) ↔ „Jasny” (ikona słońca, zawsze jasny). Osobnej opcji „Ciemny” nie ma. „Jasny” zapisuje się w `localStorage` (`motyw` = `light`), brak wpisu = systemowy. Ciemny motyw to klasa `dark` na `<html>`: ustawia ją skrypt w `<head>` przed renderem (bez mignięcia jasnego ekranu), a potem `ThemeSync`. Komunikaty (`Toaster`) i kolor paska przeglądarki (`theme-color`) idą za motywem.

**Wybór wersji** (komputerowa / mobilna) – po stronie klienta, bez `proxy.ts` i User-Agent (`lib/ui-variant.ts`, hook `useUiVariant`). Ręczny wybór w `localStorage` (`wersja`) ma pierwszeństwo; bez niego decyduje `matchMedia("(max-width: 767px)")`, na bieżąco (obrót tabletu, zwężenie okna). Powód: sesja Supabase jest w przeglądarce, więc pulpit i tak renderuje się dopiero po jej sprawdzeniu, a serwer nie ma nic do pokazania wcześniej; `/` zostaje statyczne. Grupy tras `(desktop)`/`(mobile)` pod tym samym `/` odpadają (konflikt ścieżek). Wersja mobilna to `MobileApp` (`components/mobile/`); jej tokeny wyglądu (`--primary`, `--background`, `--radius`, `--income`, `--glass`, `--glow`…) są w `app/globals.css` pod `[data-ui="mobile"]` i `.dark [data-ui="mobile"]`, więc desktop się nie zmienia. Panele `Drawer` renderują się w portalu, dlatego sam popup też ma `data-ui="mobile"`. Formularz i ekran „Więcej” to nakładki sterowane z URL (`?formularz=nowy|<uuid>|zlecenie|zlecenie-<uuid>`, `?ekran=wiecej`): otwarcie robi `pushState` ze znacznikiem `{ overlay: true }` w `history.state`, zamknięcie `history.back()`, więc systemowe „Wstecz” zamyka nakładkę zamiast wychodzić z aplikacji. Bez znacznika (odświeżona strona) parametr znika przez `replaceState`. Do `history.*State` przekazujemy tylko własny znacznik – Next dokleja swój stan sam, a z `__NA` od nas pominąłby aktualizację routera. Desktop czyści oba parametry. Przełącznik ręczny dojdzie w fazie M; do tego czasu ekran „Więcej” ma tymczasowy przycisk „Wersja komputerowa”.

## Struktura katalogów

```
app/
  layout.tsx            layout (Server Component): czcionki (latin + latin-ext), viewport
                        (viewport-fit=cover, theme-color), skrypt motywu, <ThemeSync />, <Toaster />
  page.tsx              Server Component: <SessionGate><AppShell /></SessionGate>
  login/page.tsx        logowanie loginem (dokleja @budzet.local)
components/
  auth/session-gate.tsx bramka sesji (klient): sprawdzenie sesji, listener, przekierowanie
                        na /login; sesja dla dzieci przez useSession()
  app-shell.tsx         wspólna podstawa obu wersji: useDashboardUrl + BudgetDataProvider,
                        wybór wersji (useUiVariant)
  desktop/              wersja komputerowa: dashboard.tsx (zakładki, dialogi edycji/usuwania)
                        + formularze, dialogi, tabele, karty, history-filters.tsx (pasek
                        Historii), reports-tab.tsx, budget-gauge.tsx
    recurring/          zakładka „Zlecenia”: recurring-tab.tsx (dialogi), lista zleceń,
                        „Nadchodzące”, formularz, dialog usuwania
  mobile/               wersja mobilna (etap 4): mobile-app.tsx (korzeń z data-ui="mobile",
                        widoki, pasek błędu/wczytywania, nakładki), mobile-header.tsx
                        („‹ miesiąc ›”, awatar, tytuł), period-drawer.tsx (panel okresu),
                        bottom-nav.tsx, full-screen.tsx (ekran na pełnym ekranie, stopka
                        nad klawiaturą), delete-transaction-drawer.tsx (potwierdzenie)
    transaction-form/   formularz transakcji na pełnym ekranie: przełącznik typu, pole
                        kwoty (amount-field), kafelki kategorii, panel „+ Nowa” kategoria
  shared/               wspólne dla obu wersji, niezależne od układu: signed-amount.tsx,
                        theme-toggle.tsx (trafia tu tylko to, czego używają obie wersje)
  ui/                   komponenty shadcn/ui (nie edytować ręcznie bez potrzeby),
                        m.in. dropdown-menu.tsx (Menu z Base UI), drawer.tsx (panel z dołu,
                        Drawer z Base UI, z uchwytem i safe-area)
lib/
  budget.ts             typy, formatowanie, okres (Period, currentPeriod), zakresy dat,
                        kwoty i sumy w groszach (parseAmount, computeTotals)
  categories.ts         kategorie domyślne, listy wyboru, komunikat o blokadzie usunięcia,
                        istniejąca kategoria o nazwie (existingCategoryValue)
  amount-input.ts       czyszczenie wpisywanej kwoty w mobile (przecinek, 2 miejsca)
  category-style.ts     ikona Lucide i kolor kategorii (mapa dla domyślnych, kolor z nazwy
                        dla własnych); baza bez zmian
  queries.ts            zapytania do Supabase (dane miesiąca/roku, zapisy, usuwanie)
  recurring.ts          zlecenia stałe: typy, presety, walidacja formularza, opisy (czysta logika)
  recurring-queries.ts  zlecenia stałe: CRUD, wstrzymanie, RPC materialize/upcoming
  filters.ts            filtry i sortowanie Historii + zapis w URL (czysta logika)
  dashboard-url.ts      stan widoku w URL: zakładka (VIEWS), okres, filtry, w mobile także
                        formularz (`formularz`) i ekran „Więcej” (`ekran`) (czysta logika)
  transaction-input.ts  walidacja formularza transakcji (czysta logika)
  errors.ts             wspólne komunikaty błędów Supabase (errorMessage)
  theme.ts              motyw: wybór, rozwiązanie wg systemu, skrypt do <head>
  ui-variant.ts         wersja interfejsu: ręczny wybór vs szerokość ekranu
  hooks/
    budget-data.tsx     BudgetDataProvider + useBudgetData / useRecurringData / useYearlyData
    use-transaction-form.ts  stan i zapis formularza transakcji (dodawanie i edycja);
                             `setType` (mobile) czyści kategorię, w edycji powrót ją przywraca
    use-delete-transaction.ts  usuwanie transakcji z potwierdzeniem (desktop i mobile)
    use-keyboard-inset.ts    wysokość klawiatury ekranowej (visualViewport, iOS)
    use-dashboard-url.ts     stan widoku z URL (useSyncExternalStore, push/replace);
                             nakładki mobilne: openForm/openScreen/closeOverlay
    use-visited.ts      widoki odwiedzone choć raz (montowanie od pierwszej wizyty)
    preference-store.ts      ustawienie urządzenia: localStorage + matchMedia
    use-theme.ts        useTheme + ThemeSync (klasa `dark` na <html>)
    use-ui-variant.ts   useUiVariant
  *.test.ts             testy Vitest czystej logiki
  supabase.ts           klient Supabase (tworzony leniwie – rzuca wyjątek przy pustym .env)
  auth.ts               login ↔ e-mail
supabase/schema.sql     schemat bazy + RLS
design/mobile/          materiały projektowe wersji mobilnej (makiety.tsx, styl-kokpit.jpg,
                        ikona.svg); wykluczone z tsconfig.json i ESLint, nie wchodzą do aplikacji
```

Przepływ danych:

- `SessionGate` wpuszcza zalogowanego użytkownika, `AppShell` czyta stan z URL (`useDashboardUrl`) i stawia `BudgetDataProvider` nad wybraną wersją. Przełączenie wersji nie gubi więc ani stanu widoku, ani danych.
- Provider (`lib/hooks/budget-data.tsx`) dostaje okres z URL i trzyma kategorie, transakcje miesiąca, zlecenia i dane roku. Miesiąc pobiera jedno `fetchDashboardData` (`date >= start AND date < następny miesiąc`); zlecenia i rok pobierają się leniwie, przy pierwszym użyciu `useRecurringData` / `useYearlyData`, i zostają w providerze. Przed pierwszym pobraniem raz idzie `materializeRecurring()`. Numery żądań chronią przed nadpisaniem nowszych danych spóźnioną odpowiedzią. Zmiana okresu (także przez „Wstecz”) czyści stare dane w trakcie renderu.
- Zapisy idą przez `lib/queries.ts` i `lib/recurring-queries.ts`; potem `afterSave` / `afterChange` / `refresh` z providera. Komponenty nie importują `getSupabase` (wyjątek: wylogowanie w `Dashboard`; przekierowanie na /login robi tylko listener w `SessionGate`).
- Kontenery (zakładki, formularze, dialogi zapisu) czytają dane z hooków; komponenty prezentacyjne (`TransactionsTable`, `RecurringRulesList`, `UpcomingList`, `SummaryCards`, `BudgetGauge`) dostają propsy, żeby wersja mobilna mogła dać własne widoki.
- Lista Historii to `filterTransactions(monthTransactions, …)` w `useMemo`, bez dodatkowych zapytań.

## Konwencje i pułapki

- **Prawie wszystkie komponenty są klienckie** (`"use client"`), bo sesja Supabase siedzi w `localStorage` i serwer jej nie widzi. Po stronie serwera są tylko `app/layout.tsx` i `app/page.tsx`. React Server Components stosuj tam, gdzie komponent nie potrzebuje sesji ani stanu.
- **Lint `react-hooks/set-state-in-effect`:** nie wołaj `setState` synchronicznie w ciele `useEffect` (tylko w `.then()`). Reset stanu przy zmianie propsa rób przez „dopasowanie stanu podczas renderu” (przykład: `reports-tab.tsx`), a świeży stan dialogów przez zmianę `key` (`editKey`).
- **URL i `useSearchParams`:** stan widoku czytamy przez `useSyncExternalStore` z `window.location`, nie przez `useSearchParams` – Next aktualizuje ten drugi po `pushState` w `startTransition`, więc pole sterowane z URL gubiłoby litery.
- **Ustawienia w `localStorage`** (motyw, wersja) zawsze przez `createPreferenceStore` (`try/catch`, synchronizacja między kartami). Przy hydratacji `useSyncExternalStore` daje najpierw wartość serwerową – nie stosuj jej do DOM przed hydratacją (wzór: `ThemeSync`).
- **Wycięcia ekranu:** `viewport-fit=cover`, więc stałe paski przy krawędzi muszą mieć odstęp `env(safe-area-inset-*)`.
- **Select z Base UI** przyjmuje `items` (mapa wartość → etykieta), a `onValueChange` może dostać `null`.
- **Menu z Base UI** (`components/ui/dropdown-menu.tsx`): przycisk otwierający podajemy przez `render` (`<DropdownMenuTrigger render={<Button … />}>`), `DropdownMenuLabel` musi leżeć wewnątrz `DropdownMenuGroup`, a `CheckboxItem` domyślnie nie zamyka menu (sortowanie ma `closeOnClick`). `checked` musi być zawsze `boolean` – `undefined` przy pierwszym renderze (np. stary stan po Fast Refresh) robi z pola niekontrolowane i Base UI zgłasza ostrzeżenie „uncontrolled → controlled”.
- **Kwoty:** wpis z formularza zawsze przechodzi przez `parseAmount` (spacje pomijane, `,` lub `.`, najwyżej 2 miejsca po przecinku, od 0,01 do `MAX_AMOUNT` = 99 999 999,99, czyli limit `numeric(10,2)`). Ten sam limit obowiązuje zlecenia, choć ich kolumna ma `numeric(12, 2)`, bo wykonanie trafia do `transactions`. Sumy liczymy w groszach (`toGrosze` / `fromGrosze`), nie przez dodawanie liczb zmiennoprzecinkowych.
- **Strefy czasowe:** daty po stronie klienta liczy `dateKey` w strefie urządzenia (nigdy `toISOString()`, które przesuwa dzień). „Dziś” w formularzach to więc dzień urządzenia, a `materialize_recurring()` liczy „dziś” w `Europe/Warsaw`. Różnica wychodzi tylko poza polską strefą czasową i świadomie jej nie wyrównujemy.
- **Limit wierszy PostgREST** (`max_rows`, domyślnie 1000): zapytanie, które może zwrócić więcej, pobiera dane partiami przez `range()` z pełnym sortowaniem (wzór: `fetchYearlyTransactions`). Dane miesiąca idą jednym zapytaniem.
- **Recharts** w ukrytym panelu/karcie ma szerokość 0 i nie rysuje wykresu – to nie błąd w kodzie.
- Pakiet `cn` (od shadcn) zastępuje `clsx` + `tailwind-merge`; importuj `cn` z `@/lib/utils`.
- Next.js w tej wersji różni się od starszych (patrz `AGENTS.md`) – przed pisaniem kodu zaglądaj do `node_modules/next/dist/docs/`.
- Sprawdzenia: `npm run typecheck`, `npm run lint`, `npm test` (Vitest 4 – tylko `lib/**/*.test.ts`, bez Supabase), `npm run build`.
