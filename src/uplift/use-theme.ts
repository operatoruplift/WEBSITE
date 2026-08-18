'use client';

import { useEffect, useState } from 'react';

/**
 * App-local dark mode. Uses the `ou-dark` class (not `dark`) on <html>
 * so the marketing site's own theming is never affected, and its own
 * storage key so the two theme systems stay independent.
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('uplift_theme') === 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('ou-dark');
      window.localStorage.setItem('uplift_theme', 'dark');
    } else {
      root.classList.remove('ou-dark');
      window.localStorage.setItem('uplift_theme', 'light');
    }
  }, [isDark]);

  return { isDark, toggleTheme: () => setIsDark((d) => !d) };
}
