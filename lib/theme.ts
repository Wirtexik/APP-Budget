// Motyw (czysta logika): „Systemowy” (domyślny, idzie za `prefers-color-scheme`)
// albo „Jasny” – wymuszony jasny, zapisany w localStorage. Osobnej opcji
// „Ciemny” nie ma. Ciemny motyw to klasa `dark` na <html> (`@custom-variant dark`
// w globals.css).

export type Theme = "light" | "dark";
export type ThemePreference = "light" | "system";

export const THEME_STORAGE_KEY = "motyw";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Tło strony (`--background` z globals.css) – pasek przeglądarki na telefonie. */
export const THEME_COLORS: Record<Theme, string> = {
  light: "#ffffff",
  dark: "#0a0a0a",
};

// Każda inna wartość (np. „dark” z wcześniejszej wersji) to „Systemowy”.
export const parseThemePreference = (value: string | null): ThemePreference =>
  value === "light" ? "light" : "system";

export const resolveTheme = (preference: ThemePreference, systemDark: boolean): Theme =>
  preference === "system" && systemDark ? "dark" : "light";

export const toggleThemePreference = (preference: ThemePreference): ThemePreference =>
  preference === "system" ? "light" : "system";

// Skrypt wstawiany do <head> przed renderem: ustawia klasę od razu, żeby przy
// ciemnym motywie nie mignął jasny ekran. Musi działać bez Reacta i bundla,
// więc powtarza `resolveTheme` w zwykłym JS.
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});var d=p!=="light"&&matchMedia(${JSON.stringify(
  DARK_QUERY
)}).matches;var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light"}catch(_){}})()`;
