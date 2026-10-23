"use client";

// Ustawienie urządzenia: wartość w localStorage + zapytanie `matchMedia`
// (np. motyw systemu, szerokość ekranu), do czytania przez `useSyncExternalStore`.
// Powiadamia o zapisie w tej karcie, o zmianie w innej karcie (`storage`)
// i o zmianie zapytania (np. motyw systemu, obrót telefonu).
//
// localStorage może rzucić wyjątek (tryb prywatny, zablokowane dane strony) –
// wtedy ustawienie działa jak niezapisane.

import { useSyncExternalStore } from "react";

export interface PreferenceStore {
  subscribe: (listener: () => void) => () => void;
  readStored: () => string | null;
  readMatches: () => boolean;
  write: (value: string | null) => void;
}

export function createPreferenceStore(key: string, query: string): PreferenceStore {
  const listeners = new Set<() => void>();

  function subscribe(listener: () => void) {
    const media = window.matchMedia(query);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) listener();
    };
    listeners.add(listener);
    media.addEventListener("change", listener);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      media.removeEventListener("change", listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function readStored() {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function write(value: string | null) {
    try {
      if (value === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, value);
    } catch {
      // Bez zapisu – wybór i tak nie przetrwa odświeżenia.
    }
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe,
    readStored,
    readMatches: () => window.matchMedia(query).matches,
    write,
  };
}

// Na serwerze (i przy hydratacji) – brak zapisu i niespełnione zapytanie.
const serverStored = () => null;
const serverMatches = () => false;

export function usePreference(store: PreferenceStore) {
  const stored = useSyncExternalStore(store.subscribe, store.readStored, serverStored);
  const matches = useSyncExternalStore(store.subscribe, store.readMatches, serverMatches);
  return { stored, matches };
}
