@AGENTS.md

# Zasady pracy

* Radykalne zarządzanie kontekstem: Nie przeszukuj całego projektu. Używaj `.gitignore`. Szukaj tylko w plikach wskazanych w prompcie.
* Architektura Zadań Atomowych: Pracuj małymi krokami. Zanim napiszesz kod całej funkcji, zapytaj o zgodę na architekturę.
* Przerywanie Pętli Śmierci: Jeśli próba naprawy błędu (np. z TypeScript lub kompilacji) nie powiedzie się 3 razy z rzędu, ZATRZYMAJ SIĘ. Zwróć podsumowanie błędu i czekaj na moją decyzję.
* Struktura kodu: Używaj React Server Components gdzie to możliwe. Styluj używając Tailwind. Pilnuj ścisłego typowania TypeScript (żadnych `any`). Komponenty mają być modularne i zapisywane w odpowiednich folderach.
* Odwołuj się do `ARCHITECTURE.md` przed wprowadzaniem zmian w bazie danych.
* Zamykanie zadań z `DO_ZROBIENIA.md`: to tylko checklista rzeczy jeszcze niezrobionych. Gdy zadanie jest skończone (cztery sprawdzenia zielone) i zaakceptuję jego finalną wersję, opisz zmianę w odpowiednim pliku .md (zwykle `ARCHITECTURE.md`, a `README.md`, jeśli dotyczy funkcji widocznych dla użytkownika) i usuń zadanie z `DO_ZROBIENIA.md`. Przed moją akceptacją nie usuwaj zadania ani nie przenoś jego opisu.
