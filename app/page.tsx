import { AppShell } from "@/components/app-shell";
import { SessionGate } from "@/components/auth/session-gate";

// Strona główna (Server Component): bramka sesji i aplikacja w wersji
// dobranej do urządzenia. Wszystko poniżej działa po stronie klienta.
export default function HomePage() {
  return (
    <SessionGate>
      <AppShell />
    </SessionGate>
  );
}
