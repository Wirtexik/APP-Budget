"use client";

import { useEffect, useId, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useKeyboardInset } from "@/lib/hooks/use-keyboard-inset";

// Ekran na pełnym ekranie nad powłoką (formularz, „Więcej”). Otwarcie i
// zamknięcie idą przez URL, więc systemowe „Wstecz” też go zamyka. Stopka
// (`footer`, np. „Zapisz”) jest przyklejona do dołu i podnosi się nad
// klawiaturę ekranową.
export function FullScreen({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const keyboardInset = useKeyboardInset();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background"
    >
      <header className="sticky top-0 z-10 flex items-center gap-1 bg-background/80 px-2 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 backdrop-blur-md">
        <Button
          variant="ghost"
          className="size-11"
          aria-label="Zamknij"
          onClick={onClose}
          autoFocus
        >
          <ArrowLeft className="size-6" />
        </Button>
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
      </header>
      <div className="flex flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
      {footer && (
        <div
          className="sticky z-10 bg-background/80 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md"
          style={{ bottom: keyboardInset }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
