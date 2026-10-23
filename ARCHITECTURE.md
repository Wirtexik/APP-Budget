# Architektura – Budżet

Aplikacja do prowadzenia domowego budżetu (przychody, wydatki, kategorie, historia, raporty). Interfejs po polsku, mobile-first.

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

**`transactions`** – `id`, `user_id`, `category_id` → `categories.id` (w bazie dopuszcza NULL), `amount` (`numeric`, zawsze dodatnie), `date` (`date`), `description` (opcjonalny), `created_at` (`default now()`), `recurring_rule_id` → `recurring_rules.id` (`ON DELETE SET NULL`, unikalne razem z `date`).

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

**Globalny filtr miesiąca i roku** (nagłówek) służy **wyłącznie do filtrowania widoku**. Zapis z dowolną datą (wstecz i w przód) jest zawsze dozwolony, a po zapisie filtr zostaje bez zmian. Gdy zapisany wpis wypada poza oglądany miesiąc, pojawia się komunikat tłumaczący, czemu go nie widać.

**Kokpit**
- Karty Saldo / Przychody / Wydatki wybranego miesiąca (kolorowe gradienty, ikony).
- Formularz wydatku (`TransactionForm`) – tylko kategorie typu `wydatek`, własna data.
- Okno szybkiego przychodu (przycisk „+” na karcie Przychody, `QuickIncomeDialog`) – tylko kategorie typu `przychod`, **własna, niezależna data**. Oba formularze mają osobne stany i po zapisie czyszczą się całkowicie.
- Zarządzanie kategoriami (`CategoryForm`): dodawanie, edycja nazwy i typu, usuwanie; lista własnych kategorii przewija się (`max-h-32`).
- 5 ostatnich transakcji z edycją i usuwaniem.

**Historia** – pełna lista transakcji miesiąca z edycją i usuwaniem oraz paskiem (`HistoryFilters`, logika w `lib/filters.ts`): wyszukiwarka w opisie i nazwie kategorii (od pierwszej litery, dopasowuje tylko **początki wyrazów**, bez wielkości liter i polskich znaków), rozwijane menu „Filtry” (typ Uznania/Obciążenia, „Zlecenia stałe” – tylko wpisy z `recurring_rule_id`, łączy się z typem – i wiele kategorii, licznik na przycisku), menu „Sortuj” (data lub kwota, rosnąco/malejąco; nic nie zaznaczone = kolejność domyślna) i „Wyczyść wszystko”. Filtrowanie odbywa się w przeglądarce na danych miesiąca; filtry zostają przy zmianie miesiąca.

**Zlecenia** – lista zleceń stałych (status, harmonogram, następny termin) z edycją, wstrzymaniem/wznowieniem jednym kliknięciem i usuwaniem, formularz dodawania/edycji (presety częstotliwości, zakończenie: bezterminowo / data / liczba wykonań) oraz „Nadchodzące” na 30 dni. `materializeRecurring()` jest wołane raz przy otwarciu aplikacji (przed pierwszym pobraniem danych) i po każdej zmianie zlecenia. Transakcje ze zleceń mają w tabelach ikonę `Repeat`.

**Raporty** – suwak **Miesiąc / Rok** (`Tabs`) decyduje, z jakich danych korzystają trzy elementy poniżej:
- **Wskaźnik budżetu** (`BudgetGauge`, donut z Recharts): w środku tylko kwota z napisem „Zostało” lub „Na minusie”, procent wykorzystania jako tekst pod wykresem. **Trzy kolory:** wydatki < przychody → część zużyta szara, pozostała zielona; wydatki ≥ przychody → całe koło czerwone.
- Legenda kategorii wydatków obok wskaźnika (`max-h-56`, przewijana).
- Akordeon „Struktura transakcji”: Wydatki/Przychody → kategorie → transakcje.
- Tryb „Rok” bierze rok z globalnego filtra i ignoruje miesiąc. Dane roczne pobierają się w tle (`fetchYearlyTransactions`).

## Struktura katalogów

```
app/
  layout.tsx            layout (Server Component), czcionki, <Toaster />
  page.tsx              bramka sesji: brak sesji → /login
  login/page.tsx        logowanie loginem (dokleja @budzet.local)
components/
  dashboard/            ekran główny: dashboard.tsx (stan, dane, zakładki) + formularze,
                        dialogi, tabele, karty, reports-tab.tsx, budget-gauge.tsx
  recurring/            zakładka „Zlecenia”: recurring-tab.tsx (stan, dane, dialogi),
                        lista zleceń, „Nadchodzące”, formularz, dialog usuwania
  ui/                   komponenty shadcn/ui (nie edytować ręcznie bez potrzeby)
lib/
  budget.ts             typy, formatowanie, zakresy dat, sumy (computeTotals)
  categories.ts         kategorie domyślne, listy wyboru
  queries.ts            zapytania do Supabase (dane miesiąca/roku, zapisy, aktualizacje)
  filters.ts            filtry i sortowanie Historii (czysta logika)
  recurring.ts          zlecenia stałe: typy, presety, walidacja formularza, opisy (czysta logika)
  recurring-queries.ts  zlecenia stałe: CRUD, wstrzymanie, RPC materialize/upcoming
  *.test.ts             testy Vitest czystej logiki
  supabase.ts           klient Supabase (tworzony leniwie – rzuca wyjątek przy pustym .env)
  auth.ts               login ↔ e-mail
supabase/schema.sql     schemat bazy + RLS
```

Przepływ danych: `Dashboard` trzyma stan (miesiąc, kategorie, transakcje miesiąca) i pobiera go jednym wywołaniem `fetchDashboardData` (filtr `date >= start AND date < następny miesiąc`). Po każdej zmianie wywołuje `refresh`. Numer żądania (`requestSeq`) chroni przed nadpisaniem nowszych danych spóźnioną odpowiedzią.

## Konwencje i pułapki

- **Prawie wszystkie komponenty są klienckie** (`"use client"`), bo sesja Supabase siedzi w `localStorage` i serwer jej nie widzi. Po stronie serwera jest tylko `app/layout.tsx`. React Server Components stosuj tam, gdzie komponent nie potrzebuje sesji ani stanu.
- **Lint `react-hooks/set-state-in-effect`:** nie wołaj `setState` synchronicznie w ciele `useEffect` (tylko w `.then()`). Reset stanu przy zmianie propsa rób przez „dopasowanie stanu podczas renderu” (przykład: `reports-tab.tsx`), a świeży stan dialogów przez zmianę `key` (`editKey`).
- **Select z Base UI** przyjmuje `items` (mapa wartość → etykieta), a `onValueChange` może dostać `null`.
- **Recharts** w ukrytym panelu/karcie ma szerokość 0 i nie rysuje wykresu – to nie błąd w kodzie.
- Pakiet `cn` (od shadcn) zastępuje `clsx` + `tailwind-merge`; importuj `cn` z `@/lib/utils`.
- Next.js w tej wersji różni się od starszych (patrz `AGENTS.md`) – przed pisaniem kodu zaglądaj do `node_modules/next/dist/docs/`.
- Sprawdzenia: `npm run typecheck`, `npm run lint`, `npm test` (Vitest 4 – tylko `lib/**/*.test.ts`, bez Supabase), `npm run build`.
