"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/hooks/use-theme";
import { toggleThemePreference } from "@/lib/theme";

// Przełącznik motywu jednym kliknięciem, wspólny dla obu wersji:
// „Systemowy” (księżyc, domyślny) ↔ „Jasny” (słońce).
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const system = preference === "system";
  const label = system
    ? "Motyw systemowy – kliknij, aby włączyć jasny"
    : "Motyw jasny – kliknij, aby włączyć systemowy";

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => setPreference(toggleThemePreference(preference))}
    >
      {system ? <Moon /> : <Sun />}
    </Button>
  );
}
