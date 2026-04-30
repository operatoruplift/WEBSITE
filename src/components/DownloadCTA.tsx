"use client";

import { useEffect, useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { detectOS, downloadOptions, optionFor, type OSKey } from '@/config/downloads';
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
 * Download CTA, renders a platform-smart primary button plus an
 * "Other downloads" dropdown. Defaults to the detected OS, but the
 * user can always pick a different installer.
 *
 * Detection runs once on mount and only picks a default. The URLs
 * themselves come from downloadOptions() which reads environment
 * variables (see config/downloads.ts).
 */
export function DownloadCTA({ className = '' }: { className?: string }) {
    const options = downloadOptions();
    // SSR-safe default: macOS. The useEffect below upgrades to the
    // actual detection result on the client so hydration stays stable.
    // Lazy initializer: detectOS() reads window.navigator on the
    // client. SSR returns 'macos' as a safe default; the client picks
    // the real OS on first render without an extra setState/effect.
    const [selectedOS, setSelectedOS] = useState<OSKey>(() => {
        if (typeof window === 'undefined') return 'macos';
        try { return detectOS(); } catch { return 'macos'; }
    });
    const [manuallyPicked, setManuallyPicked] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Re-detect only if the user hasn't manually picked. Initial
        // detection ran in the lazy initializer above, this hook is
        // here for the corner case where detectOS() result depends
        // on something that could change post-mount (rare).
        if (!manuallyPicked) {
            const detected = detectOS();
            if (detected !== selectedOS) setSelectedOS(detected);
        }
    }, [manuallyPicked, selectedOS]);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const current = optionFor(selectedOS);

    const pick = (os: OSKey) => {
        setSelectedOS(os);
        setManuallyPicked(true);
        setMenuOpen(false);
    };

    const OsIcon = OS_ICONS[selectedOS];

    return (
        <div ref={rootRef} className={`relative inline-flex items-center gap-2 ${className}`} data-testid="download-cta-root">
            <a
                href={current.url}
                data-testid="download-primary"
                data-os={current.os}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F97316] hover:bg-[#F97316]/90 text-white px-5 py-3 text-sm font-bold uppercase tracking-widest transition-colors"
            >
                <OsIcon className="w-4 h-4" />
                <span>{current.ctaLabel}</span>
            </a>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setMenuOpen(m => !m)}
                    aria-label="Other downloads"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    data-testid="download-other-toggle"
                    className="inline-flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-3 py-3 text-xs font-mono uppercase tracking-widest transition-colors"
                >
                    Other downloads
                    <ChevronDown size={12} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                    <div
                        role="menu"
                        aria-label="Select installer"
                        data-testid="download-menu"
                        className="absolute top-full right-0 mt-2 w-56 rounded-lg bg-[#0c0c0c] border border-white/10 shadow-2xl z-50 overflow-hidden"
                    >
                        {options.map(opt => (
                            <button
                                key={opt.os}
                                type="button"
                                role="menuitem"
                                onClick={() => pick(opt.os)}
                                data-testid={`download-option-${opt.os}`}
                                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-xs font-mono uppercase tracking-wider transition-colors ${
                                    selectedOS === opt.os
                                        ? 'bg-[#F97316]/10 text-[#F97316]'
                                        : 'text-gray-300 hover:bg-white/5'
                                }`}
                            >
                                <span>{opt.label}</span>
                                <span className="text-gray-500">{opt.fileSuffix}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
