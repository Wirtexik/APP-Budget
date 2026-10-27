import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeSync } from "@/lib/hooks/use-theme";
import { THEME_COLORS, THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// `latin-ext` – polskie litery (ą, ę, ł, ś…) są poza podzbiorem `latin`.
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Budżet",
  description: "Aplikacja do zarządzania budżetem",
  // Ekran początkowy iOS. `default`, nie `black-translucent`: treść nie wchodzi
  // pod pasek statusu. Ikona to app/apple-icon.png.
  appleWebApp: {
    capable: true,
    title: "Budżet",
    statusBarStyle: "default",
  },
};

// `width=device-width, initial-scale=1` Next dodaje sam. `viewportFit: "cover"`
// rozciąga stronę pod wycięcia ekranu, więc stałe paski (dolna nawigacja)
// muszą brać odstęp z `env(safe-area-inset-*)`.
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Klasę `dark` i `color-scheme` ustawia skrypt przed hydratacją, stąd
    // `suppressHydrationWarning` (dotyczy tylko atrybutów samego <html>).
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ThemeSync />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
