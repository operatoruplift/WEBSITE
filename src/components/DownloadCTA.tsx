"use client";

import { useEffect, useState } from 'react';
import { detectOS, optionFor, type OSKey } from '@/config/downloads';
import { AppleIcon, WindowsIcon, LinuxIcon } from './Icons';

/**
 * Map an OS key to its brand icon. The primary button shows this icon
 * so the user gets a clear visual cue that the download targets their
 * platform (replaces the older generic download arrow).
 */
const OS_ICONS: Record<OSKey, React.ComponentType<{ className?: string }>> = {
    macos: AppleIcon,
    windows: WindowsIcon,
    linux: LinuxIcon,
};

/**
 * Download CTA, renders a single platform-smart primary button. The OS
 * is detected from the user agent and the icon, label, and link all
 * follow that detection automatically.
 *
 * The "Other downloads" dropdown was removed in PR #310 because the
 * Hero already has a primary "Sign in and connect Gmail" CTA, and a
 * second OS-picker dropdown next to the desktop button read as
 * repetitive. Users on a different OS can still find installers via
 * /docs and the marketing pages link there.
 */
export function DownloadCTA({ className = '' }: { className?: string }) {
    // SSR-safe default: macOS. The useEffect below upgrades to the
    // actual detection result on the client so hydration stays stable.
    const [selectedOS, setSelectedOS] = useState<OSKey>(() => {
        if (typeof window === 'undefined') return 'macos';
        try { return detectOS(); } catch { return 'macos'; }
    });

    useEffect(() => {
        const detected = detectOS();
        if (detected !== selectedOS) setSelectedOS(detected);
    }, [selectedOS]);

    const current = optionFor(selectedOS);
    const OsIcon = OS_ICONS[selectedOS];

    return (
        <div className={`inline-flex items-center ${className}`} data-testid="download-cta-root">
            <a
                href={current.url}
                data-testid="download-primary"
                data-os={current.os}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F97316] hover:bg-[#F97316]/90 text-white px-5 py-3 text-sm font-bold uppercase tracking-widest transition-colors"
            >
                <OsIcon className="w-4 h-4" />
                <span>{current.ctaLabel}</span>
            </a>
        </div>
    );
}
