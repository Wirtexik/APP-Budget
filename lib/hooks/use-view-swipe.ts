"use client";

import { useRef, type MouseEvent, type PointerEvent } from "react";

import { swipeAxis, viewSwipeStep, type SwipeAxis } from "@/lib/swipe";

interface Gesture {
  pointerId: number;
  x: number;
  y: number;
  axis: SwipeAxis;
}

// Przesunięcie w bok po treści widoku przełącza widok (logika w `lib/swipe.ts`).
// Pomija gesty zaczęte na wierszu z akcjami (`[data-swipe-id]` – tam przesunięcie
// odsłania „Edytuj/Usuń”) i w panelach z dołu (portal: zdarzenia Reacta dochodzą
// tu, choć element nie leży w DOM w środku). Kontener potrzebuje
// `touch-action: pan-y`, żeby przeglądarka nie przejęła ruchu w bok.
export function useViewSwipe({
  enabled,
  onSwipe,
}: {
  enabled: boolean;
  onSwipe: (step: 1 | -1) => void;
}) {
  const gesture = useRef<Gesture | null>(null);
  // Puszczenie po przesunięciu nie może kliknąć karty czy przycisku.
  const swallowClick = useRef(false);

  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      gesture.current = null;
      swallowClick.current = false;
      const target = event.target as Element;
      if (
        !enabled ||
        !event.isPrimary ||
        event.pointerType === "mouse" ||
        !event.currentTarget.contains(target) ||
        target.closest("[data-swipe-id]")
      ) {
        return;
      }
      gesture.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        axis: "pending",
      };
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const g = gesture.current;
      if (!g || g.pointerId !== event.pointerId || g.axis !== "pending") return;
      g.axis = swipeAxis(event.clientX - g.x, event.clientY - g.y);
      if (g.axis === "vertical") gesture.current = null;
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      const g = gesture.current;
      if (!g || g.pointerId !== event.pointerId) return;
      gesture.current = null;
      if (g.axis !== "horizontal") return;
      swallowClick.current = true;
      const step = viewSwipeStep(event.clientX - g.x, event.clientY - g.y);
      if (step !== null) onSwipe(step);
    },
    onPointerCancel(event: PointerEvent<HTMLElement>) {
      if (gesture.current?.pointerId === event.pointerId) gesture.current = null;
    },
    onClickCapture(event: MouseEvent<HTMLElement>) {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}
