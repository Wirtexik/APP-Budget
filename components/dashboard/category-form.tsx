"use client";

import { useMemo, useState, type FormEvent } from "react";
import { FolderPlus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EditCategoryDialog } from "@/components/dashboard/edit-category-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TYPE_ITEMS,
  TYPE_LABEL,
  type Category,
  type CategoryType,
  type Id,
} from "@/lib/budget";
import { ownCategories } from "@/lib/categories";
import { getSupabase } from "@/lib/supabase";

export function CategoryForm({
  userId,
  categories,
  onSaved,
}: {
  userId: string;
  categories: Category[];
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("wydatek");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<Id | null>(null);

  // `editKey` wymusza świeży stan formularza przy każdym otwarciu edycji.
  const [editingCategory, setEditingCategory] = useState<Category | null>(
    null
  );
  const [editKey, setEditKey] = useState(0);

  const own = useMemo(() => ownCategories(categories), [categories]);

  function openEdit(category: Category) {
    setEditingCategory(category);
    setEditKey((k) => k + 1);
  }

  async function handleRemove(category: Category) {
    setRemovingId(category.id);
    const supabase = getSupabase();

    const blocked = (count?: number) =>
      toast.error(`Nie można usunąć kategorii „${category.name}”`, {
        description: `Ma przypisane transakcje${
          count ? ` (${count})` : ""
        }. Usuń je lub przenieś do innej kategorii i spróbuj ponownie.`,
        duration: 7000,
      });

    // Sprawdzamy z góry, bo przy kluczu obcym z ON DELETE CASCADE baza usunęłaby
    // kategorię razem z jej transakcjami.
    const { count, error: countError } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("category_id", category.id);

    if (countError) {
      toast.error("Nie udało się sprawdzić transakcji kategorii", {
        description: countError.message,
      });
    } else if ((count ?? 0) > 0) {
      blocked(count ?? undefined);
    } else {
      const { data, error } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id)
        .eq("user_id", userId)
        .select("id");

      if (error?.code === "23503") {
        // Naruszenie klucza obcego – transakcja pojawiła się w międzyczasie.
        blocked();
      } else if (error) {
        toast.error("Nie udało się usunąć kategorii", {
          description: error.message,
        });
      } else if (!data?.length) {
        // Przy braku uprawnień (RLS) Supabase nie zgłasza błędu, tylko usuwa 0 wierszy.
        toast.error("Nie usunięto kategorii", {
          description: "Nie istnieje albo brak uprawnień do usuwania.",
        });
      } else {
        toast.success(`Usunięto kategorię „${category.name}”`);
      }
    }

    await onSaved();
    setRemovingId(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Podaj nazwę kategorii.");
      return;
    }

    setSaving(true);
    const { error } = await getSupabase()
      .from("categories")
      .insert({ user_id: userId, name: trimmed, type });
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setName("");
    await onSaved();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderPlus className="size-4 text-muted-foreground" />
          Nowa kategoria
        </CardTitle>
        <CardDescription>Pogrupuj swoje przychody i wydatki.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-name">Nazwa</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category-type">Typ</Label>
            <Select
              items={TYPE_ITEMS}
              value={type}
              onValueChange={(v) => v && setType(v as CategoryType)}
              disabled={saving}
            >
              <SelectTrigger id="category-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            {saving ? "Zapisywanie…" : "Dodaj kategorię"}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-2 border-t pt-4">
          <h3 className="text-sm font-medium">Twoje kategorie</h3>
          {own.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nie masz jeszcze własnych kategorii.
            </p>
          ) : (
            <ul className="flex max-h-32 flex-col divide-y overflow-y-auto">
              {own.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-1.5"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{c.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                        c.type === "przychod"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-orange-500/15 text-orange-700 dark:text-orange-300"
                      }`}
                    >
                      {TYPE_LABEL[c.type]}
                    </span>
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edytuj kategorię ${c.name}`}
                      title="Edytuj kategorię"
                      className="text-muted-foreground hover:text-foreground"
                      disabled={removingId !== null}
                      onClick={() => openEdit(c)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Usuń kategorię ${c.name}`}
                      title="Usuń kategorię"
                      className="text-muted-foreground hover:text-destructive"
                      disabled={removingId !== null}
                      onClick={() => handleRemove(c)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      <EditCategoryDialog
        key={editKey}
        category={editingCategory}
        userId={userId}
        onClose={() => setEditingCategory(null)}
        onSaved={onSaved}
      />
    </Card>
  );
}
