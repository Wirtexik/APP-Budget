"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Category } from "@/lib/budget";
import { useRemoveCategory } from "@/lib/hooks/use-category-actions";

// Potwierdzenie usunięcia kategorii w panelu z dołu. Czy kategoria jest używana,
// sprawdza `useRemoveCategory` po potwierdzeniu (wynik w komunikacie).
// `category === null` oznacza „zamknięte”.
export function DeleteCategoryDrawer({
  category,
  onClose,
}: {
  category: Category | null;
  onClose: () => void;
}) {
  const { removingId, remove } = useRemoveCategory();
  const removing = removingId !== null;

  async function handleDelete() {
    if (!category) return;
    await remove(category);
    onClose();
  }

  return (
    <Drawer
      open={category !== null}
      onOpenChange={(open) => {
        if (!open && !removing) onClose();
      }}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Usunąć kategorię „{category?.name}”?</DrawerTitle>
          <DrawerDescription>
            Kategorię z transakcjami lub zleceniami stałymi trzeba najpierw opróżnić.
          </DrawerDescription>
        </DrawerHeader>

        <DrawerFooter>
          <Button
            variant="destructive"
            disabled={removing}
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-destructive text-base font-semibold text-white hover:bg-destructive/90"
          >
            {removing ? "Usuwanie…" : "Usuń"}
          </Button>
          <Button
            variant="secondary"
            disabled={removing}
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
