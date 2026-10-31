"use client";

import { Hammer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { currency } from "@/lib/budget";
import { useBreakPiggyBank } from "@/lib/hooks/use-break-piggy-bank";

// Potwierdzenie rozbicia skarbonki w panelu z dołu. Kwota jest tu zawsze
// widoczna – to ona trafi do budżetu.
export function BreakPiggyBankDrawer({
  open,
  amount,
  onClose,
}: {
  open: boolean;
  amount: number;
  onClose: () => void;
}) {
  const { breaking, breakPiggyBank } = useBreakPiggyBank();

  async function handleBreak() {
    if (await breakPiggyBank(amount)) onClose();
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next && !breaking) onClose();
      }}
    >
      <DrawerContent>
        <DrawerHeader className="items-center text-center">
          <span
            aria-hidden
            className="mb-2 flex size-16 items-center justify-center rounded-full bg-(image:--gradient-primary) text-white"
          >
            <Hammer className="size-8" />
          </span>
          <DrawerTitle className="text-xl">Rozbić skarbonkę?</DrawerTitle>
          <DrawerDescription className="leading-relaxed">
            <strong className="text-foreground">{currency.format(amount)}</strong> wróci do
            budżetu jako przychód „Ze skarbonki” z dzisiejszą datą. Kolejne wrzucenia zaczną
            nową skarbonkę.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter>
          <Button
            disabled={breaking}
            onClick={handleBreak}
            className="h-12 rounded-2xl bg-(image:--gradient-primary) text-base font-semibold text-white shadow-[0_10px_28px_-10px_var(--glow)]"
          >
            {breaking ? "Rozbijanie…" : "Rozbij"}
          </Button>
          <Button
            variant="secondary"
            disabled={breaking}
            onClick={onClose}
            className="h-12 rounded-2xl text-base font-semibold"
          >
            Anuluj
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
