'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const THEME_KEY = 'uplift_theme';

/** localStorage can throw on access in strict-privacy / sandboxed contexts. */
function readDark(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(THEME_KEY) === 'dark';
  } catch {
    return false;
  }
}

interface ThemeValue {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeValue>({ isDark: false, toggleTheme: () => {} });

/**
 * App-local dark mode, provided once at the app root so the `ou-dark`
 * class is applied on the <html> element no matter which screen is
 * mounted first. (Previously the class was only toggled by screens that
 * called useTheme, so opening straight to a screen that doesn't, like
 * Home, left a dark-mode user in light mode until they hit Journey.)
 *
 * Uses `ou-dark` (not `dark`) and its own storage key so the marketing
 * site's theming stays independent.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(readDark);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('ou-dark', isDark);
    try {
      window.localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Storage blocked: the class toggle above still applies the theme.
    }
  }, [isDark]);

  const value: ThemeValue = { isDark, toggleTheme: () => setIsDark((d) => !d) };
  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
