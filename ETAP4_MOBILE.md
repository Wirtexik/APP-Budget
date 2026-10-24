# Etap 4: interfejs mobilny – program wdrożenia

Plan szczegółowy do etapu 4 z PLAN.md. Powstał 2026-10-24 na podstawie PLAN.md, ARCHITECTURE.md, `components/app-shell.tsx`, `components/dashboard/dashboard.tsx`, `lib/ui-variant.ts`, `lib/dashboard-url.ts` i dokumentacji Next 16 (`app/manifest.ts`).

Zasady jak w fazach A–E:

- Fazy idą po kolei, w obrębie fazy kolejność jest dowolna.
- Przed każdą fazą krótka propozycja architektury do akceptacji (CLAUDE.md), potem kod.
- Każda faza kończy się zielonym `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- Czysta logika trafia do `lib/` z testami Vitest; komponenty są w `components/mobile/` albo `components/desktop/`.
- Bez nowych zależności: panel z dołu to `Drawer` z `@base-ui/react` (jest w 1.8), gesty na zdarzeniach `pointer*`, wykres salda na Recharts.
- Baza się nie zmienia.

## Materiały projektowe (`design/mobile/`)

Folder jest wykluczony z `tsconfig.json` i ESLint, nie wchodzi do aplikacji.

| Plik | Do czego służy |
|------|----------------|
| `makiety.tsx` | **Rozmieszczenie** elementów na 13 ekranach (kolejność, grupowanie, napisy). Kolorów i stylu z tego pliku **nie** bierzemy. |
| `styl-kokpit.jpg` | **Wygląd**: kolory, karty, cienie, typografia, dolna nawigacja. Wzór dla wszystkich ekranów, nie tylko Kokpitu. |
| `ikona.svg` | Ikona aplikacji (PWA) i źródło palety ciemnego motywu. |

## Wymagania (ustalone 2026-10-24)

| Temat | Decyzja |
|-------|---------|
| Przesunięcie palcem | W lewo odsłania „Edytuj” i „Usuń” (jak w iOS Mail). Dotknięcie wiersza otwiera edycję. Usuwanie zawsze z potwierdzeniem. |
| Przycisk „+” | Formularz na pełnym ekranie: przełącznik Wydatek/Przychód (domyślnie Wydatek), duże pole kwoty, kategorie jako kafelki, data, opis. |
| Klawiatura kwoty | Systemowa, z samymi cyframi i przecinkiem (`inputMode="decimal"`), bez własnej klawiatury w aplikacji. Szczegóły i ograniczenia niżej. |
| Kategorie | Pełne zarządzanie w ekranie „Więcej”; w formularzu transakcji kafelek „+ Nowa” do szybkiego dodania. |
| Ikony i kolory kategorii | Mapa w kodzie, baza bez zmian: kategorie domyślne mają przypisaną ikonę Lucide i kolor, własne dostają ikonę ogólną i kolor wyliczony z nazwy (zawsze ten sam dla tej samej nazwy). |
| Wybór okresu | W nagłówku „‹ październik 2026 ›”; dotknięcie nazwy otwiera panel z siatką 12 miesięcy i wyborem roku. Zakres lat bez zmian (`YEAR_ITEMS`). |
| Przełącznik wersji | „Automatycznie / Komputerowa / Mobilna”: na telefonie w „Więcej”, na komputerze w nowym menu konta w nagłówku (razem z wylogowaniem). |
| Kokpit mobilny | Karta salda z wykresem salda dzień po dniu, karty przychodów i wydatków, pasek wykorzystania budżetu. **Bez** ostatnich transakcji i bez nadchodzących zleceń. |
| Wykres salda | Saldo narastająco od 1. dnia miesiąca: do dziś w bieżącym miesiącu, do ostatniego dnia w minionych. Liczone z pobranych już transakcji miesiąca, w groszach, bez nowych zapytań. |
| Motyw | Jasny wg `styl-kokpit.jpg`; ciemny wyprowadzony z ikony (granat → indygo w tle, te same fiolet i zieleń jako akcenty). Oba robione od razu. |
| PWA | Manifest + ikony z `ikona.svg`, bez trybu offline i bez powiadomień. |

### Klawiatura kwoty: co da się zagwarantować

- `inputMode="decimal"` otwiera klawiaturę numeryczną z separatorem dziesiętnym. Na iOS to dokładnie cyfry + separator.
- **Separator zależy od ustawień regionu telefonu, nie od strony.** Przy regionie „Polska” to przecinek, przy innym może być kropka. `parseAmount` przyjmuje oba, a pole przy wpisywaniu zamienia kropkę na przecinek, więc użytkownik zawsze widzi przecinek.
- Na Androidzie (Gboard i inne) klawiatura „decimal” bywa szersza (np. dodatkowe `-`, `.`, spacja). Kontrolować tego się nie da; pole odrzuca wszystko poza cyframi i jednym przecinkiem z najwyżej 2 cyframi po nim.
- Jeśli na Twoim telefonie wynik nie będzie wystarczający, wracamy do własnej klawiatury (decyzja po fazie H, na prawdziwym urządzeniu).

## Wygląd (na podstawie `styl-kokpit.jpg`)

Opis do odwzorowania; dokładne wartości kolorów ustalane w fazie F i zapisane jako tokeny.

- **Tło ekranu:** bardzo jasne, chłodne (szaro-lawendowe), bez wzorów.
- **Nagłówek:** „‹ październik 2026 ›” po lewej, po prawej **awatar** (okrągły), który otwiera „Więcej”. Dzwonka z grafiki nie robimy (brak powiadomień w zakresie). Pod nagłówkiem duży, pogrubiony tytuł widoku („Kokpit”, „Historia”…).
- **Karta salda:** „szkło” (półprzezroczysta biel, rozmycie tła, cienka jasna ramka, miękki cień), duże zaokrąglenie. Napis „Saldo” i duża kwota w kolorze głównym (fiolet), wyśrodkowane. Na dole karty wykres salda: fioletowa linia z jasnofioletowym wypełnieniem pod spodem, bez osi i podpisów.
- **Karta przychodów:** pełne, nasycone zielone tło z delikatną poświatą; ikona strzałki w górę i w prawo w ciemniejszym zielonym kółku; ciemny tekst.
- **Karta wydatków:** szare „szkło”; ikona strzałki w dół w fioletowym kółku; ciemny tekst.
- **Pasek budżetu:** bez karty, bezpośrednio na tle. Nad nim tekst „Wykorzystano **58%** · zostało 3 450,20 zł” (procent pogrubiony). Gruby, zaokrąglony pasek: wypełnienie fioletowym gradientem, tor jasnoszary. Przy przekroczeniu budżetu kolor ostrzegawczy (jak trzeci kolor `BudgetGauge`).
- **Dolna nawigacja:** biały pasek z zaokrąglonymi górnymi rogami. Środkowy „+” to okrąg z fioletowym gradientem i fioletową poświatą, wystający ponad pasek. Aktywna pozycja: ikona wypełniona i podpis w kolorze głównym; nieaktywne: ciemne ikony.
- **Ogólnie:** duże zaokrąglenia (ok. 20–24 px), miękkie cienie zamiast ramek, czcionka Geist (już jest), kwoty pogrubione. Ten sam język (szkło, fiolet jako kolor główny, zieleń dla przychodów) na pozostałych ekranach, w tym panelach z dołu, formularzach i kartach zleceń.
- **Paleta z ikony:** gradient główny `#A855F7` → `#6366F1`, zieleń `#10B981`, ciemne tło `#0F172A` → `#1E1B4B`.

**Tokeny tylko dla wersji mobilnej:** zmienne CSS w `app/globals.css` pod atrybutem `[data-ui="mobile"]` na korzeniu `MobileApp` (jasne i `.dark [data-ui="mobile"]`). Nadpisują m.in. `--primary`, `--background`, `--card`, `--radius`, więc komponenty `components/ui/` dostają nowy wygląd w mobile, a desktop zostaje bez zmian. Dodatkowe tokeny: `--income`, `--expense`, `--glass`, `--glow`, gradient główny.

## Odstępstwa od makiet

- Prawy róg nagłówka: awatar zamiast „⋯” (wg grafiki), otwiera „Więcej”. Bez dzwonka.
- Ekran 1: bez ramki karty wokół paska budżetu i z wykresem w karcie salda (wg grafiki).
- Ekran 4: bez własnej klawiatury; przycisk „Zapisz” przyklejony nad systemową klawiaturą.
- Ekran 9: „Nadchodzące” pokazuje tylko to, co zwraca `upcoming_recurring` (bez przekreślonych wstrzymanych).
- Ekran 13 (stany pomocnicze): robione razem z odpowiednimi ekranami, w stylu z grafiki.

## Założenia domyślne (do potwierdzenia przy danej fazie)

- **Formularz i ekran „Więcej” w URL**, np. `?formularz=nowy`, `?formularz=<id>` (edycja), `?ekran=wiecej`. Otwarcie robi `pushState`, więc systemowe „Wstecz” (gest na Androidzie) zamyka formularz zamiast wychodzić z aplikacji. Parametry tylko w wersji mobilnej; desktop je ignoruje i czyści.
- **Po zapisie** formularz się zamyka, a komunikat (jak dziś) mówi, gdy wpis wypada poza oglądany miesiąc.
- **Okna dialogowe usuwania** (transakcja, zlecenie, kategoria) na telefonie to `Drawer` z dołu z dwoma dużymi przyciskami.

## Fazy

### Faza F: porządek w katalogach, szkielet i tokeny wyglądu

- [x] Materiały w `design/mobile/`, folder wykluczony z TypeScriptu i ESLint.
- [x] `components/dashboard/` → `components/desktop/` (`git mv`), `components/recurring/` → `components/desktop/recurring/`. Importy poprawione, działanie bez zmian.
- [x] Do `components/shared/` przechodzi to, czego użyją obie wersje i co nie zależy od układu (wg potrzeb kolejnych faz, nie na zapas). W fazie F nic nie przeszło; przenosi się w fazie, która tego użyje.
- [x] `components/mobile/mobile-app.tsx` ze szkieletem i `data-ui="mobile"`; `AppShell` renderuje `<MobileApp>` dla `variant === "mobile"`.
- [x] Tokeny wersji mobilnej w `app/globals.css` (jasne i ciemne, patrz „Wygląd”).
- [x] `components/ui/drawer.tsx`: opakowanie `Drawer` z Base UI w stylu shadcn (`base-nova`), z uchwytem i odstępem na `safe-area-inset-bottom`.
- [x] `lib/category-style.ts`: ikona i kolor kategorii (mapa dla `DEFAULT_CATEGORIES`, dla własnych ikona ogólna i kolor z nazwy), z testami (stały wynik dla nazwy, bez względu na wielkość liter i spacje).
- [x] ARCHITECTURE.md: nowa struktura katalogów, `design/`.

### Faza G: powłoka mobilna (nagłówek, nawigacja, okres)

- [x] `lib/budget.ts`: `shiftPeriod(period, ±1)` z granicami `YEAR_ITEMS` (strzałka gaśnie na końcu zakresu), z testami.
- [x] `MobileHeader`: „‹ miesiąc rok ›”, awatar otwierający „Więcej”, tytuł widoku. Panel okresu (`Drawer`): siatka 12 miesięcy, rok, „Bieżący miesiąc”.
- [x] `BottomNav` wg grafiki: pięć pozycji, aktywna wg `url.view`, wystający „+” z poświatą, `pb-[env(safe-area-inset-bottom)]`, przyciski min. 44×44 px.
- [x] Przełączanie widoków przez `url.setView` (jak zakładki na PC: `pushState`). Ukryte widoki montowane od pierwszej wizyty (ta sama zasada co `visited` w `Dashboard`).
- [x] Obsługa `loadError` (pasek błędu z „Spróbuj ponownie”) i `loading` na poziomie powłoki.
- [x] `lib/dashboard-url.ts`: parametry `formularz` i `ekran` (parsowanie, zapis, wartości błędne → brak), z testami.
  Ustalone wartości `formularz`: `nowy`, `<uuid>` (transakcja), `zlecenie`, `zlecenie-<uuid>` (zlecenie, faza K); `ekran`: `wiecej`. Otwarcie robi `pushState` ze znacznikiem `{ overlay: true }`, zamknięcie `history.back()` (bez znacznika: `replaceState`). Desktop czyści oba parametry.

### Faza H: formularz transakcji na pełnym ekranie

- [x] Sprawdzić `useTransactionForm`: przełącznik typu w trybie `create` wymaga zmiany typu bez gubienia kwoty i daty (kategoria czyszczona przy zmianie typu). Jeśli hook tego nie umie, rozszerzyć go (z zachowaniem formularzy desktopowych).
- [x] `lib/amount-input.ts`: czyszczenie wpisywanej kwoty (kropka → przecinek, tylko cyfry i jeden przecinek, najwyżej 2 miejsca), z testami.
- [x] `MobileTransactionForm` (`create` i `edit`): przełącznik Wydatek/Przychód, duże pole kwoty (`inputMode="decimal"`, komunikat `AMOUNT_ERROR`), kafelki kategorii z ikonami, data, opis, przycisk zapisu przyklejony nad klawiaturą, w edycji „Usuń transakcję”.
- [x] Kafelek „+ Nowa” w kategoriach: mały panel z nazwą, zapis przez `insertCategory`, nowa kategoria od razu zaznaczona.
- [x] Otwieranie przez „+” (`?formularz=nowy`) i z listy (`?formularz=<id>`); id spoza pobranego miesiąca → formularz się nie otwiera, parametr znika.
- **Decyzja (2026-10-24):** przełącznik typu działa także w edycji (`setType` w `useTransactionForm`): zmiana typu czyści kategorię, powrót do pierwotnego typu ją przywraca. Desktop zostaje przy stałym typie – wyrównanie zapisane w PLAN.md, etap 5. „+ Nowa” z nazwą istniejącej kategorii (także domyślnej) tylko ją zaznacza (`existingCategoryValue`). Przycisk zapisu nad klawiaturą iOS: `useKeyboardInset` (`visualViewport`).
- [ ] **Sprawdzenie na telefonie:** jaka klawiatura się otwiera (iOS i Android); decyzja, czy zostaje systemowa.

### Faza I: Kokpit i lista transakcji z przesunięciem

- [ ] `lib/balance-series.ts`: saldo narastająco dzień po dniu dla okresu (do dziś albo do końca miesiąca), w groszach, z testami (pusty miesiąc, przyszły miesiąc, wpisy z tego samego dnia).
- [ ] Kokpit wg grafiki: karta salda z wykresem (Recharts `AreaChart`, bez osi), karty przychodów i wydatków, pasek budżetu. Procent wykorzystania i stan (normalny/przekroczony) z jednej funkcji w `lib/`, wspólnej z `BudgetGauge` (wydzielić, jeśli dziś liczy go komponent).
- [ ] `lib/swipe.ts`: czysta logika gestu (próg odsłonięcia, kierunek poziomy vs pionowy, przyciąganie do 0 / szerokości przycisków), z testami.
- [ ] Hook `useSwipeReveal` (`pointerdown/move/up`, `touch-action: pan-y`); w danej chwili odsłonięty najwyżej jeden wiersz, przewinięcie listy go zamyka.
- [ ] `MobileTransactionList`: wpisy pogrupowane po dniach (nagłówek z datą i sumą dnia w groszach), ikona i kolor kategorii, `SignedAmount`, ikona zlecenia. Dotknięcie = edycja, „Usuń” = potwierdzenie w `Drawer` (`deleteTransaction`).
- [ ] Dostępność: akcje osiągalne też bez gestu (klawiatura, czytnik ekranu).

### Faza J: Historia

- [ ] Wyszukiwarka na górze (ta sama logika `lib/filters.ts`, wartość w URL).
- [ ] Przycisk filtrów z licznikiem otwiera `Drawer`: typ, „Tylko zlecenia stałe”, kategorie (kafelki wielokrotnego wyboru), sortowanie, „Pokaż N wyników”, „Wyczyść wszystko”.
- [ ] Lista z fazy I, pusty stan „Brak transakcji pasujących do filtrów” z „Wyczyść filtry”.

### Faza K: Zlecenia jako karty

- [ ] `recurring-rule-dialog.tsx` (479 linii) rozdzielić na hook `useRecurringRuleForm` (stan, walidacja przez `validateRuleInput`, zapis) i pola; dialog desktopowy działa jak dotąd.
- [ ] `MobileRecurringList`: karta na zlecenie (opis, kategoria z ikoną, kwota, harmonogram, następny termin, status), przełącznik wstrzymania, menu z edycją i usuwaniem (potwierdzenie w `Drawer`).
- [ ] „Nadchodzące (30 dni)” jako lista pod kartami.
- [ ] Formularz zlecenia na pełnym ekranie (`?formularz=zlecenie` / `zlecenie-<uuid>`, ustalone w fazie G) i przycisk „Dodaj zlecenie”.

### Faza L: Raporty

- [ ] Przełącznik Miesiąc/Rok, `BudgetGauge` na pełną szerokość w karcie, „Wykorzystano N% budżetu” pod wykresem.
- [ ] „Struktura transakcji”: Wydatki/Przychody → kategorie (udział %, pasek, kwota) → transakcje; legenda połączona ze strukturą jak na makiecie.
- [ ] Logikę grupowania z `reports-tab.tsx` (`groupTransactions`) przenieść do `lib/`, jeśli mobile ma jej używać (z testami).

### Faza M: ekran „Więcej” i przełącznik wersji

- [ ] Ekran „Więcej” (`?ekran=wiecej`): „Zalogowany jako”, kategorie (lista z ikonami, „Domyślna” bez akcji, własne z edycją nazwy i typu z ostrzeżeniem i usuwaniem z `categoryUsageMessage`), „Dodaj kategorię”, motyw (`useTheme`), wersja interfejsu, „Wyloguj się”.
- [ ] Logikę `CategoryForm` (230 linii) wydzielić do hooka, żeby obie wersje miały te same zasady (kategorie domyślne nieusuwalne, blokada usunięcia).
- [ ] Przełącznik „Automatycznie / Komputerowa / Mobilna” na `useUiVariant().setOverride`.
- [ ] Desktop: menu konta w `DashboardHeader` (login, wersja interfejsu, wylogowanie).

### Faza N: PWA

- [ ] PNG z `ikona.svg`: 192, 512, wersja `maskable` (motyw w bezpiecznym środku), `apple-icon` 180×180 i `app/icon.png`. SVG ma rozmycie (`feGaussianBlur`), którego `next/og` nie obsługuje, więc PNG powstają jednorazowo przez przeglądarkę (np. Chrome headless) i trafiają do repo. iOS nie bierze przezroczystości: wersja `apple-icon` na pełnym tle, bez zaokrągleń.
- [ ] `app/manifest.ts`: `name` „Budżet”, `short_name`, `start_url: "/"`, `display: "standalone"`, `background_color` i `theme_color` zgodne z `viewport`, `lang: "pl"`.
- [ ] `metadata.appleWebApp` (`capable`, `statusBarStyle`, `title`) w `app/layout.tsx`.
- [ ] Sprawdzić w buildzie: `/manifest.webmanifest`, linki w `<head>`, instalacja na Androidzie (Chrome) i iOS (Safari „Do ekranu początkowego”).

### Faza O: zamknięcie etapu

- [ ] ARCHITECTURE.md: opis wersji mobilnej (powłoka, tokeny `data-ui="mobile"`, URL `formularz`/`ekran`, gesty, `Drawer`, ikony kategorii, PWA).
- [ ] PLAN.md: etap 4 oznaczony jako zrobiony, przeniesione rzeczy do etapu 5.
- [ ] **Do sprawdzenia w przeglądarce / na telefonie:** dolna nawigacja i „Wstecz”, notch i pasek gestów (`safe-area`), klawiatura przy polu kwoty, przesuwanie wierszy przy przewijaniu, panele z dołu, przełączanie wersji bez utraty stanu, oba motywy, instalacja PWA.

## Poza zakresem etapu 4

- Tryb offline, service worker, powiadomienia push (także dzwonek z grafiki).
- Nowy wygląd wersji komputerowej (tokeny działają tylko w mobile).
- Zakres kwot i dat w filtrach (etap 2, „Zostaje”).
- Dynamiczny zakres lat (zostaje `YEAR_ITEMS`).
- Wybór ikony kategorii przez użytkownika (wymagałby kolumny w bazie).
