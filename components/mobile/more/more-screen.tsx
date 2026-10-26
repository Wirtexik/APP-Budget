"use client";

import { useMemo, useState, type ReactNode } from "react";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";

import { FullScreen } from "@/components/mobile/full-screen";
import { CategoryDrawer } from "@/components/mobile/more/category-drawer";
import { DeleteCategoryDrawer } from "@/components/mobile/more/delete-category-drawer";
import { Segmented, type SegmentedOption } from "@/components/mobile/segmented";
import type { Category, CategoryRef, CategoryType } from "@/lib/budget";
import { DEFAULT_CATEGORIES, ownCategories } from "@/lib/categories";
import { categoryStyle } from "@/lib/category-style";
import { useBudgetData } from "@/lib/hooks/budget-data";
import { useTheme } from "@/lib/hooks/use-theme";
import { useUiVariant } from "@/lib/hooks/use-ui-variant";
import { signOut } from "@/lib/supabase";
import type { ThemePreference } from "@/lib/theme";
import {
  UI_CHOICES,
  choiceFromOverride,
  overrideFromChoice,
} from "@/lib/ui-variant";

const THEME_OPTIONS: SegmentedOption<ThemePreference>[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Jasny" },
];

const CATEGORY_SECTIONS: { type: CategoryType; title: string }[] = [
  { type: "wydatek", title: "Wydatki" },
  { type: "przychod", title: "Przychody" },
];

const CARD =
  "overflow-hidden rounded-3xl border border-glass-border bg-glass shadow-(--shadow-soft) backdrop-blur-xl";

// Ekran „Więcej” (ekran 12 makiety): konto, kategorie, wygląd, wersja
// interfejsu i wylogowanie. Kategorie domyślne są bez akcji.
export function MoreScreen({ login, onClose }: { login: string; onClose: () => void }) {
  const { categories } = useBudgetData();
  const { preference, setPreference } = useTheme();
  const { override, setOverride } = useUiVariant();

  // Panel dodawania/edycji: `key` zaczyna każde otwarcie od świeżego stanu.
  const [editor, setEditor] = useState<{ open: boolean; category: Category | null; key: number }>(
    { open: false, category: null, key: 0 }
  );
  const [removing, setRemoving] = useState<Category | null>(null);

  const own = useMemo(() => ownCategories(categories), [categories]);

  function openEditor(category: Category | null) {
    setEditor((prev) => ({ open: true, category, key: prev.key + 1 }));
  }

  return (
    <FullScreen title="Więcej" onClose={onClose}>
      <div className="flex flex-col gap-6 pt-2">
        <section className={`${CARD} flex items-center gap-4 p-4`}>
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-(image:--gradient-primary) text-2xl font-semibold text-primary-foreground uppercase shadow-[0_6px_16px_-6px_var(--glow)]"
          >
            {login.charAt(0) || "?"}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Zalogowany jako</p>
            <p className="truncate text-xl font-bold">{login}</p>
          </div>
        </section>

        <Group title="Kategorie">
          <div className={CARD}>
            {CATEGORY_SECTIONS.map(({ type, title }) => (
              <div key={type}>
                <h4 className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground">
                  {title}
                </h4>
                <ul className="divide-y divide-border/60">
                  {DEFAULT_CATEGORIES.filter((c) => c.type === type).map((c) => (
                    <CategoryRow key={c.name} category={c}>
                      <span className="rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
                        Domyślna
                      </span>
                    </CategoryRow>
                  ))}
                  {own
                    .filter((c) => c.type === type)
                    .map((c) => (
                      <CategoryRow key={c.id} category={c}>
                        <button
                          type="button"
                          aria-label={`Edytuj kategorię ${c.name}`}
                          onClick={() => openEditor(c)}
                          className="flex size-11 items-center justify-center rounded-xl text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <Pencil className="size-4.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Usuń kategorię ${c.name}`}
                          onClick={() => setRemoving(c)}
                          className="flex size-11 items-center justify-center rounded-xl text-destructive outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <Trash2 className="size-4.5" />
                        </button>
                      </CategoryRow>
                    ))}
                </ul>
              </div>
            ))}
            <button
              type="button"
              onClick={() => openEditor(null)}
              className="flex min-h-13 w-full items-center justify-center gap-2 border-t border-border/60 bg-primary/5 font-semibold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
            >
              <Plus className="size-4.5" />
              Dodaj kategorię
            </button>
          </div>
        </Group>

        <Group title="Ustawienia">
          <div className={`${CARD} divide-y divide-border/60`}>
            <div className="flex items-center justify-between gap-4 p-4">
              <span className="font-medium">Wygląd</span>
              <Segmented
                label="Wygląd"
                options={THEME_OPTIONS}
                value={preference}
                onChange={setPreference}
                className="w-44"
              />
            </div>
            <div className="flex flex-col gap-3 p-4">
              <span className="font-medium">Wersja interfejsu</span>
              <Segmented
                label="Wersja interfejsu"
                options={UI_CHOICES}
                value={choiceFromOverride(override)}
                onChange={(choice) => setOverride(overrideFromChoice(choice))}
              />
              <p className="text-xs text-muted-foreground">
                „Automatycznie” wybiera wersję wg szerokości ekranu.
              </p>
            </div>
          </div>
        </Group>

        <button
          type="button"
          onClick={signOut}
          className={`${CARD} flex min-h-14 items-center justify-center gap-2 text-lg font-semibold text-destructive outline-none focus-visible:ring-3 focus-visible:ring-ring/50`}
        >
          <LogOut className="size-5" />
          Wyloguj się
        </button>
      </div>

      <CategoryDrawer
        key={editor.key}
        open={editor.open}
        onOpenChange={(open) => setEditor((prev) => ({ ...prev, open }))}
        category={editor.category}
      />
      <DeleteCategoryDrawer category={removing} onClose={() => setRemoving(null)} />
    </FullScreen>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function CategoryRow({ category, children }: { category: CategoryRef; children: ReactNode }) {
  const { icon: Icon, color } = categoryStyle(category);
  return (
    <li className="flex min-h-14 items-center gap-3 px-4 py-1.5">
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}26`, color }}
      >
        <Icon className="size-4.5" />
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
      <span className="flex shrink-0 items-center">{children}</span>
    </li>
  );
}
