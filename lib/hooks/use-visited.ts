"use client";

import { useState } from "react";

// Widoki odwiedzone choć raz. Ukryty widok zostaje zamontowany od pierwszego
// otwarcia, więc nie ginie jego stan (suwak Miesiąc/Rok w Raportach, niezapisane
// formularze), a dane zleceń i roku nadal pobierają się leniwie.
export function useVisited<T>(current: T): ReadonlySet<T> {
  const [visited, setVisited] = useState<ReadonlySet<T>>(() => new Set([current]));
  if (!visited.has(current)) {
    const next = new Set(visited).add(current);
    setVisited(next);
    return next;
  }
  return visited;
}
