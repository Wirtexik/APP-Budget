"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/hooks/use-theme";
import { toggleThemePreference, type ThemePreference } from "@/lib/theme";

const LABELS: Record<ThemePreference, string> = {
  system: "Motyw systemowy – kliknij, aby włączyć jasny",
  light: "Motyw jasny – kliknij, aby włączyć ciemny",
  dark: "Motyw ciemny – kliknij, aby włączyć systemowy",
};

const ICONS: Record<ThemePreference, LucideIcon> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

// Przełącznik motywu jednym kliknięciem (desktop):
// „Systemowy” (domyślny) → „Jasny” → „Ciemny” → „Systemowy”.
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const label = LABELS[preference];
  const Icon = ICONS[preference];

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={() => setPreference(toggleThemePreference(preference))}
    >
      <Icon />
    </Button>
  );
}
