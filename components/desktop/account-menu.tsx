"use client";

import { ChevronDown, LogOut, MonitorSmartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiVariant } from "@/lib/hooks/use-ui-variant";
import {
  UI_CHOICES,
  choiceFromOverride,
  overrideFromChoice,
  type UiChoice,
} from "@/lib/ui-variant";

// Menu konta w nagłówku: login, wersja interfejsu i wylogowanie.
export function AccountMenu({ login, onSignOut }: { login: string; onSignOut: () => void }) {
  const { override, setOverride } = useUiVariant();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" aria-label={`Konto: ${login}`} />}
      >
        <span
          aria-hidden
          className="flex size-6 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-emerald-500 text-xs font-semibold text-white uppercase"
        >
          {login.charAt(0) || "?"}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{login}</span>
        <ChevronDown className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            Zalogowano jako{" "}
            <span className="font-semibold text-foreground">{login}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-1.5">
            <MonitorSmartphone className="size-3.5" />
            Wersja interfejsu
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={choiceFromOverride(override)}
            onValueChange={(value: UiChoice) => setOverride(overrideFromChoice(value))}
          >
            {UI_CHOICES.map((choice) => (
              <DropdownMenuRadioItem key={choice.value} value={choice.value}>
                {choice.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onSignOut}>
          <LogOut />
          Wyloguj
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
