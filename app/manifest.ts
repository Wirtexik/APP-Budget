import type { MetadataRoute } from "next";

import { THEME_COLORS } from "@/lib/theme";

// Manifest PWA (bez trybu offline i powiadomień). Ikony w public/icons/ powstają
// jednorazowo skryptem design/mobile/render-icons.sh. Kolory jak `viewport`
// w app/layout.tsx, żeby pasek i ekran startowy nie odbiegały od strony.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Budżet",
    short_name: "Budżet",
    description: "Aplikacja do zarządzania budżetem",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "pl",
    dir: "ltr",
    background_color: THEME_COLORS.light,
    theme_color: THEME_COLORS.light,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
