'use client';

import React, { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

/**
 * ThemeToggle, dark <-> light switcher for the marketing site.
 *
 * Founder feedback 2026-05-24: "also a light mode toggle".
 *
 * Wires the `theme-light` class on `<html>` so the existing
 * .theme-light CSS variable overrides in globals.css take effect
 * across every marketing page. On first paint, picks up the user's
 * stored preference from localStorage, falling back to
 * prefers-color-scheme.
 *
 * The pre-mount inline script in app/layout.tsx applies the stored
 * theme before React hydrates, preventing the flash of wrong theme.
 * This component handles the runtime toggle + persistence only.
 */
const STORAGE_KEY = 'op-uplift-theme';

function readPreferredTheme(): Theme {
    // Brand default flipped to LIGHT 2026-05-26 per founder direction:
    // first-time visitors land on the light palette and dark mode is
    // an opt-in via this toggle. prefers-color-scheme is intentionally
    // not honored on first load so the brand default is consistent
    // regardless of OS setting; the stored preference takes over once
    // the user has clicked the toggle at least once.
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return 'light';
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === 'light') {
        root.classList.add('theme-light');
        root.dataset.theme = 'light';
    } else {
        root.classList.remove('theme-light');
        root.dataset.theme = 'dark';
    }
}

interface ThemeToggleProps {
    className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
    const [theme, setTheme] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const initial = readPreferredTheme();
        setTheme(initial);
        applyTheme(initial);
        setMounted(true);
    }, []);

    function toggle() {
        const next: Theme = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        applyTheme(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // localStorage write can throw in privacy/incognito modes; ignore.
        }
    }

    // Render a placeholder while we read localStorage so SSR + first paint
    // never flash the wrong icon. The pre-mount inline script in layout.tsx
    // handles the actual visual theme; this guard is just about the icon
    // matching it.
    if (!mounted) {
        return (
            <button
                type="button"
                aria-label="Theme toggle"
                className={`inline-flex items-center justify-center w-9 h-9 rounded-md border border-foreground/[0.14] bg-foreground/[0.02] text-muted ${className}`}
                disabled
            >
                <span className="w-4 h-4 inline-block" aria-hidden="true" />
            </button>
        );
    }

    const isLight = theme === 'light';
    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-pressed={isLight}
            title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            className={[
                'inline-flex items-center justify-center w-9 h-9 rounded-md',
                'border border-foreground/[0.14] bg-foreground/[0.02]',
                'text-foreground hover:border-foreground/40 hover:bg-foreground/[0.06]',
                'transition-colors',
                className,
            ].join(' ')}
        >
            {isLight ? <MoonIcon /> : <SunIcon />}
        </button>
    );
};

function SunIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="w-4 h-4"
        >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="w-4 h-4"
        >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

export default ThemeToggle;
