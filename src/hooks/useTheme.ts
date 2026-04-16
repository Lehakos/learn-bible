import { useLayoutEffect, useState } from 'react';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

const THEME_STORAGE_KEY = 'bible-verses-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function isTheme(value: string | null): value is Theme {
  return value === Theme.LIGHT || value === Theme.DARK;
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return Theme.LIGHT;
  return window.matchMedia(DARK_QUERY).matches ? Theme.DARK : Theme.LIGHT;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return Theme.LIGHT;
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isTheme(savedTheme)) return savedTheme;
  return getSystemTheme();
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.classList.toggle(Theme.DARK, theme === Theme.DARK);
    root.classList.toggle(Theme.LIGHT, theme === Theme.LIGHT);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === Theme.DARK ? Theme.LIGHT : Theme.DARK));
  }

  return { theme, toggleTheme };
}
