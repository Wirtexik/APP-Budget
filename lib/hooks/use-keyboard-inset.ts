"use client";

import { useSyncExternalStore } from "react";

// Wysokość klawiatury ekranowej w px (0, gdy schowana). iOS przy otwartej
// klawiaturze nie zmniejsza układu strony, tylko `visualViewport`, więc
// przycisk przyklejony do dołu chowałby się pod klawiaturą. Chrome na
// Androidzie zwykle zmniejsza układ i wtedy wynik to 0.

function subscribe(listener: () => void) {
  const viewport = window.visualViewport;
  viewport?.addEventListener("resize", listener);
  viewport?.addEventListener("scroll", listener);
  return () => {
    viewport?.removeEventListener("resize", listener);
    viewport?.removeEventListener("scroll", listener);
  };
}

function getInset() {
  const viewport = window.visualViewport;
  if (!viewport) return 0;
  return Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
}

export function useKeyboardInset() {
  return useSyncExternalStore(subscribe, getInset, () => 0);
}
