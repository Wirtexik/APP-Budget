"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  DARK_QUERY,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  parseThemePreference,
  resolveTheme,
  type Theme,
  type ThemePreference,
} from "@/lib/theme";
import { createPreferenceStore, usePreference } from "@/lib/hooks/preference-store";

const themeStore = createPreferenceStore(THEME_STORAGE_KEY, DARK_QUERY);

export function useTheme() {
  const { stored, matches } = usePreference(themeStore);
  const preference = parseThemePreference(stored);
  const setPreference = useCallback(
    // „Systemowy” to brak zapisu – wtedy działa też domyślnie.
    (next: ThemePreference) => themeStore.write(next === "light" ? "light" : null),
    []
  );
  return { preference, theme: resolveTheme(preference, matches), setPreference };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  // Pasek przeglądarki: przy wymuszonym jasnym obie wersje <meta> (jasna
  // i ciemna wg systemu) dostają kolor jasnego motywu.
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", THEME_COLORS[theme]));
}

const noSubscribe = () => () => {};

/** Pilnuje klasy `dark` na <html> po zmianie wyboru albo motywu systemu. */
export function ThemeSync() {
  const { theme } = useTheme();
  // Przy hydratacji `theme` to jeszcze wartość z serwera („jasny”) – nie
  // ruszamy wtedy klasy, którą ustawił już THEME_INIT_SCRIPT.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  useEffect(() => {
    if (hydrated) applyTheme(theme);
  }, [hydrated, theme]);
  return null;
}
