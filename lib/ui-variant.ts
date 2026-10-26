// Wersja interfejsu (czysta logika): mobilna albo komputerowa.
//
// Wybór po stronie klienta, bez `proxy.ts` i User-Agent: sesja Supabase jest
// w przeglądarce, więc pulpit i tak renderuje się dopiero po jej sprawdzeniu,
// a serwer nie ma nic do pokazania wcześniej. Ręczny wybór (localStorage) ma
// pierwszeństwo; bez niego decyduje szerokość ekranu.

export type UiVariant = "mobile" | "desktop";

export const UI_STORAGE_KEY = "wersja";
/** Poniżej `md` z Tailwinda (768px). */
export const MOBILE_QUERY = "(max-width: 767px)";

export const parseUiVariant = (value: string | null): UiVariant | null =>
  value === "mobile" || value === "desktop" ? value : null;

export const resolveUiVariant = (override: UiVariant | null, narrow: boolean): UiVariant =>
  override ?? (narrow ? "mobile" : "desktop");

/** Wybór w przełączniku: „auto” to brak ręcznego wyboru (`null`). */
export type UiChoice = UiVariant | "auto";

export const UI_CHOICES: { value: UiChoice; label: string }[] = [
  { value: "auto", label: "Automatycznie" },
  { value: "desktop", label: "Komputerowa" },
  { value: "mobile", label: "Mobilna" },
];

export const choiceFromOverride = (override: UiVariant | null): UiChoice => override ?? "auto";

export const overrideFromChoice = (choice: UiChoice): UiVariant | null =>
  choice === "auto" ? null : choice;
