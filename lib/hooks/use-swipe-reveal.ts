"use client";

import { useRef, useState, type MouseEvent, type PointerEvent } from "react";

import { clampOffset, settleOffset, swipeAxis, type SwipeAxis } from "@/lib/swipe";

interface Gesture {
  pointerId: number;
  x: number;
  y: number;
  /** Przesunięcie wiersza w chwili dotknięcia (0 albo `-actionsWidth`). */
  from: number;
  axis: SwipeAxis;
}

// Przesunięcie wiersza w lewo, które odsłania akcje (logika w `lib/swipe.ts`).
// Sterowany z listy (`open`/`onOpenChange`), żeby odsłonięty był najwyżej jeden
// wiersz. Wiersz potrzebuje `touch-action: pan-y`: przewijanie w pionie zostaje
// po stronie przeglądarki (kończy gest przez `pointercancel`).
export function useSwipeReveal({
  open,
  onOpenChange,
  actionsWidth,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionsWidth: number;
}) {
  const gesture = useRef<Gesture | null>(null);
  // Kliknięcie po przeciągnięciu nie może otworzyć edycji.
  const swallowClick = useRef(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);

  const restOffset = open ? -actionsWidth : 0;

  function end(event: PointerEvent<HTMLElement>, settle: boolean) {
    const g = gesture.current;
    if (!g || g.pointerId !== event.pointerId) return;
    gesture.current = null;
    if (g.axis !== "horizontal") return;
    swallowClick.current = true;
    if (settle) {
      const next = settleOffset(g.from + event.clientX - g.x, actionsWidth) !== 0;
      if (next !== open) onOpenChange(next);
    }
    setDragOffset(null);
  }

  const handlers = {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (!event.isPrimary || event.button !== 0) return;
      swallowClick.current = false;
      gesture.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        from: restOffset,
        axis: "pending",
      };
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const g = gesture.current;
      if (!g || g.pointerId !== event.pointerId) return;
      const dx = event.clientX - g.x;
      if (g.axis === "pending") {
        g.axis = swipeAxis(dx, event.clientY - g.y);
        if (g.axis === "vertical") {
          gesture.current = null;
          return;
        }
        if (g.axis === "pending") return;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      setDragOffset(clampOffset(g.from + dx, actionsWidth));
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      end(event, true);
    },
    onPointerCancel(event: PointerEvent<HTMLElement>) {
      end(event, false);
    },
    // Dotknięcie odsłoniętego wiersza tylko go zamyka (jak w iOS Mail).
    onClickCapture(event: MouseEvent<HTMLElement>) {
      if (!swallowClick.current && !open) return;
      swallowClick.current = false;
      event.preventDefault();
      event.stopPropagation();
      if (open) onOpenChange(false);
    },
  };

  return { offset: dragOffset ?? restOffset, dragging: dragOffset !== null, handlers };
}
