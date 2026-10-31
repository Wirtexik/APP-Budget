# Do zrobienia

Wszystkie otwarte zadania w jednym miejscu. Zrobione etapy i decyzje: [PLAN.md](PLAN.md); działanie aplikacji: [ARCHITECTURE.md](ARCHITECTURE.md). Każde zadanie zamyka się przez `npm run typecheck`, `npm run lint`, `npm test` i `npm run build`. Po zrobieniu zadanie znika stąd, a krótki opis trafia do PLAN.md (i do ARCHITECTURE.md, jeśli zmienia działanie).

## Etap 5: dopracowanie interfejsu (następny)

Spójne stany ładowania (szkielety), puste stany, komunikaty błędów, dostępność (focus, kontrast). Szczegóły do ustalenia po zobaczeniu aplikacji na obu urządzeniach.

- [ ] **Stany ładowania:** szkielety zamiast samego paska wczytywania, spójnie w obu wersjach.
- [ ] **Puste stany i komunikaty błędów:** przejrzeć i ujednolicić w obu wersjach.
- [ ] **Dostępność:** widoczny focus, kontrast.
- [ ] **Ciemny motyw:** przejrzeć kolory (gradienty kart, wykres, kolory kwot). Sam motyw działa od fazy E, opcja „Ciemny” od 2026-10-31.
- [ ] **Skarbonka na telefonie** (zrobiona 2026-10-31, opis w PLAN.md): obejrzeć świnkę w obu motywach, pustą skarbonkę (0 zł, brak wrzuceń), stan bez historii; przejść rozbicie i jego cofnięcie (usunięcie wpisu „Ze skarbonki”).

### Wyrównanie desktopu do mobile (przeniesione z etapu 4)

- [ ] **Zmiana typu przy edycji transakcji na desktopie** (decyzja z fazy H etapu 4, 2026-10-24). W mobile edycja pozwala przełączyć Wydatek/Przychód: zmiana typu czyści kategorię (zapis zablokowany, dopóki nie wybierze się nowej), powrót do pierwotnego typu przywraca pierwotną kategorię. Desktopowe `EditTransactionDialog` nadal trzyma typ wpisu (lista kategorii tylko tego typu). Do zrobienia: przełącznik typu w oknie edycji na `setType` z `useTransactionForm` (hook już to obsługuje). Skutek uboczny jak w mobile: wpis ze zlecenia stałego może zmienić typ niezależnie od zlecenia.
- [ ] **Zmiana typu przy edycji zlecenia na desktopie** (decyzja z fazy K etapu 4, 2026-10-27). To samo dla zleceń: mobilny formularz zlecenia przełącza typ także w edycji, desktopowy dialog nie. Do zrobienia na `setType` z `useRecurringRuleForm`.
- [ ] **Potwierdzenie usunięcia kategorii na desktopie** (decyzja z fazy M etapu 4, 2026-10-27). W mobile „Usuń” przy kategorii otwiera panel z potwierdzeniem, na desktopie kosz w `CategoryForm` usuwa od razu (blokada dla używanych kategorii działa w obu). Do zrobienia: okno potwierdzenia na desktopie na tym samym `useRemoveCategory`.

### Filtrowanie (otwarte z etapu 2)

- [ ] **Zakres kwot i zakres dat** w filtrach Historii (obok globalnego miesiąca), w obu wersjach. Zakres dat wymaga zapytania do Supabase (`gte/lte`), bo wykracza poza pobrany miesiąc.
- [ ] **Filtry w Raportach** (tryb „Rok”).

## Odłożone (bez terminu)

Świadomie poza zakresem dotychczasowych etapów. Wracamy do nich tylko po osobnej decyzji.

- Tryb offline, service worker, powiadomienia push (także dzwonek z grafiki `styl-kokpit.jpg`).
- Nowy wygląd wersji komputerowej (tokeny wyglądu działają dziś tylko w mobile).
- Dynamiczny zakres lat w selektorze okresu (dziś sztywny `YEAR_ITEMS`).
- Wybór ikony kategorii przez użytkownika (wymagałby nowej kolumny w bazie).
- Własna klawiatura kwoty w mobile – tylko gdyby systemowa (`inputMode="decimal"`) sprawiała problemy w codziennym użyciu.
