import * as React from "react";

import { cn } from "@/lib/utils";

// Szkielet treści w trakcie wczytywania (wzór shadcn). `span` z `block`, żeby
// dał się wstawić także w akapit. Kolor z `currentColor`, więc pasuje do tła
// karty w obu motywach. Ukryty przed czytnikiem ekranu – stan ogłasza otoczenie.
function Skeleton({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="skeleton"
      aria-hidden
      className={cn("block animate-pulse rounded-md bg-current/10", className)}
      {...props}
    />
  );
}

export { Skeleton };
