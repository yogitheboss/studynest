import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ThemeProviderContext,
  type Theme,
  type ThemeProviderState,
} from "@/hooks/use-theme";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

function getInitialTheme(storageKey: string, defaultTheme: Theme): Theme {
  const stored = localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return defaultTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "info-hub-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    getInitialTheme(storageKey, defaultTheme)
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const setTheme = useCallback(
    (next: Theme) => {
      localStorage.setItem(storageKey, next);
      setThemeState(next);
    },
    [storageKey]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const value = useMemo<ThemeProviderState>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
