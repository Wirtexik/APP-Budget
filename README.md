# Budżet

Aplikacja do prowadzenia domowego budżetu: wydatki i przychody, kategorie,
historia z edycją oraz raporty miesięczne. Zbudowana w Next.js (App Router)
z backendem w Supabase.

## Funkcje

- **Logowanie loginem i hasłem.** Supabase wymaga adresu e-mail, więc do loginu
  automatycznie dokładana jest domena `@budzet.local` (`lib/auth.ts`).
- **Globalny filtr miesiąca i roku** u góry strony. Wszystkie dane (karty,
  tabele, raporty) dotyczą wybranego miesiąca.
- **Kokpit:** karty Saldo / Przychody / Wydatki, formularz wydatku, szybkie
  dodawanie przychodu (przycisk „+”), zarządzanie kategoriami i 5 ostatnich
  transakcji.
- **Historia:** pełna lista transakcji miesiąca z edycją i usuwaniem.
- **Raporty:** wykres kołowy wydatków według kategorii oraz rozwijane drzewo
  Wydatki / Przychody → kategorie → transakcje.
- **Kategorie domyślne** (Jedzenie, Transport, Wynagrodzenie…) są zdefiniowane
  w kodzie (`lib/categories.ts`) i trafiają do bazy dopiero przy pierwszym użyciu.
  Kategorię z przypisanymi transakcjami nie da się usunąć.
- Interfejs responsywny (mobile-first).

## Stos technologiczny

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui
(Base UI), Recharts, Sonner oraz Supabase (`@supabase/supabase-js`).

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

## Struktura projektu

```
app/
  page.tsx            bramka sesji: niezalogowany trafia na /login
  login/page.tsx      ekran logowania
  layout.tsx          layout główny (czcionki, komunikaty Toaster)
components/
  dashboard/          komponenty ekranu głównego (Dashboard i jego części)
  ui/                 komponenty shadcn/ui
lib/
  auth.ts             login <-> e-mail (@budzet.local)
  budget.ts           typy, formatowanie, daty, sumy
  categories.ts       kategorie domyślne i budowa list wyboru
  queries.ts          zapytania do Supabase (dane miesiąca, zapis wpisów)
  supabase.ts         klient Supabase (tworzony przy pierwszym użyciu)
supabase/
  schema.sql          przykładowy schemat bazy + RLS
```

## Uwagi

- Klucz `NEXT_PUBLIC_SUPABASE_ANON_KEY` jest publiczny z założenia, więc
  bezpieczeństwo danych zapewniają reguły **Row Level Security** z
  `supabase/schema.sql`. Bez nich każdy użytkownik zobaczyłby cudze wpisy.
- Przy wdrożeniu (np. na Vercel) ustaw te same zmienne środowiskowe co w
  `.env.local`.
- Plik `.env.local` jest w `.gitignore` i nie powinien trafić do repozytorium.
