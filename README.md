# Budżet

Aplikacja do prowadzenia domowego budżetu: wydatki i przychody, kategorie,
historia z wyszukiwaniem i filtrami, zlecenia stałe oraz raporty miesięczne
i roczne. Dwie wersje interfejsu (komputerowa i mobilna) na wspólnych danych;
na telefonie da się ją zainstalować jak aplikację (PWA). Zbudowana w Next.js
(App Router) z backendem w Supabase.

## Funkcje

- **Logowanie loginem i hasłem.** Supabase wymaga adresu e-mail, więc do loginu
  automatycznie dokładana jest domena `@budzet.local` (`lib/auth.ts`).
- **Wybór miesiąca i roku** dotyczy wszystkich widoków (karty, listy, raporty).
  Widok, okres i filtry są w adresie URL, więc działa „Wstecz” i odświeżenie.
- **Kokpit:** saldo, przychody, wydatki i wykorzystanie budżetu wybranego
  miesiąca.
- **Historia:** transakcje miesiąca z edycją i usuwaniem, wyszukiwarką (od
  pierwszej litery, początki wyrazów w opisie i kategorii), filtrami (uznania,
  obciążenia, zlecenia stałe, kategorie) i sortowaniem (data, kwota).
- **Zlecenia stałe:** cykliczne wpisy (dziennie, co tydzień, co miesiąc, co
  rok) z wstrzymaniem, edycją i podglądem nadchodzących terminów. Wykonują się
  przy otwarciu aplikacji i raz dziennie przez `pg_cron`.
- **Raporty:** wykorzystanie budżetu (miesiąc lub rok) i rozwijana struktura
  Wydatki / Przychody → kategorie → transakcje.
- **Kategorie:** domyślne (Jedzenie, Transport, Wynagrodzenie…) są zdefiniowane
  w kodzie (`lib/categories.ts`) i trafiają do bazy dopiero przy pierwszym
  użyciu; własne można dodawać, edytować i usuwać. Kategorii z transakcjami
  lub zleceniami nie da się usunąć.
- **Dwie wersje interfejsu:** komputerowa (zakładki, tabele, okna dialogowe)
  i mobilna (dolna nawigacja, formularze na pełnym ekranie, panele z dołu,
  przesuwanie wierszy palcem). Wersja wybiera się sama wg szerokości ekranu
  albo ręcznie: „Automatycznie / Komputerowa / Mobilna” w menu konta (komputer)
  lub w ekranie „Więcej” (telefon).
- **Motyw:** systemowy (jasny lub ciemny wg urządzenia) albo zawsze jasny.
- **Instalacja na telefonie (PWA):** Android – Chrome, „Zainstaluj aplikację”;
  iOS – Safari, „Udostępnij” → „Do ekranu początkowego”. Bez trybu offline.

## Stos technologiczny

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui
(Base UI), Lucide, Recharts, Sonner oraz Supabase (`@supabase/supabase-js`).
Testy: Vitest.

## Uruchomienie

Wymagania: Node.js 20+ i projekt w [Supabase](https://supabase.com).

1. Zainstaluj zależności:

   ```bash
   npm install
   ```

2. Skonfiguruj zmienne środowiskowe: skopiuj `.env.example` jako `.env.local`
   i uzupełnij wartościami z Supabase (*Project Settings → API*):

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

3. Utwórz tabele i reguły RLS: wklej zawartość
   [`supabase/schema.sql`](supabase/schema.sql) w *SQL Editor* i uruchom.
   Potem, w kolejności nazw, uruchom pliki z
   [`supabase/migrations/`](supabase/migrations/) (zlecenia stałe i `pg_cron`).

4. Dodaj użytkownika w *Authentication → Users → Add user*. Adres e-mail musi
   mieć postać `login@budzet.local` (użytkownik wpisze w aplikacji tylko
   `login`). Zaznacz *Auto Confirm User*, bo adres nie istnieje naprawdę.

5. Uruchom aplikację:

   ```bash
   npm run dev
   ```

   i otwórz [http://localhost:3000](http://localhost:3000).

## Skrypty

| Polecenie           | Opis                                   |
| ------------------- | -------------------------------------- |
| `npm run dev`       | serwer deweloperski                    |
| `npm run build`     | build produkcyjny                      |
| `npm start`         | uruchomienie buildu produkcyjnego      |
| `npm run lint`      | ESLint                                 |
| `npm run typecheck` | sprawdzenie typów TypeScript           |
| `npm test`          | testy Vitest (czysta logika w `lib/`)  |

## Struktura projektu

```
app/                  layout, strona główna (bramka sesji), /login, manifest PWA, ikony
components/
  app-shell.tsx       wspólna podstawa: stan z URL, provider danych, wybór wersji
  desktop/            wersja komputerowa (zakładki, tabele, okna dialogowe)
  mobile/             wersja mobilna (powłoka, widoki, formularze, panele z dołu)
  shared/             komponenty używane przez obie wersje
  ui/                 komponenty shadcn/ui
lib/                  czysta logika (z testami Vitest), zapytania do Supabase
  hooks/              provider danych i hooki wspólne dla obu wersji
public/icons/         ikony PWA
design/mobile/        makiety i grafiki wersji mobilnej (poza aplikacją)
supabase/
  schema.sql          schemat bazy + RLS
  migrations/         zlecenia stałe, pg_cron
```

Szczegóły (baza, przepływ danych, konwencje, wersja mobilna):
[ARCHITECTURE.md](ARCHITECTURE.md). Zrobione etapy i decyzje: [PLAN.md](PLAN.md),
historia wersji mobilnej: [ETAP4_MOBILE.md](ETAP4_MOBILE.md), otwarte zadania:
[DO_ZROBIENIA.md](DO_ZROBIENIA.md).

## Uwagi

- Klucz `NEXT_PUBLIC_SUPABASE_ANON_KEY` jest publiczny z założenia, więc
  bezpieczeństwo danych zapewniają reguły **Row Level Security** z
  `supabase/schema.sql`. Bez nich każdy użytkownik zobaczyłby cudze wpisy.
- Przy wdrożeniu (np. na Vercel) ustaw te same zmienne środowiskowe co w
  `.env.local`.
- Plik `.env.local` jest w `.gitignore` i nie powinien trafić do repozytorium.
