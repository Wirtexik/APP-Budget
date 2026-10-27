"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { currency, formatDate, type CategoryType } from "@/lib/budget";
import { categoryStyle } from "@/lib/category-style";
import { share, type CategoryGroup, type ReportGroups } from "@/lib/report-groups";

const TYPE_SECTIONS: { type: CategoryType; title: string; dot: string }[] = [
  { type: "wydatek", title: "Wydatki", dot: "bg-expense" },
  { type: "przychod", title: "Przychody", dot: "bg-income" },
];

// „Struktura transakcji” (ekran 11) – zarazem legenda: typ → kategorie (udział,
// pasek, kwota) → wpisy. Na starcie rozwinięte Wydatki, jak na makiecie.
export function ReportStructure({
  grouped,
  periodNoun,
}: {
  grouped: ReportGroups;
  /** Okres w frazie „w tym ___” („miesiącu”, „roku”). */
  periodNoun: string;
}) {
  return (
    <section
      aria-labelledby="report-structure-title"
      className="overflow-hidden rounded-3xl border border-glass-border bg-glass shadow-(--shadow-soft) backdrop-blur-xl"
    >
      <h2
        id="report-structure-title"
        className="px-5 pt-4 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        Struktura transakcji
      </h2>

      <Accordion multiple defaultValue={["wydatek"]} className="px-5 pb-2">
        {TYPE_SECTIONS.map(({ type, title, dot }) => {
          const section = grouped[type];
          return (
            <AccordionItem key={type} value={type} className="border-border/60">
              <AccordionTrigger className="min-h-14 items-center text-base hover:no-underline">
                <span className="flex flex-1 items-center justify-between gap-3 pr-2">
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden className={`size-3 rounded-full ${dot}`} />
                    <span className="font-semibold">{title}</span>
                  </span>
                  <span className="font-bold tabular-nums">
                    {currency.format(section.total)}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {section.groups.length === 0 ? (
                  <p className="py-2 text-muted-foreground">Brak wpisów w tym {periodNoun}.</p>
                ) : (
                  <Accordion multiple>
                    {section.groups.map((group) => (
                      <CategoryItem
                        key={group.category.id}
                        group={group}
                        percent={share(group.total, section.total)}
                      />
                    ))}
                  </Accordion>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}

function CategoryItem({ group, percent }: { group: CategoryGroup; percent: number }) {
  const { category, total, transactions } = group;
  const { icon: Icon, color } = categoryStyle(category);

  return (
    <AccordionItem value={category.id} className="border-none">
      <AccordionTrigger className="min-h-14 items-center gap-2 hover:no-underline">
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}26`, color }}
            >
              <Icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">
              {category.name}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {percent}% · {transactions.length}
              </span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums">{currency.format(total)}</span>
          </span>
          <span aria-hidden className="ml-11 h-1.5 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full"
              style={{ width: `${percent}%`, backgroundColor: color }}
            />
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <ul className="ml-11 divide-y divide-border/60 rounded-2xl bg-muted/50 px-3">
          {transactions.map((t) => (
            <li key={t.id} className="grid grid-cols-[auto_1fr_auto] items-baseline gap-3 py-2.5">
              <span className="text-xs whitespace-nowrap text-muted-foreground">
                {formatDate(t.date)}
              </span>
              <span className="truncate">{t.description || "—"}</span>
              <span className="whitespace-nowrap tabular-nums">
                {currency.format(Number(t.amount))}
              </span>
            </li>
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
}
