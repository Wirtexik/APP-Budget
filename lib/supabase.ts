import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Tworzony leniwie, bo createClient rzuca wyjątek przy pustym URL/kluczu
// (zmienne w .env.local są początkowo puste).
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  client = createClient(url, anonKey);
  return client;
}

// Przekierowanie na /login robi listener `onAuthStateChange` w SessionGate –
// jedno miejsce dla obu wersji i dla wylogowania w innej karcie. `signOut()`
// usuwa sesję lokalnie nawet przy błędzie sieci, więc zdarzenie zawsze przyjdzie.
export function signOut() {
  void getSupabase().auth.signOut();
}
