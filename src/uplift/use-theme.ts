'use client';

import { useEffect, useState } from 'react';

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

/**
 * App-local dark mode. Uses the `ou-dark` class (not `dark`) on <html>
 * so the marketing site's own theming is never affected, and its own
 * storage key so the two theme systems stay independent.
 */
export function useTheme() {
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

  return { isDark, toggleTheme: () => setIsDark((d) => !d) };
}
