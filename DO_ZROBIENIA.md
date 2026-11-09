# Do zrobienia

Checklista zadań **jeszcze niezrobionych**; działanie aplikacji opisuje [ARCHITECTURE.md](ARCHITECTURE.md). Zadanie znika stąd dopiero po zaakceptowaniu jego finalnej wersji, a opis trafia do odpowiedniego pliku .md (zasada w [CLAUDE.md](CLAUDE.md)).

## Etap 5: dopracowanie interfejsu (w toku)

Spójne stany ładowania, puste stany, komunikaty błędów, dostępność (focus, kontrast).

- [ ] **Przegląd wizualny poprawek z 2026-11-09** na obu urządzeniach w obu motywach. Do obejrzenia: szkielety (`Skeleton`, `ListSkeleton`) w kwotach, tabelach, listach, Zleceniach, Raportach i skarbonce; `ErrorAlert` (na desktopie z „Spróbuj ponownie”, tekst `red-700` w jasnym motywie) i `EmptyState`; w mobile nowe jasne `--primary`, `--muted-foreground`, `--destructive` i ciemniejszy gradient; kwoty przychodów `emerald-700`/`emerald-300`; widoczny focus w polach dat, liczby wykonań i liście częstotliwości. Kontrast policzony skryptem, wygląd nie był oglądany.
- [ ] **Świnka w skarbonce:** mały napis „W skarbonce” (biały, `opacity-85`) na starym gradiencie świnki (`piggy-svg.tsx`) ma kontrast poniżej 4,5; kolory świnki celowo zostały jak w makiecie – do decyzji przy przeglądzie.
- [ ] **Skarbonka na telefonie** (zrobiona 2026-10-31, opis w ARCHITECTURE.md): obejrzeć świnkę w obu motywach, pustą skarbonkę (0 zł, brak wrzuceń), stan bez historii; przejść rozbicie i jego cofnięcie (usunięcie wpisu „Ze skarbonki”).

### Wyrównanie desktopu do mobile (przeniesione z etapu 4)

- [ ] **Zmiana typu przy edycji transakcji na desktopie** (decyzja z 2026-10-24). W mobile edycja pozwala przełączyć Wydatek/Przychód: zmiana typu czyści kategorię (zapis zablokowany, dopóki nie wybierze się nowej), powrót do pierwotnego typu przywraca pierwotną kategorię. Desktopowe `EditTransactionDialog` nadal trzyma typ wpisu (lista kategorii tylko tego typu). Do zrobienia: przełącznik typu w oknie edycji na `setType` z `useTransactionForm` (hook już to obsługuje). Skutek uboczny jak w mobile: wpis ze zlecenia stałego może zmienić typ niezależnie od zlecenia.
- [ ] **Zmiana typu przy edycji zlecenia na desktopie** (decyzja z 2026-10-27). To samo dla zleceń: mobilny formularz zlecenia przełącza typ także w edycji, desktopowy dialog nie. Do zrobienia na `setType` z `useRecurringRuleForm`.
- [ ] **Potwierdzenie usunięcia kategorii na desktopie** (decyzja z 2026-10-27). W mobile „Usuń” przy kategorii otwiera panel z potwierdzeniem, na desktopie kosz w `CategoryForm` usuwa od razu (blokada dla używanych kategorii działa w obu). Do zrobienia: okno potwierdzenia na desktopie na tym samym `useRemoveCategory`.

### Filtrowanie (otwarte z etapu 2)

- [ ] **Zakres kwot i zakres dat** w filtrach Historii (obok globalnego miesiąca), w obu wersjach. Zakres dat wymaga zapytania do Supabase (`gte/lte`), bo wykracza poza pobrany miesiąc.
- [ ] **Filtry w Raportach** (tryb „Rok”).

## Odłożone (bez terminu)

Świadomie poza zakresem dotychczasowych etapów. Wracamy do nich tylko po osobnej decyzji.

- Tryb offline, service worker, powiadomienia push (także dzwonek z grafiki `styl-kokpit.jpg`).
- Nowy wygląd wersji komputerowej (tokeny wyglądu działają dziś tylko w mobile).
- Dynamiczny zakres lat w selektorze okresu (dziś sztywny `YEAR_ITEMS`, strzałki okresu gasną na końcu zakresu).
- Wybór ikony kategorii przez użytkownika (wymagałby nowej kolumny w bazie).
- Własna klawiatura kwoty w mobile – tylko gdyby systemowa (`inputMode="decimal"`) sprawiała problemy w codziennym użyciu.
- Aktualizacje do nowych wersji głównych: TypeScript 7, ESLint 10, Vitest 5 (2026-11-09 zaktualizowane tylko w obrębie zakresów: Next 16.4.5, React 19.3.1).
