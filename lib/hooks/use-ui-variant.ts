"use client";

import { useCallback } from "react";

import {
  MOBILE_QUERY,
  UI_STORAGE_KEY,
  parseUiVariant,
  resolveUiVariant,
  type UiVariant,
} from "@/lib/ui-variant";
import { createPreferenceStore, usePreference } from "@/lib/hooks/preference-store";

const uiStore = createPreferenceStore(UI_STORAGE_KEY, MOBILE_QUERY);

// Bez ręcznego wyboru wersja idzie za szerokością ekranu na bieżąco (obrót
// tabletu, zwężenie okna). Stan nie ginie przy przełączeniu: zakładka, okres
// i filtry są w URL, a dane w providerze nad obiema wersjami.
export function useUiVariant() {
  const { stored, matches } = usePreference(uiStore);
  const override = parseUiVariant(stored);
  /** `null` = automatycznie, wg szerokości ekranu. */
  const setOverride = useCallback(
    (next: UiVariant | null) => uiStore.write(next),
    []
  );
  return { variant: resolveUiVariant(override, matches), override, setOverride };
}
