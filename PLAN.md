# Plan implementacji

Plan powstał na podstawie ARCHITECTURE.md i package.json. Lista błędów w etapie 0 to hipotezy do sprawdzenia, o ile przy punkcie nie zaznaczono inaczej. Każdy etap zamyka się przez `npm run typecheck`, `npm run lint`, `npm test` i `npm run build`, zanim zacznie się następny.

## Stan prac

| # | Etap | Stan |
|---|------|------|
| 0 | Audyt błędów i higiena repo | Częściowo: dodano Vitest, reszta do sprawdzenia. |
| 1 | Wydzielenie warstwy danych z `Dashboard` | Do zrobienia. |
| 2 | Filtrowanie transakcji | Do zrobienia (jest tylko przełącznik Uznania/Obciążenia w Historii). |
| 3 | Zlecenia stałe | **Zrobione** (baza, logika, interfejs). Do dopracowania: `pg_cron`, patrz etap 3. |
| 4 | Interfejs mobilny | Do zrobienia. |
| 5 | Dopracowanie interfejsu | Do zrobienia. |

Kolejność etapów 1, 2, 4, 5 zostaje taka jak była: warstwa danych przed rozdzieleniem PC i mobile, filtry przed oboma interfejsami, dopracowanie na końcu.

## Etap 0: błędy i higiena

- **`.env.example` jest skasowany** (`D` w git status). Przywrócić go, bo ARCHITECTURE.md na niego wskazuje.
- **`supabase/schema.sql` nie był porównany z realną bazą.** Przed etapem 3 sprawdzamy w Supabase tabele, RLS i politykę.
- **Limit wierszy w zapytaniach:** PostgREST domyślnie zwraca maksymalnie 1000 wierszy. Sprawdzić, czy `fetchYearlyTransactions` tego nie ucina, bo to mogłoby po cichu zaniżać raporty roczne. Jeśli tak, dodać stronicowanie albo agregację po stronie bazy.
- **Dokładność kwot:** `numeric(12,2)` wraca z JS jako liczba zmiennoprzecinkowa. Sprawdzić `computeTotals` pod kątem błędów zaokrągleń i ewentualnie liczyć w groszach.
- **Strefy czasowe:** zakresy dat (`date >= start AND date < następny miesiąc`) łatwo przesuwają się o dzień przez `toISOString()`.
- **Testy:** ~~brak testów~~ Vitest jest dodany (`npm test`, 19 testów w `lib/recurring.test.ts`). Do pokrycia zostaje `lib/budget.ts` (`computeTotals`, zakresy dat).

## Etap 1: warstwa danych

Z `components/dashboard/dashboard.tsx` wydzielić stan i logikę (miesiąc, kategorie, transakcje, `refresh`, `requestSeq`) do hooka `useBudgetData` w `lib/hooks/` albo do providera React Context. Komponenty prezentacyjne dostają dane przez propsy. Dzięki temu desktop i mobile mają różne widoki, ale jedno źródło danych.

## Etap 2: filtrowanie transakcji

- **Filtry:** wyszukiwanie tekstowe w opisie, wiele kategorii, typ (uznania/obciążenia), zakres kwot, zakres dat (obok globalnego miesiąca) i sortowanie (data, kwota).
- **Gdzie filtrować:** zapytania do Supabase (`ilike`, `in`, `gte/lte`) dla historii i roku, żeby nie ładować wszystkiego do przeglądarki.
- **Stan w URL** (`?q=&cat=&min=`), żeby widok dało się odtworzyć i wspólnie używać na PC i mobile.
- **Logika:** w `lib/filters.ts` (czysty TypeScript, testowalny). Interfejs desktopowy dostaje pasek filtrów, a mobilny wysuwany panel z dołu.
- Baza się nie zmienia.

## Etap 3: zlecenia stałe (zrobione)

Szczegóły działania są w ARCHITECTURE.md (baza, sekcja „Zlecenia”, struktura katalogów). Tu tylko to, co zostało zrobione, i co jeszcze otwarte.

**Zrobione:**

- Baza: migracja `supabase/migrations/20261018120000_recurring_rules.sql` (tabela `recurring_rules`, `transactions.recurring_rule_id`, RLS, RPC `materialize_recurring()` i `upcoming_recurring()`).
- Logika: `lib/recurring.ts` (typy, presety, walidacja, opisy) i `lib/recurring-queries.ts` (CRUD, wstrzymanie, RPC), z testami.
- Interfejs: zakładka „Zlecenia” w `components/recurring/` (lista, formularz dodawania i edycji, wstrzymanie i wznowienie, usuwanie, „Nadchodzące” na 30 dni).
- Wykonywanie: `materializeRecurring()` przy otwarciu aplikacji, przed pierwszym pobraniem danych, oraz po każdej zmianie zlecenia.
- Wykonane transakcje oznaczone ikoną zlecenia w tabelach.

**Otwarte:**

- `pg_cron` raz dziennie, o ile plan Supabase to udostępnia. Dziś transakcje pojawiają się dopiero po otwarciu aplikacji.
- Zlecenia nie mają jeszcze układu dla telefonu poza responsywnym wyglądem kart (etap 4). Cztery zakładki w nagłówku mogą się tam ściskać.

Wywołanie materializeRecurring() przy pierwszym ładowaniu w dashboard.tsx, zgodnie z Twoją decyzją.
Usuwanie kategorii: baza zablokuje teraz usunięcie kategorii użytej w zleceniu. Komponent usuwający kategorie prawdopodobnie sprawdza tylko transakcje, więc trzeba go przejrzeć.

## Etap 4: PC i mobile

- **Struktura:** grupy tras `app/(desktop)/` i `app/(mobile)/`. Obie używają wspólnego `lib/` i hooków z etapu 1, a mają osobne komponenty w `components/desktop/` i `components/mobile/`.
- **Wykrywanie urządzenia:** w Next 16 `middleware` mógł zostać zastąpiony przez `proxy`, więc sprawdzić to w `node_modules/next/dist/docs/` przed pisaniem kodu. Wykrycie po User-Agent i Client Hints, z ręcznym przełącznikiem „Wersja mobilna/komputerowa” zapisanym w ciasteczku.
- **Interfejs mobilny, całkiem inny niż desktopowy:**
  - dolna nawigacja (Kokpit, Historia, „+”, Zlecenia, Raporty);
  - pełnoekranowy formularz dodawania z dużym polem kwoty;
  - lista transakcji z przesunięciem palcem (edycja i usuwanie);
  - filtry w panelu wysuwanym z dołu.
- **PWA:** manifest i ikony, żeby dało się zainstalować aplikację na telefonie.
- Po tym etapie zaktualizować ARCHITECTURE.md, bo dziś opisuje aplikację jako „mobile-first”.

## Etap 5: interfejs

Spójne stany ładowania (szkielety), puste stany, komunikaty błędów, dostępność (focus, kontrast) i tryb ciemny, jeśli go brakuje. Szczegóły do ustalenia po zobaczeniu aplikacji na obu urządzeniach.

## Decyzje do podjęcia

1. **Wykonywanie zleceń:** rozstrzygnięte na razie na korzyść nadrabiania przy otwarciu aplikacji. Czy dodatkowo włączyć `pg_cron`?
2. **Wykrywanie urządzenia:** User-Agent z przełącznikiem ręcznym (propozycja), czy wybór tylko po szerokości ekranu? Przy samej szerokości nie da się zrobić całkowicie osobnego kodu po stronie serwera.
3. **Co dalej:** dokończyć etap 0 (audyt błędów), czy od razu etap 1 (wydzielenie warstwy danych)?
4. ~~Testy~~ Vitest jest dodany. Czy rozszerzyć go o `lib/budget.ts`?
