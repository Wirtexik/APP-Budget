// Czysta logika przesunięcia wiersza w lewo (odsłonięcie akcji jak w iOS Mail).
// Przesunięcie jest ujemne: 0 = zamknięty, `-actionsWidth` = akcje odsłonięte.

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
