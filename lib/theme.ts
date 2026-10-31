// Motyw (czysta logika): „Systemowy” (domyślny, idzie za `prefers-color-scheme`),
// „Jasny” albo „Ciemny” – wymuszone, zapisane w localStorage. Ciemny motyw to
// klasa `dark` na <html> (`@custom-variant dark` w globals.css).

export type Theme = "light" | "dark";
export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "motyw";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Tło strony (`--background` z globals.css) – pasek przeglądarki na telefonie. */
export const THEME_COLORS: Record<Theme, string> = {
  light: "#ffffff",
  dark: "#0a0a0a",
};

// Każda inna wartość to „Systemowy”.
export const parseThemePreference = (value: string | null): ThemePreference =>
  value === "light" || value === "dark" ? value : "system";

export const resolveTheme = (preference: ThemePreference, systemDark: boolean): Theme =>
  preference === "system" ? (systemDark ? "dark" : "light") : preference;

const THEME_CYCLE: ThemePreference[] = ["system", "light", "dark"];

/** Przełącznik jednym kliknięciem: systemowy → jasny → ciemny → systemowy. */
export const toggleThemePreference = (preference: ThemePreference): ThemePreference =>
  THEME_CYCLE[(THEME_CYCLE.indexOf(preference) + 1) % THEME_CYCLE.length];

// Skrypt wstawiany do <head> przed renderem: ustawia klasę od razu, żeby przy
// ciemnym motywie nie mignął jasny ekran. Musi działać bez Reacta i bundla,
// więc powtarza `resolveTheme` w zwykłym JS.
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});var d=p==="dark"||(p!=="light"&&matchMedia(${JSON.stringify(
  DARK_QUERY
)}).matches);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light"}catch(_){}})()`;
