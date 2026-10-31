// Czysta logika gestów: przesunięcie wiersza w lewo (odsłonięcie akcji jak w iOS Mail)
// i przełączanie widoków przesunięciem w bok (na dole pliku).
// Przesunięcie wiersza jest ujemne: 0 = zamknięty, `-actionsWidth` = akcje odsłonięte.

export type SwipeAxis = "pending" | "horizontal" | "vertical";

/** Ruch (px), poniżej którego kierunek gestu nie jest jeszcze rozstrzygnięty. */
export const SWIPE_SLOP = 8;

/** Część szerokości akcji, po przekroczeniu której wiersz zostaje otwarty. */
export const SWIPE_THRESHOLD = 0.4;

// Kierunek gestu po przesunięciu o (dx, dy) od miejsca dotknięcia. Pionowy oddaje
// gest przewijaniu listy; poziomy przesuwa wiersz. Remis rozstrzyga pion.
export function swipeAxis(dx: number, dy: number, slop = SWIPE_SLOP): SwipeAxis {
  if (Math.abs(dx) < slop && Math.abs(dy) < slop) return "pending";
  return Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
}

// Przesunięcie w trakcie gestu: nie w prawo od zamkniętego i nie dalej niż akcje.
export function clampOffset(offset: number, actionsWidth: number) {
  return Math.min(0, Math.max(-actionsWidth, offset));
}

// Pozycja po puszczeniu: otwarty, gdy wiersz przesunięto dalej niż próg.
export function settleOffset(
  offset: number,
  actionsWidth: number,
  threshold = SWIPE_THRESHOLD
) {
  return -clampOffset(offset, actionsWidth) > actionsWidth * threshold ? -actionsWidth : 0;
}

// Przesunięcie w bok poza wierszami przełącza widok (Kokpit ↔ Historia ↔ …).

/** Najmniejsze przesunięcie w bok (px), które przełącza widok. */
export const VIEW_SWIPE_DISTANCE = 60;

// Krok w kolejności widoków po puszczeniu: w lewo = następny (1), w prawo =
// poprzedni (-1), za krótko albo bardziej w pionie = `null`.
export function viewSwipeStep(
  dx: number,
  dy: number,
  distance = VIEW_SWIPE_DISTANCE
): 1 | -1 | null {
  if (swipeAxis(dx, dy) !== "horizontal" || Math.abs(dx) < distance) return null;
  return dx < 0 ? 1 : -1;
}
