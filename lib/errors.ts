// Komunikaty błędów Supabase dla użytkownika. Wszystkie zapytania z lib/ zwracają
// tekst z `errorMessage`, a nie surowe (angielskie) `error.message`.
import type { PostgrestError } from "@supabase/supabase-js";

/** Komunikaty zastępujące domyślne dla wybranych kodów (np. błędy zleceń stałych). */
export type ErrorOverrides = Partial<Record<string, string>>;

// Kody PostgreSQL (5 znaków) i PostgREST (PGRST…).
const MESSAGES: Record<string, string> = {
  "23503": "Powiązany wpis nie istnieje albo nie należy do Ciebie.",
  "23505": "Taki wpis już istnieje.",
  "23514": "Niepoprawne dane – sprawdź wpisane wartości.",
  "22003": "Kwota jest za duża.",
  "42501": "Brak uprawnień do tej operacji.",
  PGRST301: "Sesja wygasła – zaloguj się ponownie.",
  PGRST303: "Sesja wygasła – zaloguj się ponownie.",
};

// fetch() przy braku sieci zgłasza TypeError, który supabase-js przekazuje jako `message`.
const NETWORK_ERROR = /failed to fetch|networkerror|load failed|fetch failed/i;

export function errorMessage(
  error: Pick<PostgrestError, "code" | "message">,
  overrides: ErrorOverrides = {}
): string {
  const known = overrides[error.code] ?? MESSAGES[error.code];
  if (known) return known;
  if (NETWORK_ERROR.test(error.message)) {
    return "Brak połączenia z serwerem – sprawdź internet i spróbuj ponownie.";
  }
  return error.message;
}
